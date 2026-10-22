<script setup>
import { computed, onUnmounted, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useSessionStore } from '@/stores/session'
import { useAsync } from '@/composables/useAsync'
import { fuerMatchef, beobachten } from '@/api/bestellungen'
import { istHeute, istUeberfaellig } from '@/utils/bestellung'
import BestellungKarte from '@/components/bestellung/BestellungKarte.vue'

const s = useSessionStore()
const { data, loading, run } = useAsync(() => fuerMatchef(s.abteilungId))

// Laden + Realtime: bei jeder Änderung an einer Bestellung neu laden
let stopp = null
watch(
  () => s.abteilungId,
  (id) => {
    stopp?.()
    if (!id) return
    run().catch(() => {})
    stopp = beobachten(id, () => run().catch(() => {}))
  },
  { immediate: true },
)
onUnmounted(() => stopp?.())

const tagesende = () => {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d
}

const TABS = [
  { key: 'offen', titel: 'Offen', filter: (b) => b.status === 'pending' },
  { key: 'abholen', titel: 'Abholbereit', filter: (b) => b.status === 'created' && new Date(b.von) <= tagesende() },
  { key: 'zurueck', titel: 'Heute zurück', filter: (b) => b.status === 'delivered' && istHeute(b.bis) },
  { key: 'ueberfaellig', titel: 'Überfällig', filter: istUeberfaellig, rot: true },
  { key: 'alle', titel: 'Alle aktiven', filter: () => true },
]

const tabKey = useLocalStorage('matchef-tab', 'offen')
const listen = computed(() =>
  Object.fromEntries(TABS.map((t) => [t.key, (data.value ?? []).filter(t.filter)])),
)
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold dark:text-white">Matchef</h1>

    <nav class="flex gap-1 overflow-x-auto border-b border-gray-300 dark:border-gray-600">
      <button
        v-for="t in TABS"
        :key="t.key"
        type="button"
        :class="t.key === tabKey ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500'"
        class="flex items-center gap-1 whitespace-nowrap border-b-2 px-3 py-2 font-medium"
        @click="tabKey = t.key"
      >
        {{ t.titel }}
        <span
          v-if="listen[t.key].length"
          :class="t.rot ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200'"
          class="rounded-full px-1.5 text-xs"
        >
          {{ listen[t.key].length }}
        </span>
      </button>
    </nav>

    <p v-if="loading && !data" class="text-gray-500">Lädt …</p>
    <p v-else-if="!listen[tabKey]?.length" class="py-10 text-center text-gray-500">Nichts zu tun 🎉</p>
    <div v-else class="space-y-2">
      <BestellungKarte v-for="b in listen[tabKey]" :key="b.id" :bestellung="b" zeige-besteller />
    </div>
  </div>
</template>
