import { createClient } from 'npm:@supabase/supabase-js@2'

// service_role: umgeht RLS – nur hier im Server-Code verwenden, nie im Browser
export const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Aufrufe aus der Datenbank (Trigger/Cron) schicken dieses Secret mit.
// Ohne gesetztes Secret wird alles abgelehnt (sonst passt "Bearer undefined").
export function geheimOk(req: Request) {
  const secret = Deno.env.get('CRON_SECRET')
  if (!secret) return false
  const a = new TextEncoder().encode(req.headers.get('Authorization') ?? '')
  const b = new TextEncoder().encode(`Bearer ${secret}`)
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i] // Vergleich mit konstanter Laufzeit
  return diff === 0
}

// E-Mails aller Matchefs/Admins einer Abteilung, die Mails wollen
export async function matchefMails(abteilungId: string): Promise<string[]> {
  const { data } = await admin
    .from('abteilung_members')
    .select('profile:profiles(email)')
    .eq('abteilung_id', abteilungId)
    .eq('benachrichtigen', true)
    .in('role', ['matchef', 'admin'])
  return (data ?? []).map((m: any) => m.profile?.email).filter(Boolean)
}

// "Wölfe – Herbstlager (HeLa)"
export const titel = (b: any) =>
  [b.stufe?.name, b.anlass?.name, b.gruppe_freitext].filter(Boolean).join(' – ') || 'Bestellung'

export const BESTELLUNG_SELECT = `id, abteilung_id, von, bis, status, kommentar, ablehnungsgrund,
  matchef_kommentar, gruppe_freitext, erinnerung_gesendet_at,
  stufe:gruppen!bestellungen_stufe_id_fkey(name),
  anlass:gruppen!bestellungen_anlass_id_fkey(name),
  besteller:profiles(display_name, email),
  items:bestellung_items(anzahl, material:material(name))`
