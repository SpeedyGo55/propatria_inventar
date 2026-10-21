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