// Aufruf durch pg_cron: { job: 'rueckgabe' | 'mindestbestand' }
import { admin, geheimOk, matchefMails, titel, BESTELLUNG_SELECT } from '../_shared/admin.ts'
import { sendeMail, esc, datum, link, materialListe } from '../_shared/mail.ts'

const TAG = 24 * 60 * 60 * 1000

Deno.serve(async (req) => {
  if (!geheimOk(req)) return new Response('forbidden', { status: 403 })
  const { job } = await req.json()
  if (job === 'rueckgabe') await rueckgabe()
  if (job === 'mindestbestand') await mindestbestand()
  return new Response('ok')
})

// Ausgegeben, seit über 1 Tag überfällig, höchstens alle 3 Tage erinnern
async function rueckgabe() {
  const gestern = new Date(Date.now() - TAG).toISOString()
  const vor3Tagen = new Date(Date.now() - 3 * TAG).toISOString()

  const { data, error } = await admin
    .from('bestellungen')
    .select(BESTELLUNG_SELECT)
    .eq('status', 'delivered')
    .lt('bis', gestern)
    .or(`erinnerung_gesendet_at.is.null,erinnerung_gesendet_at.lt.${vor3Tagen}`)
  if (error) return console.error(error)

  for (const b of data ?? []) {
    if (!b.besteller?.email) continue
    await sendeMail(
      [b.besteller.email],
      `Bitte Material zurückbringen: ${titel(b)}`,
      `<p>Hallo ${esc(b.besteller.display_name)}</p>
       <p>Die Ausleihe <strong>${esc(titel(b))}</strong> lief bis <strong>${datum(b.bis)}</strong>.
       Bitte bring das Material zurück oder verlängere die Bestellung.</p>
       ${materialListe(b.items)}${link(`/bestellungen/${b.id}`, 'Bestellung öffnen / verlängern')}`,
    )
    await admin.from('bestellungen').update({ erinnerung_gesendet_at: new Date().toISOString() }).eq('id', b.id)
  }
}

// Wöchentlich: Verbrauchsmaterial unter Mindestbestand an die Matchefs
async function mindestbestand() {
  const { data, error } = await admin.from('material_unter_min').select('*')
  if (error) return console.error(error)

  const proAbteilung = new Map<string, any[]>()
  for (const m of data ?? []) proAbteilung.set(m.abteilung_id, [...(proAbteilung.get(m.abteilung_id) ?? []), m])

  for (const [abteilungId, liste] of proAbteilung) {
    await sendeMail(
      await matchefMails(abteilungId),
      `Nachkaufen: ${liste.length} Verbrauchsmaterial unter Minimum`,
      `<p>Folgendes Verbrauchsmaterial ist unter dem Mindestbestand:</p>
       <ul>${liste.map((m) => `<li>${esc(m.name)}: ${m.bestand} / ${m.min_bestand} (es fehlen ${m.fehlend})</li>`).join('')}</ul>
       ${link('/matchef', 'Zur Nachkauf-Liste')}`,
    )
  }
}
