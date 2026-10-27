-- supabase/tests/sicherheit_test.sql – Tests zur Migration "sicherheit"
-- ausführen mit: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

-- ---------------------------------------------------------
-- Vorbereitung (als Owner): zweite Abteilung mit eigenem Material,
-- eine abgeschlossene Bestellung in Pro Patria
-- ---------------------------------------------------------
insert into public.abteilungen (id, name, slug)
values ('bbbbbbbb-0000-0000-0000-000000000002', 'Andere Abteilung', 'andere');
insert into public.material (abteilung_id, name, anzahl, consumable)
values ('bbbbbbbb-0000-0000-0000-000000000002', 'Fremde Kartusche', 10, true);
insert into public.kategorien (abteilung_id, name)
values ('bbbbbbbb-0000-0000-0000-000000000002', 'Fremde Kategorie');
insert into public.bestellungen (abteilung_id, besteller_id, stufe_id, von, bis, status, kommentar)
values ('bbbbbbbb-0000-0000-0000-000000000002', null, null,
        now() + interval '1 day', now() + interval '2 days', 'pending', 'fremd');
-- ID merken: als Member ist die fremde Bestellung per RLS unsichtbar (Angreifer kennt die ID trotzdem)
select set_config('test.fremde_bestellung', (select id::text from public.bestellungen where kommentar = 'fremd'), true);

insert into public.bestellungen (abteilung_id, besteller_id, stufe_id, von, bis, status, kommentar)
values ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333',
        (select id from public.gruppen where name = 'Pfadis'),
        now() - interval '10 days', now() - interval '8 days', 'delivered', 'abschluss');
insert into public.bestellung_items (bestellung_id, material_id, anzahl)
select b.id, m.id, 2 from public.bestellungen b, public.material m
where b.kommentar = 'abschluss' and m.name = 'Gaskartusche';
update public.bestellungen set status = 'completed' where kommentar = 'abschluss';

-- =========================================================
-- MATCHEF (22222222-…)
-- =========================================================
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select throws_like(
  $$ insert into public.bestellung_items (bestellung_id, material_id, anzahl)
     values ((select id from public.bestellungen where kommentar = 'abschluss'),
             (select id from public.material where name = 'Fremde Kartusche'), 3) $$,
  '%gehört nicht zu dieser Abteilung%',
  'Fremdes Material kann nicht in eine abgeschlossene Bestellung');

select throws_like(
  $$ update public.bestellung_items set material_id = (select id from public.material where name = 'Fremde Kartusche')
     where bestellung_id = (select id from public.bestellungen where kommentar = 'abschluss') $$,
  '%gehört nicht zu dieser Abteilung%',
  'Position kann nicht auf fremdes Material umgestellt werden');

select is((select anzahl from public.material where name = 'Gaskartusche'), 10,
  'Erster Abschluss bucht Verbrauchsmaterial ab (12 → 10)');
update public.bestellungen set status = 'delivered' where kommentar = 'abschluss';
update public.bestellungen set status = 'completed' where kommentar = 'abschluss';
select is((select anzahl from public.material where name = 'Gaskartusche'), 10,
  'Erneuter Abschluss bucht nicht nochmals ab');

select throws_like(
  $$ insert into public.material_kategorien (material_id, kategorie_id)
     values ((select id from public.material where name = 'Axt'), (select id from public.kategorien where name = 'Fremde Kategorie')) $$,
  '%nicht zur selben Abteilung%',
  'Fremde Kategorie kann nicht zugeordnet werden');

select throws_like(
  $$ insert into public.sammlung_items (sammlung_id, material_id, anzahl)
     values ((select id from public.sammlungen where name = 'Kochset Stufe'),
             (select id from public.material where name = 'Fremde Kartusche'), 1) $$,
  '%nicht zur selben Abteilung%',
  'Fremdes Material kann nicht in eine Sammlung');

select lives_ok(
  $$ select public.bestellung_verlaengern((select id from public.bestellungen where kommentar = 'seed-b'), now() + interval '6 months') $$,
  'Matchef darf über 3 Monate verlängern');

