-- supabase/tests/rls_test.sql – ausführen mit: npx supabase test db
-- Voraussetzung: frischer Stand (npx supabase db reset)
begin;
create extension if not exists pgtap with schema extensions;
select plan(30);

-- =========================================================
-- MEMBER (33333333-…)
-- =========================================================
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';


select ok((select count(*) from public.material) > 0,
  'Member sieht Material');

select throws_ok(
  $$ insert into public.material (abteilung_id, name) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Hack') $$,
  '42501', null, 'Member kann kein Material anlegen');

select results_eq(
  $$ select kommentar from public.bestellungen order by kommentar $$,
  $$ values ('seed-a') $$,
  'Member sieht nur eigene Bestellungen');

select is((select count(*) from public.abteilung_members)::int, 1,
  'Member sieht nur die eigene Mitgliedschaft');

select is((select count(*) from public.audit_log)::int, 0,
  'Member sieht kein Audit-Log');

select lives_ok(
  $$ select public.bestellung_erstellen(
       'aaaaaaaa-0000-0000-0000-000000000001', now() + interval '8 days', now() + interval '10 days',
       jsonb_build_array(jsonb_build_object('material_id', (select id from public.material where name = 'Spatz 6er'), 'anzahl', 2)),
       p_stufe_id => (select id from public.gruppen where name = 'Pfadis'),
       p_kommentar => 'test-ok') $$,
  'Member bestellt die letzten 2 freien Spatzen');

select throws_like(
  $$ select public.bestellung_erstellen(
       'aaaaaaaa-0000-0000-0000-000000000001', now() + interval '8 days', now() + interval '10 days',
       jsonb_build_array(jsonb_build_object('material_id', (select id from public.material where name = 'Spatz 6er'), 'anzahl', 1)),
       p_stufe_id => (select id from public.gruppen where name = 'Pfadis')) $$,
  '%Nicht genug verfügbar%',
  'Überbuchung wird abgelehnt');

select throws_like(
  $$ select public.bestellung_erstellen(
       'aaaaaaaa-0000-0000-0000-000000000001', now() + interval '30 days', now() + interval '31 days',
       jsonb_build_array(jsonb_build_object('material_id', (select id from public.material where name = 'Axt'), 'anzahl', 1))) $$,
  '%Stufe oder Anlass%',
  'Bestellung ohne Stufe/Anlass wird abgelehnt');

select throws_like(
  $$ select public.bestellung_erstellen(
       'aaaaaaaa-0000-0000-0000-000000000001', now() + interval '30 days', now() + interval '31 days',
       jsonb_build_array(jsonb_build_object('material_id', (select id from public.material where name = 'Axt'), 'anzahl', 1)),
       p_stufe_id => (select id from public.gruppen where name = 'Herbstlager (HeLa)')) $$,
  '%Ungültige Stufe%',
  'Anlass kann nicht als Stufe gesetzt werden');

select lives_ok(
  $$ select public.bestellung_erstellen(
       'aaaaaaaa-0000-0000-0000-000000000001', now() + interval '20 days', now() + interval '22 days',
       jsonb_build_array(jsonb_build_object('material_id', (select id from public.material where name = 'Spatz 6er'), 'anzahl', 4)),
       p_stufe_id => (select id from public.gruppen where name = 'Pfadis')) $$,
  'Anderer Zeitraum: alle 4 Spatzen verfügbar');

-- Status direkt ändern geht für Member nicht (0 Zeilen, kein Fehler)
update public.bestellungen set status = 'created' where kommentar = 'seed-a';
select is((select status::text from public.bestellungen where kommentar = 'seed-a'), 'pending',
  'Member kann Status nicht direkt ändern');

select lives_ok(
  $$ select public.bestellung_stornieren((select id from public.bestellungen where kommentar = 'test-ok')) $$,
  'Member storniert eigene Bestellung');

select throws_like(
  $$ select public.bestellung_stornieren((select id from public.bestellungen where kommentar = 'seed-b')) $$,
  '%nicht gefunden%',
  'Fremde Bestellung kann nicht storniert werden');

-- =========================================================
-- MATCHEF (22222222-…)
-- =========================================================
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select ok((select count(*) from public.bestellungen) >= 3,
  'Matchef sieht alle Bestellungen');

select lives_ok(
  $$ update public.bestellungen set status = 'created' where kommentar = 'seed-a' $$,
  'Matchef bestätigt Bestellung (pending → created)');

