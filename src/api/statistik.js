import { supabase } from '@/utils/supabase'

export const proMaterial = (abteilungId) =>
  supabase.from('stat_material').select('*').eq('abteilung_id', abteilungId)

export const proMonat = (abteilungId) =>
  supabase.from('stat_ausleihen_monat').select('*').eq('abteilung_id', abteilungId)

export const inventarwert = (abteilungId) =>
  supabase.from('stat_inventarwert').select('*').eq('abteilung_id', abteilungId).maybeSingle()
