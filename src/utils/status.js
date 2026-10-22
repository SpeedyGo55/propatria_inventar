export const STATUS = {
  pending:   { label: 'Angefragt',     farbe: 'bg-yellow-100 text-yellow-800' },
  created:   { label: 'Bestätigt',     farbe: 'bg-blue-100 text-blue-800' },
  delivered: { label: 'Ausgegeben',    farbe: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Zurück',        farbe: 'bg-green-100 text-green-800' },
  rejected:  { label: 'Abgelehnt',     farbe: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Storniert',     farbe: 'bg-gray-100 text-gray-600' },
}
export const UEBERGAENGE = {
  pending:   ['created', 'rejected', 'cancelled'],
  created:   ['pending', 'delivered', 'rejected', 'cancelled'],
  delivered: ['created', 'completed'],
  completed: ['delivered'],
  rejected:  ['pending'],
  cancelled: ['pending'],
}
// Beschriftung der Status-Knöpfe pro Übergang
const AKTIONEN = {
  'pending>created': { label: 'Bestätigen', variant: 'primary' },
  'pending>rejected': { label: 'Ablehnen', variant: 'danger' },
  'pending>cancelled': { label: 'Stornieren', variant: 'secondary' },
  'created>delivered': { label: 'Ausgeben', variant: 'primary' },
  'created>pending': { label: 'Bestätigung zurücknehmen', variant: 'secondary' },
  'created>rejected': { label: 'Ablehnen', variant: 'danger' },
  'created>cancelled': { label: 'Stornieren', variant: 'secondary' },
  'delivered>completed': { label: 'Rücknahme abschliessen', variant: 'primary' },
  'delivered>created': { label: 'Ausgabe rückgängig', variant: 'secondary' },
  'completed>delivered': { label: 'Rücknahme rückgängig', variant: 'secondary' },
  'rejected>pending': { label: 'Wieder öffnen', variant: 'secondary' },
  'cancelled>pending': { label: 'Wieder öffnen', variant: 'secondary' },
}
export const aktionenFuer = (status) =>
  (UEBERGAENGE[status] ?? []).map((nach) => ({ nach, ...AKTIONEN[`${status}>${nach}`] }))

const HISTORIE = { erstellt: 'Bestellung erstellt', zeitraum: 'Zeitraum geändert', kommentar: 'Kommentar' }
export const historieText = (typ) => HISTORIE[typ] ?? STATUS[typ]?.label ?? typ
