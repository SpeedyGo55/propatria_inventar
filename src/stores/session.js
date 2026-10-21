import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { supabase } from '@/utils/supabase'

export const ROLLEN = ['pending', 'guest', 'member', 'matchef', 'admin']

export const useSessionStore = defineStore('session', () => {
  const session = ref(null)
  const profile = ref(null)
  const memberships = ref([])
  const abteilungId = useLocalStorage('abteilung', null)

  let markReady
  const ready = new Promise((r) => (markReady = r))

  const user = computed(() => session.value?.user ?? null)
  const aktiv = computed(() => memberships.value.find((m) => m.abteilung.id === abteilungId.value))
  const abteilung = computed(() => aktiv.value?.abteilung ?? null)
  const rolle = computed(() => aktiv.value?.role ?? null)
  const hasRole = (min) => ROLLEN.indexOf(rolle.value) >= ROLLEN.indexOf(min)

  async function laden() {
    if (!user.value) {
      profile.value = null
      memberships.value = []
      return
    }
    const [p, m] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.value.id).single(),
      supabase
        .from('abteilung_members')
        .select('role, abteilung:abteilungen(id, name, slug, logo_url)')
        .eq('user_id', user.value.id),
    ])
    profile.value = p.data
    memberships.value = m.data ?? []
    if (!aktiv.value) abteilungId.value = memberships.value[0]?.abteilung.id ?? null
  }

  // Wichtig: im Callback KEINE weiteren supabase-Aufrufe direkt → setTimeout
  supabase.auth.onAuthStateChange((event, s) => {
    session.value = s
    if (event === 'TOKEN_REFRESHED') return
    setTimeout(async () => {
      await laden()
      markReady()
    }, 0)
  })

  async function logout() {
    await supabase.auth.signOut()
  }

  return { session, user, profile, memberships, abteilungId, abteilung, rolle, hasRole, ready, laden, logout }
})
