-- =====================================================================
-- Sicherheits-Fixes
--   1. Bestellpositionen: Material immer gegen die Abteilung prüfen
--   2. Verbrauchsmaterial nur beim ersten Abschluss abbuchen
--   3. MFA für alle Tabellen und RPCs durchsetzen
--   4. Wartende (pending) sind für normale Mitglieder unsichtbar
--   5. Querverweise zwischen Abteilungen verhindern
--   6. Ausleihdauer begrenzen, Verlängern nur als Mitglied
--   7. Storage: nur Bilder, max. 5 MB
--   8. Längenbegrenzung für Freitext
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Bestellpositionen: Abteilung IMMER prüfen (auch bei abgeschlossenen
--    Bestellungen), und auch beim Umhängen auf eine andere Bestellung
-- ---------------------------------------------------------------------
create or replace function intern.tg_item_pruefen() returns trigger
language plpgsql security definer set search_path = '' as $$
declare b public.bestellungen; frei int;
begin
  select * into b from public.bestellungen where id = new.bestellung_id;

  perform 1 from public.material m
  where m.id = new.material_id and m.abteilung_id = b.abteilung_id for update;
  if not found then
    raise exception 'Material % gehört nicht zu dieser Abteilung', new.material_id;
  end if;

  if b.status not in ('pending','created','delivered') then return new; end if;

  frei := intern.verfuegbar(new.material_id, b.von, b.bis, b.id);
  if frei < new.anzahl then
    raise exception 'Nicht genug verfügbar: % (frei: %, gewünscht: %)',
      (select name from public.material where id = new.material_id), frei, new.anzahl
      using hint = 'nicht_verfuegbar';
  end if;
  return new;
end $$;

drop trigger bestellung_items_pruefen on public.bestellung_items;
create trigger bestellung_items_pruefen
  before insert or update of anzahl, material_id, bestellung_id on public.bestellung_items
  for each row execute function intern.tg_item_pruefen();

-- ---------------------------------------------------------------------
-- 2. Verlauf + Verbrauchsmaterial: nur beim ERSTEN Abschluss abbuchen
--    (completed → delivered → completed buchte bisher jedes Mal ab)
-- ---------------------------------------------------------------------
create or replace function intern.tg_bestellung_log() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  fmt constant text := 'DD.MM.YYYY';
begin
  if tg_op = 'INSERT' then
    insert into public.bestellung_historie (bestellung_id, typ) values (new.id, 'erstellt');
    return null;
  end if;

  if new.status <> old.status then
    insert into public.bestellung_historie (bestellung_id, typ, text)
    values (new.id, new.status::text, case when new.status = 'rejected' then new.ablehnungsgrund end);

    if new.status = 'completed' and (
         select count(*) from public.bestellung_historie h
         where h.bestellung_id = new.id and h.typ = 'completed') = 1 then
      update public.material m
      set anzahl = greatest(m.anzahl - bi.anzahl, m.damaged + m.lost)
      from public.bestellung_items bi
      where bi.bestellung_id = new.id and bi.material_id = m.id and m.consumable;
    end if;
  end if;

  if new.von <> old.von or new.bis <> old.bis then
    insert into public.bestellung_historie (bestellung_id, typ, text)
    values (new.id, 'zeitraum', format('%s – %s',
      to_char(new.von at time zone 'Europe/Zurich', fmt),
      to_char(new.bis at time zone 'Europe/Zurich', fmt)));
  end if;
  return null;
end $$;

-- ---------------------------------------------------------------------
-- 3. MFA überall: Wer einen bestätigten zweiten Faktor hat, bekommt mit
--    einer reinen Passwort-Sitzung (aal1) gar nichts – nicht nur bei has_role.
-- ---------------------------------------------------------------------
create function public.mfa_ok() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select auth.jwt()->>'aal'), '') = 'aal2'
      or not exists (
        select 1 from auth.mfa_factors f
        where f.user_id = (select auth.uid()) and f.status = 'verified');
$$;
revoke execute on function public.mfa_ok() from public, anon;
grant  execute on function public.mfa_ok() to authenticated;

create or replace function public.has_role(p_abteilung uuid, p_min public.member_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.abteilung_members m
    where m.abteilung_id = p_abteilung
      and m.user_id = (select auth.uid())
      and m.role >= p_min)
  and public.mfa_ok();
