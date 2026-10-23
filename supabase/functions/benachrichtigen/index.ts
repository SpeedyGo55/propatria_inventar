// Aufruf durch DB-Trigger: { typ: 'neu' | 'status', bestellung_id, status? }
import { admin, geheimOk, matchefMails, titel, BESTELLUNG_SELECT } from '../_shared/admin.ts'
import { sendeMail, esc, datum, link, materialListe } from '../_shared/mail.ts'

Deno.serve(async (req) => {
  if (!geheimOk(req)) return new Response('forbidden', { status: 403 })
  const { typ, bestellung_id, status } = await req.json()

  const { data: b, error } = await admin.from('bestellungen').select(BESTELLUNG_SELECT).eq('id', bestellung_id).single()
  if (error) return new Response(error.message, { status: 500 })

  const t = titel(b)
  const zeitraum = `${datum(b.von)} – ${datum(b.bis)}`
  const details = `<p><strong>${esc(t)}</strong>, ${zeitraum}</p>${materialListe(b.items)}`
  const oeffnen = link(`/bestellungen/${b.id}`, 'Bestellung öffnen')

  // → Matchefs: neue Bestellung oder Stornierung
  if (typ === 'neu' || status === 'cancelled') {
    const was = typ === 'neu' ? 'Neue Bestellung' : 'Bestellung storniert'
    await sendeMail(
      await matchefMails(b.abteilung_id),
      `${was}: ${t} (${zeitraum})`,
      `<p>${esc(b.besteller?.display_name)} – ${was.toLowerCase()}.</p>${details}
       ${b.kommentar ? `<p>Kommentar: ${esc(b.kommentar)}</p>` : ''}${oeffnen}`,
    )
  }

  // → Besteller: bestätigt oder abgelehnt
  if (typ === 'status' && b.besteller?.email && (status === 'created' || status === 'rejected')) {
    const ok = status === 'created'
    await sendeMail(
      [b.besteller.email],
      `${ok ? 'Bestätigt' : 'Abgelehnt'}: ${t} (${zeitraum})`,
      `<p>Hallo ${esc(b.besteller.display_name)}</p>
       <p>Deine Materialbestellung wurde <strong>${ok ? 'bestätigt' : 'abgelehnt'}</strong>.</p>
       ${!ok && b.ablehnungsgrund ? `<p>Grund: ${esc(b.ablehnungsgrund)}</p>` : ''}
       ${b.matchef_kommentar ? `<p>Matchef: ${esc(b.matchef_kommentar)}</p>` : ''}
       ${details}${oeffnen}`,
    )
  }

  return new Response('ok')
})
