const d = new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
const dt = new Intl.DateTimeFormat('de-CH', { dateStyle: 'short', timeStyle: 'short' })
export const datum = (x) => (x ? d.format(new Date(x)) : '')
export const datumZeit = (x) => (x ? dt.format(new Date(x)) : '')
// Datum aus <input type="date"> → Tagesanfang / Tagesende in lokaler Zeit
export const tagStart = (s) => new Date(`${s}T00:00`).toISOString()
export const tagEnde = (s) => new Date(`${s}T23:59`).toISOString()
