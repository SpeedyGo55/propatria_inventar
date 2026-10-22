-- supabase/seed.sql – läuft bei jedem `npx supabase db reset`
-- Passwort für alle Test-User: test1234

-- ---------------------------------------------------------------
-- 1. Test-User (legt über den Trigger auch profiles + ical_tokens an)
-- ---------------------------------------------------------------
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                        confirmation_token, recovery_token, email_change_token_new, email_change)
select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
       extensions.crypt('test1234', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}', jsonb_build_object('name', u.name), now(), now(),
       '', '', '', ''
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'admin@test.ch',   'Admin Test'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'matchef@test.ch', 'Matchef Test'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'member@test.ch',  'Member Test'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'member2@test.ch', 'Member Zwei'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'neu@test.ch',     'Neu Wartend')
) as u(id, email, name);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text,
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users where email like '%@test.ch';

-- ---------------------------------------------------------------
-- 2. Abteilung + Mitgliedschaften
-- ---------------------------------------------------------------
insert into public.abteilungen (id, name, slug)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'Pfadi Pro Patria', 'pro-patria');

insert into public.abteilung_members (abteilung_id, user_id, role) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'admin'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'matchef'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'member'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'member'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', 'pending');

-- ---------------------------------------------------------------
-- 3. Stammdaten
-- ---------------------------------------------------------------
insert into public.gruppen (abteilung_id, name, typ)
select 'aaaaaaaa-0000-0000-0000-000000000001', g.name, g.typ::public.gruppe_typ
from (values ('Biber','stufe'), ('Wölfe','stufe'), ('Pfadis','stufe'), ('Pios','stufe'),
             ('Rover','stufe'), ('Leitende','stufe'),
             ('Sommerlager (SoLa)','anlass'), ('Pfingstlager (PfiLa)','anlass'),
             ('Herbstweekend (HeWe)','anlass'), ('Herbstlager (HeLa)','anlass'),
             ('Biwakweekend (BiWe)','anlass'), ('Biberweekend (BiWe)','anlass'),
             ('NiggiNäggi (NN)','anlass'), ('JPPOP','anlass'),
             ('Fähnliweekend (FäWe)','anlass'), ('Aktivität (Akti)','anlass'),
             ('Anderes','sonstiges')) as g(name, typ);

insert into public.kategorien (abteilung_id, name)
select 'aaaaaaaa-0000-0000-0000-000000000001', unnest(array['Zelte','Küche','Werkzeug','Seile','Verbrauch','Sanität']);

insert into public.standorte (abteilung_id, name) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Materialraum Pfadiheim'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Keller');

-- Material (IDs NICHT von Hand setzen, sonst kollidiert später die Sequenz)
insert into public.material (abteilung_id, name, anzahl, consumable, min_bestand, standort_id, beschreibung)
select 'aaaaaaaa-0000-0000-0000-000000000001', m.name, m.anzahl, m.consumable, m.min_bestand,
       (select s.id from public.standorte s where s.name = m.standort), m.beschreibung
from (values
  ('Spatz 6er',         4,  false, null, 'Materialraum Pfadiheim', 'Komplett mit Heringen und Stangen'),
  ('Blache',            20, false, null, 'Materialraum Pfadiheim', null),
  ('Gaskocher',         6,  false, null, 'Materialraum Pfadiheim', 'Zweiflammig'),
  ('Kochkessel 30l',    3,  false, null, 'Keller',                 null),
  ('Axt',               3,  false, null, 'Keller',                 null),
  ('Säge',              5,  false, null, 'Keller',                 null),
  ('Seil 20m',          10, false, null, 'Keller',                 'Statisch, 10mm'),
  ('Gaskartusche',      12, true,  20,   'Keller',                 null),
  ('Feuerholz (Sack)',  3,  true,  5,    'Keller',                 null),
  ('Erste-Hilfe-Set',   4,  false, null, 'Materialraum Pfadiheim', null)
) as m(name, anzahl, consumable, min_bestand, standort, beschreibung);

insert into public.material_kategorien (material_id, kategorie_id)
select m.id, k.id
from (values ('Spatz 6er','Zelte'), ('Blache','Zelte'), ('Gaskocher','Küche'), ('Kochkessel 30l','Küche'),
             ('Axt','Werkzeug'), ('Säge','Werkzeug'), ('Seil 20m','Seile'), ('Gaskartusche','Verbrauch'),
             ('Gaskartusche','Küche'), ('Feuerholz (Sack)','Verbrauch'), ('Erste-Hilfe-Set','Sanität')) as x(mat, kat)
join public.material m on m.name = x.mat
join public.kategorien k on k.name = x.kat;

insert into public.sammlungen (abteilung_id, name, beschreibung)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'Kochset Stufe', 'Alles zum Kochen für ca. 15 Personen');

insert into public.sammlung_items (sammlung_id, material_id, anzahl)
select s.id, m.id, x.anzahl
from (values ('Gaskocher', 2), ('Kochkessel 30l', 1), ('Gaskartusche', 4)) as x(mat, anzahl)
join public.material m on m.name = x.mat
cross join public.sammlungen s where s.name = 'Kochset Stufe';

-- ---------------------------------------------------------------
-- 4. Beispiel-Bestellungen (Zeiten relativ zu jetzt → Tests bleiben gültig)
--    Erst Bestellungen, dann Items in einem EIGENEN Statement,
--    sonst sieht der Item-Trigger die Bestellung noch nicht.
-- ---------------------------------------------------------------
insert into public.bestellungen (abteilung_id, besteller_id, stufe_id, anlass_id, von, bis, status, kommentar) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333',
   (select id from public.gruppen where name = 'Pfadis'),
   (select id from public.gruppen where name = 'Herbstlager (HeLa)'),
   now() + interval '7 days', now() + interval '9 days', 'pending', 'seed-a'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444',
   (select id from public.gruppen where name = 'Wölfe'),
   (select id from public.gruppen where name = 'Aktivität (Akti)'),
   now() + interval '7 days', now() + interval '9 days', 'created', 'seed-b'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444',
   (select id from public.gruppen where name = 'Rover'),
   null,
   now() - interval '5 days', now() - interval '1 day', 'delivered', 'seed-c');   -- überfällig

insert into public.bestellung_items (bestellung_id, material_id, anzahl)
select b.id, m.id, x.anzahl
from (values ('seed-a', 'Spatz 6er', 2), ('seed-b', 'Gaskocher', 2), ('seed-c', 'Axt', 1)) as x(k, mat, anzahl)
join public.bestellungen b on b.kommentar = x.k
join public.material m on m.name = x.mat;
