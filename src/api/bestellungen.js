import { supabase } from '@/utils/supabase'

const GRUPPEN = `stufe:gruppen!bestellungen_stufe_id_fkey(id, name),
  anlass:gruppen!bestellungen_anlass_id_fkey(id, name)`

const DETAIL = `*,
  ${GRUPPEN},
  besteller:profiles(id, display_name, email),
  items:bestellung_items(anzahl, prepared, controlled, material:material(id, name, image_urls)),
  historie:bestellung_historie(id, typ, text, created_at, user:profiles(display_name))`

const LISTE = `id, von, bis, status, gruppe_freitext, created_at,
  ${GRUPPEN},
  besteller:profiles(display_name),
  items:bestellung_items(anzahl, prepared, controlled, material:material(id, name))`

export const AKTIV = ['pending', 'created', 'delivered']

// --- Lesen ---
export const meine = (userId) =>
  supabase.from('bestellungen').select(LISTE).eq('besteller_id', userId).order('von', { ascending: false })

export const fuerMatchef = (abteilungId, status = AKTIV) =>
  supabase.from('bestellungen').select(LISTE).eq('abteilung_id', abteilungId).in('status', status).order('von')

export const detail = (id) =>
  supabase
    .from('bestellungen')
    .select(DETAIL)
    .eq('id', id)
    .order('created_at', { referencedTable: 'historie', ascending: true })
    .single()

export const kalender = (abteilungId, von, bis) =>
  supabase.rpc('kalender_belegung', { p_abteilung: abteilungId, p_von: von, p_bis: bis })

export const erstellen = ({ abteilungId, von, bis, items, stufeId = null, anlassId = null, gruppeFreitext = null, kommentar = null }) =>
  supabase.rpc('bestellung_erstellen', {
    p_abteilung: abteilungId,
    p_von: von,
    p_bis: bis,
    p_items: items.map(({ material_id, anzahl }) => ({ material_id, anzahl })),
    p_stufe_id: stufeId,
    p_anlass_id: anlassId,
    p_gruppe_freitext: gruppeFreitext,
    p_kommentar: kommentar,
  })

export const stornieren = (id) => supabase.rpc('bestellung_stornieren', { p_id: id })

export const verlaengern = (id, bis) => supabase.rpc('bestellung_verlaengern', { p_id: id, p_bis: bis })

export const kommentieren = (bestellungId, text) =>
  supabase.from('bestellung_historie').insert({ bestellung_id: bestellungId, typ: 'kommentar', text })

// --- Matchef-Aktionen ---
export const statusSetzen = (id, status, extra = {}) =>
  supabase.from('bestellungen').update({ status, ...extra }).eq('id', id)

export const ablehnen = (id, grund) => statusSetzen(id, 'rejected', { ablehnungsgrund: grund })

export const aendern = (id, felder) =>
  // z.B. { von, bis, matchef_kommentar } – der Trigger prüft die Verfügbarkeit
  supabase.from('bestellungen').update(felder).eq('id', id)

export const itemSetzen = (bestellungId, materialId, felder) =>
  // felder: { prepared }, { controlled } oder { anzahl }
  supabase.from('bestellung_items').update(felder).eq('bestellung_id', bestellungId).eq('material_id', materialId)

export const itemHinzufuegen = (bestellungId, materialId, anzahl) =>
  supabase.from('bestellung_items').insert({ bestellung_id: bestellungId, material_id: materialId, anzahl })

export const itemEntfernen = (bestellungId, materialId) =>
  supabase.from('bestellung_items').delete().eq('bestellung_id', bestellungId).eq('material_id', materialId)

// --- Realtime ---
export function beobachten(abteilungId, callback) {
  const ch = supabase
    .channel(`bestellungen-${abteilungId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bestellungen', filter: `abteilung_id=eq.${abteilungId}` }, callback)
    .subscribe()
  return () => supabase.removeChannel(ch) // in onUnmounted aufrufen
}
