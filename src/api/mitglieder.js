import { supabase } from '@/utils/supabase'

export const liste = (abteilungId) =>
  supabase
    .from('abteilung_members')
    .select('user_id, role, source, benachrichtigen, created_at, profile:profiles(display_name, email)')
    .eq('abteilung_id', abteilungId)
    .order('created_at')

export const rolleSetzen = (abteilungId, userId, role) =>
  supabase.from('abteilung_members').update({ role }).eq('abteilung_id', abteilungId).eq('user_id', userId)

export const freigeben = (abteilungId, userId, role = 'member') => rolleSetzen(abteilungId, userId, role)

export const entfernen = (abteilungId, userId) =>
  supabase.from('abteilung_members').delete().eq('abteilung_id', abteilungId).eq('user_id', userId)

export const benachrichtigenSetzen = (abteilungId, userId, wert) =>
  supabase
    .from('abteilung_members')
    .update({ benachrichtigen: wert })
    .eq('abteilung_id', abteilungId)
    .eq('user_id', userId)

// --- Für den eingeloggten User selbst ---
export const beitreten = (slug) => supabase.rpc('abteilung_beitreten', { p_slug: slug })

export const austreten = (abteilungId, userId) => entfernen(abteilungId, userId)

export const profilNameSetzen = (userId, displayName) =>
  supabase.from('profiles').update({ display_name: displayName }).eq('id', userId)

export const icalToken = () => supabase.from('ical_tokens').select('token').single()

export const icalTokenErneuern = (userId) =>
  supabase.from('ical_tokens').update({ token: crypto.randomUUID() }).eq('user_id', userId).select('token').single()
