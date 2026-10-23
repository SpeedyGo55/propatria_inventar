import { supabase } from '@/utils/supabase'

const BUCKET = 'schaden-fotos'

// Zwei Fremdschlüssel auf profiles → Namen explizit angeben
const LISTE = `*,
  material:material(id, name, image_urls),
  gemeldet:profiles!schadensmeldungen_gemeldet_von_fkey(display_name),
  bearbeiter:profiles!schadensmeldungen_bearbeitet_von_fkey(display_name)`

export const liste = (abteilungId) =>
  supabase
    .from('schadensmeldungen')
    .select(LISTE)
    .eq('abteilung_id', abteilungId)
    .order('created_at', { ascending: false })

// abteilung_id und gemeldet_von setzt die Datenbank selbst
export const melden = ({
  materialId,
  bestellungId = null,
  typ,
  anzahl,
  beschreibung = null,
  fotoPath = null,
}) =>
  supabase.from('schadensmeldungen').insert({
    material_id: materialId,
    bestellung_id: bestellungId,
    typ,
    anzahl,
    beschreibung,
    foto_path: fotoPath,
  })

export const statusSetzen = (id, status) =>
  supabase.from('schadensmeldungen').update({ status }).eq('id', id)

export async function fotoHochladen(abteilungId, file) {
  const path = `${abteilungId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || 'image/jpeg' })
  if (error) throw error
  return path
}

// Privater Bucket → Links, die 1 Stunde gültig sind. Ergebnis: Map(path → url)
export async function fotoLinks(paths) {
  if (!paths.length) return new Map()
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600)
  return new Map((data ?? []).filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]))
}