select throws_like(
  $$ update public.bestellungen set status = 'completed' where kommentar = 'seed-a' $$,
  '%nicht erlaubt%',
  'Ungültiger Statuswechsel (created → completed) wird abgelehnt');

select lives_ok(
  $$ update public.material set beschreibung = 'geprüft' where name = 'Axt' $$,
  'Matchef bearbeitet Material');

select throws_ok(
  $$ select public.mitglied_hinzufuegen('aaaaaaaa-0000-0000-0000-000000000001', 'neu@test.ch', 'admin') $$,
  '42501', null, 'Matchef kann keine Mitglieder hinzufügen');

-- Matchef darf keine Rollen ändern (0 Zeilen, kein Fehler)
update public.abteilung_members set role = 'admin' where user_id = '33333333-3333-3333-3333-333333333333';

-- =========================================================
-- ADMIN (11111111-…)
-- =========================================================
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select is((select role::text from public.abteilung_members where user_id = '33333333-3333-3333-3333-333333333333'),
  'member', 'Matchef konnte keine Rolle ändern');

update public.abteilung_members set role = 'member' where user_id = '55555555-5555-5555-5555-555555555555';
select is((select role::text from public.abteilung_members where user_id = '55555555-5555-5555-5555-555555555555'),
  'member', 'Admin gibt wartenden User frei');

select ok((select count(*) from public.audit_log) > 0,
  'Admin sieht Audit-Log');

-- =========================================================
-- PENDING (55555555-…) – zurück auf pending setzen
-- =========================================================
update public.abteilung_members set role = 'pending' where user_id = '55555555-5555-5555-5555-555555555555';
set local request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';

select is((select count(*) from public.material)::int, 0,
  'Wartender User sieht kein Material');

select throws_ok(
  $$ select public.bestellung_erstellen('aaaaaaaa-0000-0000-0000-000000000001', now(), now() + interval '1 day', '[{"material_id": 1, "anzahl": 1}]') $$,
  '42501', null, 'Wartender User kann nicht bestellen');

-- =========================================================
-- ANON (nicht eingeloggt)
-- =========================================================
set local role anon;
set local request.jwt.claim.sub = '';

select is((select count(*) from public.material)::int, 0,
  'Anon sieht kein Material');

select throws_ok(
  $$ select public.bestellung_erstellen('aaaaaaaa-0000-0000-0000-000000000001', now(), now() + interval '1 day', '[]') $$,
  '42501', null, 'Anon darf RPC nicht aufrufen');

-- =========================================================
-- AUFRÄUMEN (als Datenbank-Owner, wie der Cron-Job)
-- =========================================================
reset role;
insert into public.bestellungen (abteilung_id, besteller_id, stufe_id, von, bis, status, kommentar)
values ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333',
        (select id from public.gruppen where name = 'Pfadis'),
        now() - interval '4 years', now() - interval '4 years' + interval '2 days', 'completed', 'uralt');

delete from public.abteilung_members where user_id = '44444444-4444-4444-4444-444444444444';
update public.profiles set ohne_mitgliedschaft_seit = now() - interval '2 years'
where id = '44444444-4444-4444-4444-444444444444';

insert into auth.sessions (id, user_id, created_at, updated_at)
values ('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333',
        now() - interval '100 days', now() - interval '100 days');

select public.aufraeumen();

select throws_like(
  $$ update public.bestellungen set besteller_id = '11111111-1111-1111-1111-111111111111' where kommentar = 'seed-c' $$,
  '%Besteller kann nicht geändert werden%',
  'Besteller kann nicht auf eine andere Person umgeschrieben werden');
select is((select count(*) from public.bestellungen where kommentar = 'uralt')::int, 0,
  'Aufräumen: Bestellung älter als 3 Jahre gelöscht');
select is((select count(*) from auth.users where id = '44444444-4444-4444-4444-444444444444')::int, 0,
  'Aufräumen: Konto 1 Jahr ohne Abteilung gelöscht');
select ok(exists (select 1 from public.bestellungen where kommentar = 'seed-c'),
  'Aufräumen: aktuelle Bestellungen bleiben (auch ohne Besteller)');
select is((select count(*) from auth.sessions where id = '99999999-9999-9999-9999-999999999999')::int, 0,
  'Aufräumen: Login-Sitzung nach 90 Tagen gelöscht');

select * from finish();
rollback;
