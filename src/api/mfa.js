import { supabase } from '@/utils/supabase'

// Bestätigte TOTP-Faktoren des eingeloggten Users
export async function faktoren() {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error
  return data.totp
}

// Passwort ok, aber MFA eingerichtet und noch kein Code eingegeben?
// Liest nur das Token im Browser → funktioniert auch offline.
export async function codeNoetig() {
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  return data?.nextLevel === 'aal2' && data?.currentLevel !== 'aal2'
}

// Einrichtung starten: QR-Code + Schlüssel zum Abtippen
export async function einrichtenStarten() {
  const { data } = await supabase.auth.mfa.listFactors()
  for (const f of data?.all ?? []) {
    if (f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id }) // alte Versuche
  }
  const { data: e, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Authenticator-App',
  })
  if (error) throw error
  return { factorId: e.id, qr: e.totp.qr_code, secret: e.totp.secret }
}

// Code prüfen – beim Einrichten (mit factorId) und beim Login (ohne)
export async function codePruefen(code, factorId = null) {
  if (!factorId) factorId = (await faktoren())[0]?.id
  if (!factorId) throw new Error('Keine Zwei-Faktor-Anmeldung eingerichtet.')
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() })
  if (error) throw new Error('Code ungültig oder abgelaufen.')
}

export async function entfernen(factorId) {
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) throw error
}
