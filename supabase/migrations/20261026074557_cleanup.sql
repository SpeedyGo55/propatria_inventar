-- =====================================================================
-- Automatisches Löschen gemäss Datenschutzerklärung
--   Konten: 1 Jahr ohne Mitgliedschaft
--   Bestellungen, Schadensmeldungen, Protokoll: 3 Jahre
-- =====================================================================
-- 0. Besteller darf auf NULL gesetzt werden (Konto gelöscht → "ohne Name"),
--    aber nie auf eine andere Person umgeschrieben werden.
create or replace function intern.tg_bestellung_pruefen() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  aktiv constant public.bestellung_status[] := array['pending','created','delivered'];
  it record; frei int;
begin
  if new.abteilung_id <> old.abteilung_id then
    raise exception 'Die Abteilung kann nicht geändert werden';
  end if;
  if new.besteller_id is distinct from old.besteller_id and new.besteller_id is not null then
    raise exception 'Der Besteller kann nicht geändert werden';
  end if;

  if new.status <> old.status and not (
       (old.status = 'pending'   and new.status in ('created','rejected','cancelled'))
    or (old.status = 'created'   and new.status in ('pending','delivered','rejected','cancelled'))
    or (old.status = 'delivered' and new.status in ('created','completed'))
    or (old.status = 'completed' and new.status = 'delivered')
    or (old.status in ('rejected','cancelled') and new.status = 'pending')
  ) then
    raise exception 'Statuswechsel % → % nicht erlaubt', old.status, new.status;
  end if;

  if new.status = any(aktiv)
     and (new.von <> old.von or new.bis <> old.bis or not (old.status = any(aktiv))) then
    for it in select bi.material_id, bi.anzahl from public.bestellung_items bi
              where bi.bestellung_id = new.id order by bi.material_id loop
      perform 1 from public.material where id = it.material_id for update;
      frei := intern.verfuegbar(it.material_id, new.von, new.bis, new.id);
      if frei < it.anzahl then
        raise exception 'Nicht genug verfügbar: % (frei: %, benötigt: %)',
          (select name from public.material where id = it.material_id), frei, it.anzahl
          using hint = 'nicht_verfuegbar';
      end if;
    end loop;
  end if;
  return new;
end $$;
-- 1. Seit wann ist ein Konto in keiner Abteilung mehr?
alter table public.profiles add column ohne_mitgliedschaft_seit timestamptz default now();
update public.profiles p set ohne_mitgliedschaft_seit = null
where exists (select 1 from public.abteilung_members m where m.user_id = p.id);

create function intern.tg_mitgliedschaft_zeitstempel() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set ohne_mitgliedschaft_seit = null where id = new.user_id;
  elsif not exists (select 1 from public.abteilung_members where user_id = old.user_id) then
    update public.profiles set ohne_mitgliedschaft_seit = now() where id = old.user_id;
  end if;
  return null;
end $$;

create trigger mitgliedschaft_zeitstempel
  after insert or delete on public.abteilung_members
  for each row execute function intern.tg_mitgliedschaft_zeitstempel();

-- 2. Protokoll: beim Aufräumen nichts protokollieren (sonst landen gelöschte Daten wieder im Log)
create or replace function intern.tg_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  if current_setting('app.aufraeumen', true) = 'on' then
    return null;
  end if;
  insert into public.audit_log (abteilung_id, tabelle, datensatz_id, aktion, alt, neu, user_id)
  values ((r->>'abteilung_id')::uuid, tg_table_name, coalesce(r->>'id', r->>'user_id'), lower(tg_op),
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end,
          auth.uid());
  return null;
end $$;

-- 3. Aufräumen. Gibt die Pfade der zu löschenden Schadens-Fotos zurück
--    (Dateien löscht die Edge Function über die Storage-API).
create function public.aufraeumen() returns setof text
language plpgsql security definer set search_path = '' as $$
declare
  grenze_3j constant timestamptz := now() - interval '3 years';
  grenze_1j constant timestamptz := now() - interval '1 year';
begin
  perform set_config('app.aufraeumen', 'on', true);  -- nur für diese Transaktion

  -- a) Abgeschlossene Schadensmeldungen älter als 3 Jahre
  return query
    with weg as (
      delete from public.schadensmeldungen
      where status in ('erledigt', 'abgeschrieben')
        and coalesce(erledigt_at, created_at) < grenze_3j
      returning foto_path
    )
    select foto_path from weg where foto_path is not null;

  -- b) Abgeschlossene Bestellungen, deren Ende über 3 Jahre zurückliegt
  --    (Positionen + Verlauf werden mitgelöscht; nie zurückgebrachtes Material bleibt)
  delete from public.bestellungen
  where status in ('completed', 'rejected', 'cancelled') and bis < grenze_3j;

  -- c) Änderungsprotokoll älter als 3 Jahre
  delete from public.audit_log where created_at < grenze_3j;

  -- d) Nie freigegebene Beitrittsanfragen nach 1 Jahr entfernen
  delete from public.abteilung_members where role = 'pending' and created_at < grenze_1j;

  -- e) Konten, die seit über 1 Jahr in keiner Abteilung sind
  --    (Profil, Kalender-Token werden mitgelöscht; in Bestellungen bleibt "ohne Name")
  delete from auth.users u
  using public.profiles p
  where p.id = u.id and p.ohne_mitgliedschaft_seit < grenze_1j;

  -- f) Technische Cron-Protokolle
  delete from cron.job_run_details where end_time < now() - interval '30 days';
end $$;

revoke execute on function public.aufraeumen() from public, anon, authenticated;
grant  execute on function public.aufraeumen() to service_role;

-- 4. Wöchentlich, Sonntag 03:30 UTC
select cron.schedule('aufraeumen', '30 3 * * 0',
  $$ select intern.edge_aufrufen('erinnerungen', '{"job":"aufraeumen"}') $$);
