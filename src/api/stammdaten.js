import { supabase } from '@/utils/supabase'

// Erlaubte Tabellen, damit kein Tippfehler auf eine fremde Tabelle zeigt
const TABELLEN = ['kategorien', 'standorte', 'gruppen']
const pruefe = (t) => {
  if (!TABELLEN.includes(t)) throw new Error(`Unbekannte Stammdaten-Tabelle: ${t}`)
  return t
}

// --- Allgemein (für StammdatenTabelle.vue) ---
export const liste = (tabelle, abteilungId) =>
  supabase.from(pruefe(tabelle)).select('*').eq('abteilung_id', abteilungId).order('name')

export const speichern = (tabelle, abteilungId, eintrag) =>
  supabase
    .from(pruefe(tabelle))
    .upsert({ ...eintrag, abteilung_id: abteilungId })
    .select()
    .single()

export const loeschen = (tabelle, id) => supabase.from(pruefe(tabelle)).delete().eq('id', id)

// --- Kurzformen ---
export const kategorien = (abteilungId) => liste('kategorien', abteilungId)
export const standorte = (abteilungId) => liste('standorte', abteilungId)
export const gruppen = (abteilungId, nurAktive = true) => {
  let q = supabase.from('gruppen').select('*').eq('abteilung_id', abteilungId).order('name')
  if (nurAktive) q = q.eq('aktiv', true)
  return q
}
export const stufen = (abteilungId) => gruppen(abteilungId).eq('typ', 'stufe')
export const anlaesse = (abteilungId) => gruppen(abteilungId).in('typ', ['anlass', 'sonstiges'])

// --- Sammlungen ---
export const sammlungen = (abteilungId) =>
  supabase
    .from('sammlungen')
    .select('*, items:sammlung_items(anzahl, material:material(id, name, image_urls))')
    .eq('abteilung_id', abteilungId)
    .order('name')

export const sammlungItems = (sammlungId) =>
  supabase
    .from('sammlung_items')
    .select('anzahl, material:material(id, name)')
    .eq('sammlung_id', sammlungId)

export const sammlungSpeichern = (abteilungId, sammlung) =>
  supabase
    .from('sammlungen')
    .upsert({ ...sammlung, abteilung_id: abteilungId })
    .select('id')
    .single()

// Items komplett ersetzen (wie bei material_kategorien)
export async function sammlungItemsSetzen(sammlungId, items) {
  const del = await supabase.from('sammlung_items').delete().eq('sammlung_id', sammlungId)
  if (del.error || !items.length) return del
  return supabase
    .from('sammlung_items')
    .insert(
      items.map(({ material_id, anzahl }) => ({ sammlung_id: sammlungId, material_id, anzahl })),
    )
}

export const sammlungLoeschen = (id) => supabase.from('sammlungen').delete().eq('id', id)
