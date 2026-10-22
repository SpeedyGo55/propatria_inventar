// Physisch vorhandener Bestand (ohne beschädigt/verloren)
export const bestand = (m) => m.anzahl - m.damaged - m.lost

export const ZUSTAENDE = [
  { value: 'neu', label: 'Neu' },
  { value: 'gut', label: 'Gut' },
  { value: 'gebraucht', label: 'Gebraucht' },
  { value: 'schlecht', label: 'Schlecht' },
]