$$;

-- Zusätzliche "restrictive" Policy auf jeder Tabelle: wird mit UND an alle
-- bestehenden Policies gehängt. Neue Tabellen später ebenfalls ergänzen!
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' and rowsecurity loop
    execute format('create policy "mfa" on public.%I as restrictive for all to authenticated
                    using (public.mfa_ok()) with check (public.mfa_ok())', t);
  end loop;
end $$;

-- RPCs mit security definer umgehen RLS → dort selbst prüfen
create or replace function public.bestellung_stornieren(p_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.mfa_ok() then
    raise exception 'Zwei-Faktor-Code erforderlich' using errcode = '42501';
  end if;
  update public.bestellungen set status = 'cancelled'
  where id = p_id and besteller_id = auth.uid() and status in ('pending','created');
  if not found then raise exception 'Bestellung nicht gefunden oder nicht mehr stornierbar'; end if;
end $$;

create or replace function public.abteilung_beitreten(p_slug text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_abt uuid;
begin
  if not public.mfa_ok() then
    raise exception 'Zwei-Faktor-Code erforderlich' using errcode = '42501';
  end if;
  select id into v_abt from public.abteilungen where slug = p_slug;
  if v_abt is null then raise exception 'Abteilung nicht gefunden'; end if;
  insert into public.abteilung_members (abteilung_id, user_id) values (v_abt, auth.uid())
  on conflict do nothing;
  return v_abt;
end $$;

-- ---------------------------------------------------------------------
-- 4. Profile: Wartende (pending) nur für Matchef/Admin sichtbar
-- ---------------------------------------------------------------------
create or replace function public.teilt_abteilung(p_other uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.abteilung_members a
    join public.abteilung_members b on b.abteilung_id = a.abteilung_id
    where a.user_id = (select auth.uid()) and a.role >= 'member' and b.user_id = p_other
      and (b.role >= 'guest' or a.role >= 'matchef'));
$$;

-- ---------------------------------------------------------------------
-- 5. Querverweise müssen in derselben Abteilung bleiben
-- ---------------------------------------------------------------------
create function intern.tg_material_kategorie_pruefen() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
       select 1 from public.material m
       join public.kategorien k on k.abteilung_id = m.abteilung_id
       where m.id = new.material_id and k.id = new.kategorie_id) then
    raise exception 'Kategorie und Material gehören nicht zur selben Abteilung';
  end if;
  return new;
end $$;

create function intern.tg_sammlung_item_pruefen() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
       select 1 from public.material m
       join public.sammlungen s on s.abteilung_id = m.abteilung_id
       where m.id = new.material_id and s.id = new.sammlung_id) then
    raise exception 'Sammlung und Material gehören nicht zur selben Abteilung';
  end if;
  return new;
end $$;

create trigger gleiche_abteilung before insert or update on public.material_kategorien
  for each row execute function intern.tg_material_kategorie_pruefen();
create trigger gleiche_abteilung before insert or update on public.sammlung_items
  for each row execute function intern.tg_sammlung_item_pruefen();

-- Schadensmeldung: verknüpfte Bestellung muss aus derselben Abteilung sein
create or replace function intern.tg_schaden_vorher() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    select abteilung_id into new.abteilung_id from public.material where id = new.material_id;
  else
    if new.material_id <> old.material_id or new.anzahl <> old.anzahl or new.typ <> old.typ then
      raise exception 'Material, Anzahl und Typ einer Meldung können nicht geändert werden';
    end if;
    if new.status <> old.status then
      if old.status in ('erledigt','abgeschrieben') then
        raise exception 'Abgeschlossene Meldungen können nicht wieder geöffnet werden';
      end if;
      new.bearbeitet_von := auth.uid();
      if new.status in ('erledigt','abgeschrieben') then new.erledigt_at := now(); end if;
    end if;
  end if;

  if new.bestellung_id is not null and not exists (
       select 1 from public.bestellungen b
       where b.id = new.bestellung_id and b.abteilung_id = new.abteilung_id) then
    raise exception 'Bestellung gehört nicht zu dieser Abteilung';
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 6. Ausleihdauer begrenzen (Matchefs dürfen länger), Verlängern nur
--    solange man noch Mitglied ist. MAX_DAUER bei Bedarf anpassen.
-- ---------------------------------------------------------------------
create or replace function public.bestellung_verlaengern(p_id bigint, p_bis timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
declare
  max_dauer constant interval := interval '3 months';
begin
  update public.bestellungen b set bis = p_bis
  where b.id = p_id and b.status in ('pending','created','delivered')
    and (public.has_role(b.abteilung_id, 'matchef')
         or (b.besteller_id = auth.uid()
             and public.has_role(b.abteilung_id, 'member')
             and p_bis <= b.von + max_dauer));
  if not found then raise exception 'Bestellung nicht gefunden oder nicht änderbar (max. 3 Monate)'; end if;
end $$;

create or replace function public.bestellung_erstellen(
  p_abteilung uuid, p_von timestamptz, p_bis timestamptz, p_items jsonb,
  p_stufe_id bigint default null, p_anlass_id bigint default null,
  p_gruppe_freitext text default null, p_kommentar text default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_id bigint;
  max_dauer constant interval := interval '3 months';
begin
  if not public.has_role(p_abteilung, 'member') then
    raise exception 'Keine Berechtigung' using errcode = '42501';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Warenkorb ist leer';
  end if;
  if p_stufe_id is null and p_anlass_id is null and nullif(trim(p_gruppe_freitext), '') is null then
    raise exception 'Bitte Stufe oder Anlass angeben';
  end if;
  if p_bis > p_von + max_dauer and not public.has_role(p_abteilung, 'matchef') then
    raise exception 'Eine Ausleihe dauert höchstens 3 Monate';
  end if;

  -- Alle Materialien in fester Reihenfolge sperren (verhindert Deadlocks)
  perform 1 from public.material
  where id in (select (e->>'material_id')::bigint from jsonb_array_elements(p_items) e)
  order by id for update;

  insert into public.bestellungen (abteilung_id, besteller_id, von, bis, stufe_id, anlass_id, gruppe_freitext, kommentar)
  values (p_abteilung, auth.uid(), p_von, p_bis, p_stufe_id, p_anlass_id,
          nullif(trim(p_gruppe_freitext), ''), p_kommentar)
  returning id into v_id;   -- Trigger prüft Stufe/Anlass

  insert into public.bestellung_items (bestellung_id, material_id, anzahl)
  select v_id, (e->>'material_id')::bigint, sum((e->>'anzahl')::int)
  from jsonb_array_elements(p_items) e
  group by 2 order by 2;    -- Trigger prüft jede Position

  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- 7. Storage: nur Bilder (kein SVG/HTML), max. 5 MB
--    (das Frontend komprimiert ohnehin auf ~0.5 MB)
-- ---------------------------------------------------------------------
update storage.buckets
set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'],
    file_size_limit    = 5 * 1024 * 1024
where id in ('material-bilder', 'schaden-fotos');

-- ---------------------------------------------------------------------
-- 8. Längenbegrenzung. "not valid" = bestehende Daten werden nicht
--    geprüft, neue/geänderte Zeilen schon.
-- ---------------------------------------------------------------------
alter table public.bestellungen
  add constraint bestellungen_kommentar_laenge         check (length(kommentar)         <= 2000) not valid,
  add constraint bestellungen_matchef_kommentar_laenge check (length(matchef_kommentar) <= 2000) not valid,
  add constraint bestellungen_ablehnungsgrund_laenge   check (length(ablehnungsgrund)   <= 2000) not valid,
  add constraint bestellungen_gruppe_freitext_laenge   check (length(gruppe_freitext)   <= 100)  not valid;
alter table public.bestellung_historie
  add constraint bestellung_historie_text_laenge check (length(text) <= 2000) not valid;
alter table public.schadensmeldungen
  add constraint schadensmeldungen_beschreibung_laenge check (length(beschreibung) <= 2000) not valid;
alter table public.profiles
  add constraint profiles_display_name_laenge check (length(display_name) <= 100) not valid;
alter table public.material
  add constraint material_name_laenge         check (length(name) <= 200)          not valid,
  add constraint material_beschreibung_laenge check (length(beschreibung) <= 5000) not valid,
  add constraint material_bilder_anzahl       check (cardinality(image_urls) <= 20) not valid;
