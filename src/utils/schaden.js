export const SCHADEN_TYP = { damaged: 'Beschädigt', lost: 'Verloren' }

export const SCHADEN_STATUS = {
  offen: { label: 'Offen', farbe: 'bg-red-100 text-red-800' },
  in_reparatur: { label: 'In Reparatur', farbe: 'bg-yellow-100 text-yellow-800' },
  erledigt: { label: 'Erledigt', farbe: 'bg-green-100 text-green-800' },
  abgeschrieben: { label: 'Abgeschrieben', farbe: 'bg-gray-100 text-gray-600' },
}

// Erlaubte Schritte (abgeschlossene Meldungen kann die DB nicht wieder öffnen)
export const SCHADEN_AKTIONEN = {
  offen: [
    { nach: 'in_reparatur', label: 'In Reparatur', variant: 'secondary' },
    { nach: 'erledigt', label: 'Erledigt', variant: 'primary' },
    { nach: 'abgeschrieben', label: 'Abschreiben', variant: 'danger' },
  ],
  in_reparatur: [
    { nach: 'erledigt', label: 'Erledigt', variant: 'primary' },
    { nach: 'abgeschrieben', label: 'Abschreiben', variant: 'danger' },
  ],
}
