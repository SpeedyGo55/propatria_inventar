const APP_URL = Deno.env.get('APP_URL') ?? ''

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export const datum = (iso: string) =>
  new Date(iso).toLocaleDateString('de-CH', { timeZone: 'Europe/Zurich' })

export const link = (pfad: string, text: string) =>
  `<p><a href="${APP_URL}${pfad}" style="color:#2563eb">${esc(text)}</a></p>`

export const materialListe = (items: any[]) =>
  `<ul>${items.map((i) => `<li>${i.anzahl}× ${esc(i.material?.name)}</li>`).join('')}</ul>`

// Jede Person bekommt eine eigene Mail (keine Adressen im "An"-Feld der anderen)
export async function sendeMail(an: string[], betreff: string, html: string) {
  if (!an.length) return
  const from = Deno.env.get('MAIL_FROM')
  const body = `<div style="font-family:sans-serif;max-width:600px">${html}
    <p style="color:#888;font-size:12px;margin-top:24px">Pfadi Pro Patria – Materialverwaltung</p></div>`

  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(an.map((to) => ({ from, to: [to], subject: betreff, html: body }))),
  })
  if (!res.ok) console.error('Resend-Fehler', res.status, await res.text())
}
