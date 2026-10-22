export const AKTIV = ['pending', 'created', 'delivered']

// "Wölfe – Herbstlager (HeLa)" bzw. Freitext
export const zuordnung = (b) =>
  [b.stufe?.name, b.anlass?.name, b.gruppe_freitext].filter(Boolean).join(' – ') || '–'

export const stueck = (b) => b.items?.reduce((s, i) => s + i.anzahl, 0) ?? 0
export const istAktiv = (b) => AKTIV.includes(b.status)
export const istUeberfaellig = (b) => b.status === 'delivered' && new Date(b.bis) < new Date()
export const istHeute = (iso) => new Date(iso).toDateString() === new Date().toDateString()
