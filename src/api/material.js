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
