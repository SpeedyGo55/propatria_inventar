<script setup>
import { useRouter } from 'vue-router'
import BaseButton from '@/components/base/BaseButton.vue'

const router = useRouter()
const STAND = '23.10.2026'
const KONTAKT = 'luca.buholzer@eccom.ch'
</script>

<template>
  <article class="mx-auto max-w-2xl space-y-5 leading-relaxed">
    <div class="flex items-center justify-between gap-2">
      <h1 class="text-2xl font-bold dark:text-white">Datenschutz</h1>
      <BaseButton variant="secondary" @click="router.back()">Zurück</BaseButton>
    </div>
    <p class="text-sm text-gray-500">Stand: {{ STAND }}</p>

    <section class="space-y-2">
      <h2 class="text-lg font-semibold">Wer ist verantwortlich?</h2>
      <p>
        Die Materialverwaltung wird für die Leitenden der Pfadi Pro Patria betrieben. Bis zur Übergabe an die
        Abteilung ist dafür verantwortlich:
      </p>
      <p class="rounded bg-gray-50 p-3 dark:bg-gray-700">
        <strong>Luca Buholzer</strong> v/o Milo<br />
        Riehen<br />
        <a :href="`mailto:${KONTAKT}`" class="text-blue-600 hover:underline">{{ KONTAKT }}</a>
      </p>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Die App ist ein privates Projekt zugunsten der Abteilung. Sobald die Pfadi Pro Patria die
        Verantwortung übernimmt, wird diese Seite angepasst.
      </p>
    </section>

    <section class="space-y-2">
      <h2 class="text-lg font-semibold">Welche Daten wir bearbeiten und wozu</h2>
      <ul class="list-disc space-y-1 pl-5">
        <li><strong>Konto:</strong> Name bzw. Pfadiname, E-Mail-Adresse, bei Anmeldung mit MiData die MiData-Personen-ID. Zweck: Anmeldung und Zuordnung von Bestellungen.</li>
        <li><strong>Rolle in der Abteilung</strong> (z.B. Member, Matchef, Admin). Zweck: Berechtigungen in der App.</li>
        <li><strong>Bestellungen:</strong> Zeitraum, Stufe/Anlass, Material, Kommentare und Verlauf. Zweck: Ausleihe planen und Material zurückverfolgen.</li>
        <li><strong>Schadensmeldungen:</strong> Beschreibung und optional ein Foto. Zweck: Reparatur und Ersatz von Material. Bitte keine Personen fotografieren.</li>
        <li><strong>Kalender-Link:</strong> ein persönlicher, geheimer Link, mit dem du deine Bestellungen in deinem Kalender abonnieren kannst.</li>
        <li><strong>Protokoll:</strong> Änderungen an Material, Bestellungen und Mitgliedschaften werden mit Zeitpunkt und Person protokolliert. Zweck: Nachvollziehbarkeit und Missbrauchsschutz. Nur Admins sehen das Protokoll.</li>
      </ul>
      <p>
        Wir verwenden die Daten nur für die Materialverwaltung der Abteilung. Es gibt <strong>keine Werbung,
        kein Tracking und keine Weitergabe</strong> an Dritte zu anderen Zwecken.
      </p>
    </section>

    <section class="space-y-2">
      <h2 class="text-lg font-semibold">Wer die Daten sehen kann</h2>
      <p>
        Mitglieder sehen ihre eigenen Bestellungen und im Kalender die Belegung des Materials, aber ohne Namen.
        Matchefs und Admins sehen alle Bestellungen der Abteilung mit Name und E-Mail der bestellenden Person.
        Admins verwalten die Mitglieder.
      </p>
    </section>

    <section class="space-y-2">
      <h2 class="text-lg font-semibold">E-Mails</h2>
      <p>
        Die App verschickt E-Mails zu deinen Bestellungen (Bestätigung, Ablehnung, Erinnerung bei überfälliger
        Rückgabe). Matchefs, die dies aktiviert haben, erhalten Mails zu neuen Bestellungen und zum Nachkaufen
        von Verbrauchsmaterial.
      </p>
    </section>

    <section class="space-y-2">
      <h2 class="text-lg font-semibold">Dienstleister und Speicherort</h2>
      <ul class="list-disc space-y-1 pl-5">
        <li><strong>Supabase</strong> (Datenbank, Anmeldung, Fotos): Rechenzentrum in Irland (EU).</li>
        <li><strong>Cloudflare</strong> (Bereitstellung der Website): weltweites Netzwerk, Unternehmen mit Sitz in den USA.</li>
        <li><strong>Resend</strong> (Versand der E-Mails): Unternehmen mit Sitz in den USA.</li>
        <li><strong>GitHub</strong> (verschlüsselte Sicherungskopien): Unternehmen mit Sitz in den USA.</li>
      </ul>
      <p>
        Mit diesen Anbietern bestehen Verträge zur Auftragsbearbeitung. Bei Anbietern in den USA erfolgt die
        Übermittlung gestützt auf das Swiss-U.S. Data Privacy Framework bzw. auf Standardvertragsklauseln.
      </p>
    </section>

    <section class="space-y-2">
      <h2 class="text-lg font-semibold">Speicher im Browser</h2>
      <p>
        Die App speichert in deinem Browser nur, was für die Funktion nötig ist: deine Anmeldung, den Warenkorb
        und für die Offline-Nutzung eine Kopie der Materialliste. Es werden keine Tracking-Cookies verwendet.
        Beim Abmelden werden die Anmeldung und die Kopien gelöscht.
      </p>
    </section>

    <section class="space-y-2">
      <h2 class="text-lg font-semibold">Wie lange wir Daten aufbewahren</h2>
      <ul class="list-disc space-y-1 pl-5">
        <li>Dein Konto, solange du in der Abteilung aktiv bist. Nach dem Austritt löschen wir es auf Anfrage oder spätestens nach 1 Jahr.</li>
        <li>Bestellungen und Schadensmeldungen 3 Jahre, für die Nachverfolgung von Material.</li>
        <li>Sicherungskopien höchstens 30 Tage.</li>
      </ul>
      <p>Wird dein Konto gelöscht, bleiben vergangene Bestellungen ohne deinen Namen erhalten.</p>
    </section>

    <section class="space-y-2">
      <h2 class="text-lg font-semibold">Deine Rechte</h2>
      <p>
        Du kannst jederzeit Auskunft über deine Daten verlangen, falsche Angaben berichtigen lassen und die
        Löschung deines Kontos verlangen. Namen und Passwort kannst du im Profil selbst ändern. Schreib uns dazu an
        <a :href="`mailto:${KONTAKT}`" class="text-blue-600 hover:underline">{{ KONTAKT }}</a>.
        Wenn du mit unserer Antwort nicht zufrieden bist, kannst du dich an den Eidgenössischen Datenschutz- und
        Öffentlichkeitsbeauftragten (EDÖB) wenden.
      </p>
    </section>
  </article>
</template>