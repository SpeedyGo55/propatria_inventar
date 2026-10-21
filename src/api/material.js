// src/api/material.js
import { supabase } from '@/utils/supabase'

export const materialListe = (abteilungId) =>
  supabase
    .from('material')
    .select('*, standort:standorte(id, name), kategorien:material_kategorien(kategorie:kategorien(id, name))')
    .eq('abteilung_id', abteilungId)
    .eq('archiviert', false)
    .order('name')

export const materialEinzeln = (id) =>
  supabase.from('material').select('*, kategorien:material_kategorien(kategorie_id)').eq('id', id).single()

export const verfuegbarkeit = (abteilungId, von, bis) =>
  supabase.rpc('material_verfuegbarkeit', { p_abteilung: abteilungId, p_von: von, p_bis: bis })
export const materialSpeichern = (abteilungId, felder) =>
  supabase
    .from('material')
    .upsert({ ...felder, abteilung_id: abteilungId })
    .select('id')
    .single()

// Kategorien komplett ersetzen
export async function kategorienSetzen(materialId, kategorieIds) {
  const del = await supabase.from('material_kategorien').delete().eq('material_id', materialId)
  if (del.error || !kategorieIds.length) return del
  return supabase
    .from('material_kategorien')
    .insert(kategorieIds.map((k) => ({ material_id: materialId, kategorie_id: k })))
}

export const archivieren = (id) => supabase.from('material').update({ archiviert: true }).eq('id', id)

// --- Bilder (Pfad: <abteilung_id>/<uuid>.<ext>, wegen Storage-Policy) ---
const BUCKET = 'material-bilder'

export async function bildHochladen(abteilungId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${abteilungId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '31536000', contentType: file.type })
  if (error) throw error
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

export async function bildLoeschen(url) {
  const path = url.split(`/${BUCKET}/`)[1]
  if (path) await supabase.storage.from(BUCKET).remove([path])
}
