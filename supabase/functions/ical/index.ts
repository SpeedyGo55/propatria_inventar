// Kalender-Abo: GET /functions/v1/ical?token=<persönlicher Token>
// Member: eigene Bestellungen · Matchef/Admin: alle der Abteilung
import { admin } from '../_shared/admin.ts'

const zeit = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
const esc = (s: string) => String(s ?? '').replace(/[\\,;]/g, (m) => '\\' + m).replace(/\r\n|\r|\n/g, '\\n')

Deno.serve(async (req) => {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return new Response('token fehlt', { status: 400 })

  const { data, error } = await admin.rpc('ical_feed', { p_token: token })
  if (error) return new Response('nicht gefunden', { status: 404 })

  const jetzt = zeit(new Date().toISOString())
  const events = (data ?? []).map((b: any) =>
    [
      'BEGIN:VEVENT',
      `UID:bestellung-${b.bestellung_id}@propatria-inventar`,
      `DTSTAMP:${jetzt}`,
      `DTSTART:${zeit(b.von)}`,
      `DTEND:${zeit(b.bis)}`,
      `SUMMARY:${esc(`Material: ${b.titel}`)}`,
      `DESCRIPTION:${esc(`${b.items}\nStatus: ${b.status}`)}`,
      b.status === 'pending' ? 'STATUS:TENTATIVE' : 'STATUS:CONFIRMED',
      'END:VEVENT',
    ].join('\r\n'),
  )

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pfadi Pro Patria//Materialverwaltung//DE',
    'X-WR-CALNAME:Pro Patria Material',
    'X-PUBLISHED-TTL:PT1H',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  return new Response(ics, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, max-age=900' },
  })
})
