<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'
import { kalender } from '@/api/bestellungen'
import { materialListe } from '@/api/material'
import { STATUS } from '@/utils/status'
import { datum } from '@/utils/format'
import BaseSelect from '@/components/base/BaseSelect.vue'

const s = useSessionStore()
const toast = useToast()

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const jetzt = new Date()
const monat = ref(new Date(jetzt.getFullYear(), jetzt.getMonth(), 1))
const zeilen = ref([]) // eine Zeile pro Bestellposition
const material = ref([])
const materialFilter = ref(null)

const monatName = computed(() =>
  monat.value.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' }),
)

// 6 Wochen à 7 Tage, beginnend am Montag vor dem Monatsersten
const tage = computed(() => {
  const m = monat.value
  const versatz = (m.getDay() + 6) % 7
  return Array.from(
    { length: 42 },
    (_, i) => new Date(m.getFullYear(), m.getMonth(), 1 - versatz + i),
  )
})

async function laden() {
  if (!s.abteilungId) return
  const von = tage.value[0]
  const bis = new Date(tage.value[41])
  bis.setHours(23, 59, 59, 999)
  const { data, error } = await kalender(s.abteilungId, von.toISOString(), bis.toISOString())
  if (error) return toast.fehler(error.message)
  zeilen.value = data
}
watch([() => s.abteilungId, monat], laden, { immediate: true })

watch(
  () => s.abteilungId,
  async (id) => {
    if (id) material.value = (await materialListe(id)).data ?? []
  },
  { immediate: true },
)
const materialOpt = computed(() => material.value.map((m) => ({ value: m.id, label: m.name })))

// Positionen zu Bestellungen zusammenfassen
const bestellungen = computed(() => {
  const map = new Map()
  for (const z of zeilen.value) {
    if (!map.has(z.bestellung_id)) {
      map.set(z.bestellung_id, {
        id: z.bestellung_id,
        von: new Date(z.von),
        bis: new Date(z.bis),
        status: z.status,
        eigene: z.eigene,
        titel: [z.stufe, z.anlass, z.freitext].filter(Boolean).join(' – ') || 'Bestellung',
        items: [],
      })
    }
    map
      .get(z.bestellung_id)
      .items.push({ material_id: z.material_id, name: z.material, anzahl: z.anzahl })
  }
  let liste = [...map.values()]
  if (materialFilter.value)
    liste = liste.filter((b) => b.items.some((i) => i.material_id === materialFilter.value))
  return liste.sort((a, b) => a.von - b.von)
})

function amTag(tag) {
  const ende = new Date(tag)
  ende.setHours(23, 59, 59, 999)
  return bestellungen.value.filter((b) => b.von <= ende && b.bis >= tag)
}

const monatsListe = computed(() => {
  const start = monat.value
  const ende = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59)
  return bestellungen.value.filter((b) => b.von <= ende && b.bis >= start)
})

const istHeute = (tag) => tag.toDateString() === new Date().toDateString()
const imMonat = (tag) => tag.getMonth() === monat.value.getMonth()
const darfOeffnen = (b) => b.eigene || s.hasRole('matchef')
const tooltip = (b) =>
  `${b.titel}\n${datum(b.von)} – ${datum(b.bis)}\n${b.items.map((i) => `${i.anzahl}× ${i.name}`).join('\n')}`

function blaettern(n) {
  monat.value = new Date(monat.value.getFullYear(), monat.value.getMonth() + n, 1)
}
function zuHeute() {
  monat.value = new Date(jetzt.getFullYear(), jetzt.getMonth(), 1)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-xl font-bold dark:text-white">Kalender</h1>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-600"
          @click="blaettern(-1)"
        >
          <ChevronLeftIcon class="size-5" /><span class="sr-only">Voriger Monat</span>
        </button>
        <button
          type="button"
          class="min-w-40 rounded px-2 py-1 font-medium capitalize hover:bg-gray-200 dark:hover:bg-gray-600"
          @click="zuHeute"
        >
          {{ monatName }}
        </button>
        <button
          type="button"
          class="rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-600"
          @click="blaettern(1)"
        >
          <ChevronRightIcon class="size-5" /><span class="sr-only">Nächster Monat</span>
        </button>
      </div>
    </div>

    <div class="max-w-xs">
      <BaseSelect v-model="materialFilter" :optionen="materialOpt" platzhalter="Alles Material" />
    </div>

    <!-- Monatsraster (ab Tablet) -->
    <div class="hidden overflow-hidden rounded-lg bg-white shadow-sm sm:block dark:bg-gray-700">
      <div
        class="grid grid-cols-7 border-b border-gray-200 text-center text-xs font-medium text-gray-500 dark:border-gray-600"
      >
        <div v-for="w in WOCHENTAGE" :key="w" class="py-2">{{ w }}</div>
      </div>
      <div class="grid grid-cols-7">
        <div
          v-for="tag in tage"
          :key="tag.toISOString()"
          :class="imMonat(tag) ? '' : 'bg-gray-50 text-gray-400 dark:bg-gray-800'"
          class="min-h-24 border-b border-r border-gray-100 p-1 dark:border-gray-600"
        >
          <p
            :class="istHeute(tag) && 'rounded-full bg-blue-600 text-white'"
            class="mb-1 inline-block min-w-6 px-1 text-center text-xs"
          >
            {{ tag.getDate() }}
          </p>
          <template v-for="b in amTag(tag).slice(0, 3)" :key="b.id">
            <RouterLink
              v-if="darfOeffnen(b)"
              :to="{ name: 'bestellung', params: { id: b.id } }"
              :title="tooltip(b)"
              :class="STATUS[b.status].farbe"
              class="mb-0.5 block truncate rounded px-1 text-xs hover:opacity-80"
            >
              {{ b.titel }}
            </RouterLink>
            <span
              v-else
              :title="tooltip(b)"
              :class="STATUS[b.status].farbe"
              class="mb-0.5 block truncate rounded px-1 text-xs"
            >
              {{ b.titel }}
            </span>
          </template>
          <p v-if="amTag(tag).length > 3" class="text-xs text-gray-500">
            +{{ amTag(tag).length - 3 }} weitere
          </p>
        </div>
      </div>
    </div>

    <!-- Liste (Handy) -->
    <ul class="space-y-2 sm:hidden">
      <li v-if="!monatsListe.length" class="py-6 text-center text-gray-500">Nichts gebucht.</li>
      <li
        v-for="b in monatsListe"
        :key="b.id"
        class="rounded-lg bg-white p-3 shadow-sm dark:bg-gray-700"
      >
        <div class="flex items-start justify-between gap-2">
          <p class="font-medium">{{ b.titel }}</p>
          <span :class="STATUS[b.status].farbe" class="shrink-0 rounded-full px-2 py-0.5 text-xs">{{
            STATUS[b.status].label
          }}</span>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          {{ datum(b.von) }} – {{ datum(b.bis) }}
        </p>
        <p class="truncate text-sm text-gray-500">
          {{ b.items.map((i) => `${i.anzahl}× ${i.name}`).join(', ') }}
        </p>
        <RouterLink
          v-if="darfOeffnen(b)"
          :to="{ name: 'bestellung', params: { id: b.id } }"
          class="text-sm text-blue-600 hover:underline"
        >
          Öffnen
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
