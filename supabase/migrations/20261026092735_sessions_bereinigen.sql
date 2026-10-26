-- Aufräumen zusätzlich: Login-Sitzungen (enthalten IP + Browser) nach 90 Tagen ohne Nutzung löschen.
-- Rest identisch mit 20261026074557_cleanup.sql.
create or replace function public.aufraeumen() returns setof text
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
  delete from public.bestellungen
  where status in ('completed', 'rejected', 'cancelled') and bis < grenze_3j;

  -- c) Änderungsprotokoll älter als 3 Jahre
  delete from public.audit_log where created_at < grenze_3j;

  -- d) Nie freigegebene Beitrittsanfragen nach 1 Jahr entfernen
  delete from public.abteilung_members where role = 'pending' and created_at < grenze_1j;

  -- e) Konten, die seit über 1 Jahr in keiner Abteilung sind
  delete from auth.users u
  using public.profiles p
  where p.id = u.id and p.ohne_mitgliedschaft_seit < grenze_1j;

  -- e2) NEU: Login-Sitzungen, die 90 Tage nicht benutzt wurden
  delete from auth.sessions where coalesce(updated_at, created_at) < now() - interval '90 days';

  -- f) Technische Cron-Protokolle
  delete from cron.job_run_details where end_time < now() - interval '30 days';
end $$;
