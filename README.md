# Pfadi Pro Patria – Materialverwaltung

Vue 3 + Vite + Tailwind + Supabase.

## Entwicklung
    npm install
    npx supabase start          # lokale DB (Docker)
    npx supabase db reset       # Schema + Testdaten (seed.sql)
    npm run dev                 # http://localhost:5173

Test-Logins (lokal): admin@ / matchef@ / member@ / neu@test.ch – Passwort `test1234`

## Tests
    npx supabase test db        # RLS- und Logik-Tests (pgTAP)
    npm run lint

## Schema ändern
    npx supabase migration new <name>
    # SQL schreiben → db reset → test db → db push
    npx supabase gen types typescript --local > src/types/database.ts