select throws_like(
  $$ update public.bestellungen set kommentar = repeat('x', 2001) where kommentar = 'seed-a' $$,
  '%bestellungen_kommentar_laenge%',
  'Kommentar über 2000 Zeichen wird abgelehnt');

-- =========================================================
-- MEMBER (33333333-…)
-- =========================================================
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select throws_like(
  $$ select public.bestellung_verlaengern((select id from public.bestellungen where kommentar = 'seed-a'), now() + interval '6 months') $$,
  '%max. 3 Monate%',
  'Member kann nicht über 3 Monate verlängern');

select lives_ok(
  $$ select public.bestellung_verlaengern((select id from public.bestellungen where kommentar = 'seed-a'), now() + interval '12 days') $$,
  'Member verlängert im erlaubten Rahmen');

select throws_like(
  $$ select public.bestellung_erstellen(
       'aaaaaaaa-0000-0000-0000-000000000001', now() + interval '40 days', now() + interval '200 days',
       jsonb_build_array(jsonb_build_object('material_id', (select id from public.material where name = 'Axt'), 'anzahl', 1)),
       p_stufe_id => (select id from public.gruppen where name = 'Pfadis')) $$,
  '%höchstens 3 Monate%',
  'Bestellung über 3 Monate wird abgelehnt');

select throws_like(
  $$ insert into public.schadensmeldungen (material_id, bestellung_id, beschreibung)
     values ((select id from public.material where name = 'Axt'), current_setting('test.fremde_bestellung')::bigint, 'x') $$,
  '%Bestellung gehört nicht zu dieser Abteilung%',
  'Schadensmeldung kann nicht auf fremde Bestellung zeigen');

select is((select count(*) from public.profiles where id = '55555555-5555-5555-5555-555555555555')::int, 0,
  'Member sieht Profil von Wartenden nicht');

-- =========================================================
-- ADMIN (11111111-…) sieht Wartende weiterhin (zum Freigeben)
-- =========================================================
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select is((select count(*) from public.profiles where id = '55555555-5555-5555-5555-555555555555')::int, 1,
  'Admin sieht Profil von Wartenden');

-- =========================================================
-- Ehemaliges Mitglied kann nicht mehr verlängern
-- =========================================================
reset role;
delete from public.abteilung_members where user_id = '33333333-3333-3333-3333-333333333333';
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select throws_like(
  $$ select public.bestellung_verlaengern((select id from public.bestellungen where kommentar = 'seed-a'), now() + interval '13 days') $$,
  '%nicht gefunden%',
  'Ehemaliges Mitglied kann nicht verlängern');

-- =========================================================
-- MFA: Matchef mit zweitem Faktor, aber nur Passwort (aal1)
-- =========================================================
reset role;
insert into auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at)
values (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Test', 'totp', 'verified', now(), now());
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","aal":"aal1"}';

select is((select count(*) from public.profiles)::int, 0,
  'MFA aal1: keine Profile (E-Mails) lesbar');
select is((select count(*) from public.ical_tokens)::int, 0,
  'MFA aal1: Kalender-Token nicht lesbar');
select is((select count(*) from public.abteilungen)::int, 0,
  'MFA aal1: keine Abteilungen lesbar');
select throws_ok(
  $$ select public.abteilung_beitreten('andere') $$,
  '42501', null, 'MFA aal1: kein Beitritt per RPC');

set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","aal":"aal2"}';
select is((select count(*) from public.ical_tokens)::int, 1,
  'MFA aal2: eigener Kalender-Token lesbar');

-- =========================================================
-- Storage
-- =========================================================
reset role;
select ok((select bool_and(allowed_mime_types is not null and not ('image/svg+xml' = any(allowed_mime_types)))
           from storage.buckets where id in ('material-bilder', 'schaden-fotos')),
  'Buckets erlauben nur Bilder ohne SVG');

select * from finish();
rollback;
