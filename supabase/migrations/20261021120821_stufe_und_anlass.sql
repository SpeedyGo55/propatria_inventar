-- =====================================================================
-- Bestellung: Stufe UND Anlass getrennt erfassen
--   gruppe_id  → stufe_id  (nur typ = 'stufe')
--   neu        → anlass_id (nur typ = 'anlass' oder 'sonstiges')
--   gruppe_freitext bleibt für "Anderes"
-- =====================================================================

-- 1. Spalten
alter table public.bestellungen rename column gruppe_id to stufe_id;
alter table public.bestellungen rename constraint bestellungen_gruppe_id_fkey to bestellungen_stufe_id_fkey;
alter table public.bestellungen
  add column anlass_id bigint constraint bestellungen_anlass_id_fkey references public.gruppen on delete set null;

create index on public.bestellungen (stufe_id);
create index on public.bestellungen (anlass_id);

-- 2. Typ prüfen: Stufe muss Stufe sein, Anlass muss Anlass sein, beide aus derselben Abteilung
create function intern.tg_bestellung_gruppen_pruefen() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.stufe_id is not null and not exists (
       select 1 from public.gruppen g
       where g.id = new.stufe_id and g.abteilung_id = new.abteilung_id and g.typ = 'stufe') then
    raise exception 'Ungültige Stufe';
  end if;
  if new.anlass_id is not null and not exists (
       select 1 from public.gruppen g
       where g.id = new.anlass_id and g.abteilung_id = new.abteilung_id and g.typ in ('anlass','sonstiges')) then
    raise exception 'Ungültiger Anlass';
  end if;
  return new;
end $$;

create trigger bestellungen_gruppen_pruefen
  before insert or update of stufe_id, anlass_id on public.bestellungen
  for each row execute function intern.tg_bestellung_gruppen_pruefen();

-- 3. bestellung_erstellen mit neuen Parametern
--    (alte Signatur löschen, sonst gibt es zwei Versionen und die API weiss nicht, welche)
drop function public.bestellung_erstellen(uuid, timestamptz, timestamptz, jsonb, bigint, text, text);

create function public.bestellung_erstellen(
  p_abteilung uuid, p_von timestamptz, p_bis timestamptz, p_items jsonb,
  p_stufe_id bigint default null, p_anlass_id bigint default null,
  p_gruppe_freitext text default null, p_kommentar text default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_id bigint;
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

-- 4. Kalender: Stufe und Anlass getrennt zurückgeben (Rückgabetyp ändert sich → neu anlegen)
drop function public.kalender_belegung(uuid, timestamptz, timestamptz);

create function public.kalender_belegung(p_abteilung uuid, p_von timestamptz, p_bis timestamptz)
returns table (bestellung_id bigint, von timestamptz, bis timestamptz, status public.bestellung_status,
               stufe text, anlass text, freitext text,
               material_id bigint, material text, anzahl int, eigene boolean)
language sql stable security definer set search_path = '' as $$
  select b.id, b.von, b.bis, b.status, st.name, an.name, b.gruppe_freitext,
         m.id, m.name, bi.anzahl, b.besteller_id = (select auth.uid())
  from public.bestellungen b
  join public.bestellung_items bi on bi.bestellung_id = b.id
  join public.material m on m.id = bi.material_id
  left join public.gruppen st on st.id = b.stufe_id
  left join public.gruppen an on an.id = b.anlass_id
  where b.abteilung_id = p_abteilung
    and b.status in ('pending','created','delivered')
    and b.von < p_bis and b.bis > p_von
    and public.has_role(p_abteilung, 'guest')
  order by b.von;
$$;

-- 5. iCal-Titel: "Wölfe – Herbstlager (HeLa)"
create or replace function public.ical_feed(p_token uuid)
returns table (bestellung_id bigint, abteilung text, von timestamptz, bis timestamptz,
               status public.bestellung_status, titel text, items text)
language sql stable security definer set search_path = '' as $$
  with u as (select user_id from public.ical_tokens where token = p_token)
  select b.id, a.name, b.von, b.bis, b.status,
         coalesce(nullif(concat_ws(' – ', st.name, an.name, b.gruppe_freitext), ''), p.display_name, 'Bestellung'),
         string_agg(bi.anzahl || '× ' || m.name, ', ' order by m.name)
  from u
  join public.abteilung_members am on am.user_id = u.user_id and am.role >= 'member'
  join public.bestellungen b on b.abteilung_id = am.abteilung_id
       and (b.besteller_id = u.user_id or am.role >= 'matchef')
  join public.abteilungen a on a.id = b.abteilung_id
  left join public.gruppen st on st.id = b.stufe_id
  left join public.gruppen an on an.id = b.anlass_id
  left join public.profiles p on p.id = b.besteller_id
  join public.bestellung_items bi on bi.bestellung_id = b.id
  join public.material m on m.id = bi.material_id
  where b.status in ('pending','created','delivered') and b.bis > now() - interval '60 days'
  group by b.id, a.name, st.name, an.name, p.display_name;
$$;

-- 6. Statistik pro Monat: Stufe und Anlass als eigene Spalten
drop view public.stat_ausleihen_monat;
create view public.stat_ausleihen_monat with (security_invoker = true) as
select b.abteilung_id, date_trunc('month', b.von)::date as monat,
       coalesce(st.name, 'ohne Stufe') as stufe,
       coalesce(an.name, b.gruppe_freitext, 'ohne Anlass') as anlass,
       count(*) as bestellungen
from public.bestellungen b
left join public.gruppen st on st.id = b.stufe_id
left join public.gruppen an on an.id = b.anlass_id
where b.status in ('delivered','completed')
group by 1, 2, 3, 4;

-- 7. Rechte für die neu angelegten Funktionen (Supabase gibt sonst auch anon Zugriff)
revoke execute on function public.bestellung_erstellen(uuid, timestamptz, timestamptz, jsonb, bigint, bigint, text, text) from public, anon;
grant  execute on function public.bestellung_erstellen(uuid, timestamptz, timestamptz, jsonb, bigint, bigint, text, text) to authenticated;
revoke execute on function public.kalender_belegung(uuid, timestamptz, timestamptz) from public, anon;
grant  execute on function public.kalender_belegung(uuid, timestamptz, timestamptz) to authenticated;
