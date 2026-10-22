<script setup>
import { computed, ref, watch } from 'vue'
import { TrashIcon } from '@heroicons/vue/24/outline'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'
import * as api from '@/api/mitglieder'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'

const ROLLEN = [
  { value: 'guest', label: 'Gast (nur ansehen)' },
  { value: 'member', label: 'Member (bestellen)' },
  { value: 'matchef', label: 'Matchef' },
  { value: 'admin', label: 'Admin' },
]

const s = useSessionStore()
const toast = useToast()
const liste = ref([])
const laedt = ref(true)

async function laden() {
  if (!s.abteilungId) return
  const { data, error } = await api.liste(s.abteilungId)
  laedt.value = false
  if (error) return toast.fehler(error.message)
  liste.value = data
}
watch(() => s.abteilungId, laden, { immediate: true })

const wartend = computed(() => liste.value.filter((m) => m.role === 'pending'))
const aktive = computed(() => liste.value.filter((m) => m.role !== 'pending'))
const adminAnzahl = computed(() => liste.value.filter((m) => m.role === 'admin').length)
const istLetzterAdmin = (m) => m.role === 'admin' && adminAnzahl.value <= 1
const name = (m) => m.profile?.display_name || m.profile?.email || 'Unbekannt'

async function ausfuehren(fn, erfolg) {
  const { error } = await fn()
  if (error) {
    toast.fehler(error.message)
    await laden()
    return false
  }
  if (erfolg) toast.ok(erfolg)
  await laden()
  return true
}

async function rolleAendern(m, role) {
  const selbst = m.user_id === s.user.id
  if (
    selbst &&
    !confirm('Deine eigene Rolle ändern? Du verlierst evtl. den Zugriff auf diese Seite.')
  )
    return laden()
  if (
    (await ausfuehren(() => api.rolleSetzen(s.abteilungId, m.user_id, role), 'Rolle geändert')) &&
    selbst
  )
    s.laden()
}

function freigeben(m) {
  ausfuehren(() => api.freigeben(s.abteilungId, m.user_id), `${name(m)} freigegeben`)
}

function entfernen(m) {
  if (!confirm(`${name(m)} aus der Abteilung entfernen?`)) return
  ausfuehren(() => api.entfernen(s.abteilungId, m.user_id), 'Entfernt')
}

function benachrichtigen(m) {
  ausfuehren(() => api.benachrichtigenSetzen(s.abteilungId, m.user_id, !m.benachrichtigen))
}

// --- Hinzufügen ---
const neuEmail = ref('')
const neuRolle = ref('member')
async function hinzufuegen() {
  if (
    await ausfuehren(
      () => api.hinzufuegen(s.abteilungId, neuEmail.value, neuRolle.value),
      'Hinzugefügt',
    )
  ) {
    neuEmail.value = ''
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-xl font-bold dark:text-white">Mitglieder</h1>

    <!-- Hinzufügen -->
    <section class="space-y-2 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
      <h2 class="font-semibold">Mitglied hinzufügen</h2>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Das Konto muss bereits existieren (Supabase-Dashboard → Authentication → Users → „Invite
        user“).
      </p>
      <form class="flex flex-wrap items-end gap-2" @submit.prevent="hinzufuegen">
        <div class="min-w-56 flex-1">
          <BaseInput v-model="neuEmail" type="email" label="E-Mail" required />
        </div>
        <BaseSelect v-model="neuRolle" label="Rolle" :optionen="ROLLEN" />
        <BaseButton type="submit">Hinzufügen</BaseButton>
      </form>
    </section>

    <!-- Wartend -->
    <section
      v-if="wartend.length"
      class="space-y-2 rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/30"
    >
      <h2 class="font-semibold">Wartet auf Freigabe ({{ wartend.length }})</h2>
      <div v-for="m in wartend" :key="m.user_id" class="flex flex-wrap items-center gap-2">
        <span class="min-w-0 flex-1"
          >{{ name(m) }} <span class="text-sm text-gray-500">{{ m.profile?.email }}</span></span
        >
        <BaseButton @click="freigeben(m)">Als Member freigeben</BaseButton>
        <BaseButton variant="secondary" @click="entfernen(m)">Ablehnen</BaseButton>
      </div>
    </section>

    <!-- Liste -->
    <section class="overflow-x-auto rounded-lg bg-white shadow-md dark:bg-gray-700">
      <p v-if="laedt" class="p-4 text-gray-500">Lädt …</p>
      <table v-else class="min-w-full text-sm">
        <thead
          class="bg-gray-200 text-left text-xs uppercase text-gray-600 dark:bg-gray-600 dark:text-gray-200"
        >
          <tr>
            <th class="px-3 py-3">Name</th>
            <th class="px-3 py-3">Rolle</th>
            <th class="hidden px-3 py-3 sm:table-cell" title="E-Mail bei neuen Bestellungen">
              Mails
            </th>
            <th class="w-1 px-3 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="m in aktive"
            :key="m.user_id"
            class="border-b border-gray-200 dark:border-gray-600"
          >
            <td class="px-3 py-2">
              <p class="font-medium">
                {{ name(m) }}
                <span v-if="m.user_id === s.user.id" class="text-xs text-gray-500">(du)</span>
                <span
                  v-if="m.source === 'midata'"
                  class="ml-1 rounded bg-purple-100 px-1.5 text-xs text-purple-800"
                  >MiData</span
                >
              </p>
              <p class="text-xs text-gray-500">{{ m.profile?.email }}</p>
            </td>
            <td class="px-3 py-2">
              <BaseSelect
                :model-value="m.role"
                :optionen="ROLLEN"
                :disabled="istLetzterAdmin(m)"
                :title="
                  istLetzterAdmin(m) ? 'Letzter Admin – zuerst jemand anderen zum Admin machen' : ''
                "
                @update:model-value="(r) => rolleAendern(m, r)"
              />
            </td>
            <td class="hidden px-3 py-2 sm:table-cell">
              <input
                type="checkbox"
                class="size-4"
                :checked="m.benachrichtigen"
                @change="benachrichtigen(m)"
              />
            </td>
            <td class="px-3 py-2 text-right">
              <button
                type="button"
                class="text-gray-400 hover:text-red-600 disabled:opacity-30"
                :disabled="istLetzterAdmin(m)"
                @click="entfernen(m)"
              >
                <TrashIcon class="size-5" /><span class="sr-only">Entfernen</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
