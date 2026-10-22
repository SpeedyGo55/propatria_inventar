<script setup>
import { computed, ref, watch } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'
import { proMaterial, proMonat, inventarwert } from '@/api/statistik'
import BalkenListe from '@/components/statistik/BalkenListe.vue'

const s = useSessionStore()
const toast = useToast()
const material = ref([])
const monate = ref([])
const wert = ref(null)
const laedt = ref(true)

watch(
  () => s.abteilungId,
  async (id) => {
    if (!id) return
    const [m, mo, w] = await Promise.all([proMaterial(id), proMonat(id), inventarwert(id)])
    laedt.value = false
    if (m.error || mo.error || w.error)
      return toast.fehler((m.error || mo.error || w.error).message)
    material.value = m.data
    monate.value = mo.data
    wert.value = w.data
  },
  { immediate: true },
)

const chf = new Intl.NumberFormat('de-CH', {
  style: 'currency',
  currency: 'CHF',
  maximumFractionDigits: 0,
})

// --- Letzte 12 Monate ---
const letzte12 = computed(() => {
  const heute = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(heute.getFullYear(), heute.getMonth() - 11 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    return {
      key,
      kurz: d.toLocaleDateString('de-CH', { month: 'short' }),
      lang: d.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' }),
      anzahl: monate.value
        .filter((r) => r.monat === key)
        .reduce((sum, r) => sum + r.bestellungen, 0),
    }
  })
})
const maxMonat = computed(() => Math.max(1, ...letzte12.value.map((m) => m.anzahl)))
const total12 = computed(() => letzte12.value.reduce((sum, m) => sum + m.anzahl, 0))
// Zahl nur beim Höchstwert und beim aktuellen Monat anzeigen, sonst im Tooltip
const zeigeZahl = (m, i) => m.anzahl > 0 && (m.anzahl === maxMonat.value || i === 11)

function summeNach(feld) {
  const grenze = letzte12.value[0].key
  const map = new Map()
  for (const r of monate.value)
    if (r.monat >= grenze) map.set(r[feld], (map.get(r[feld]) ?? 0) + r.bestellungen)
  return [...map].map(([label, wert]) => ({ label, wert })).sort((a, b) => b.wert - a.wert)
}
const proStufe = computed(() => summeNach('stufe'))
const proAnlass = computed(() => summeNach('anlass'))

// --- Material ---
const top = computed(() =>
  material.value
    .filter((m) => m.ausleihen > 0)
    .sort((a, b) => b.ausleihen - a.ausleihen)
    .slice(0, 10)
    .map((m) => ({ label: m.name, wert: m.ausleihen, hinweis: `${m.stueck} Stk.` })),
)
const schaeden = computed(() =>
  material.value
    .filter((m) => m.schadensmeldungen > 0)
    .sort((a, b) => b.schadensmeldungen - a.schadensmeldungen)
    .slice(0, 10)
    .map((m) => ({
      label: m.name,
      wert: m.schadensmeldungen,
      hinweis: m.ausleihen
        ? `${Math.round((m.schadensmeldungen / m.ausleihen) * 100)} % der Ausleihen`
        : 'ohne Ausleihe',
    })),
)
const vorEinemJahr = Date.now() - 365 * 24 * 60 * 60 * 1000
const ladenhueter = computed(() =>
  material.value
    .filter((m) => !m.letzte_ausleihe || new Date(m.letzte_ausleihe) < vorEinemJahr)
    .sort((a, b) => a.name.localeCompare(b.name)),
)
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-xl font-bold dark:text-white">Statistik</h1>
    <p v-if="laedt" class="text-gray-500">Lädt …</p>

    <template v-else>
      <!-- Kennzahlen -->
      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div class="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
          <p class="text-sm text-gray-500 dark:text-gray-400">Ausleihen (12 Monate)</p>
          <p class="text-2xl font-bold tabular-nums">{{ total12 }}</p>
        </div>
        <div class="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
          <p class="text-sm text-gray-500 dark:text-gray-400">Materialien</p>
          <p class="text-2xl font-bold tabular-nums">{{ material.length }}</p>
        </div>
        <div class="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
          <p class="text-sm text-gray-500 dark:text-gray-400">Inventarwert</p>
          <p class="text-2xl font-bold tabular-nums">
            {{ wert?.wert ? chf.format(wert.wert) : '–' }}
          </p>
          <p v-if="wert?.ohne_preis" class="text-xs text-gray-500">
            {{ wert.ohne_preis }} ohne Preis
          </p>
        </div>
        <div class="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
          <p class="text-sm text-gray-500 dark:text-gray-400">Nie / lange nicht ausgeliehen</p>
          <p class="text-2xl font-bold tabular-nums">{{ ladenhueter.length }}</p>
        </div>
      </div>

      <!-- Ausleihen pro Monat -->
      <section class="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
        <h2 class="mb-3 font-semibold">Ausleihen pro Monat</h2>
        <div
          class="flex h-40 items-stretch gap-0.5"
          role="img"
          :aria-label="`Ausleihen der letzten 12 Monate, total ${total12}`"
        >
          <div
            v-for="(m, i) in letzte12"
            :key="m.key"
            class="flex flex-1 flex-col items-center"
            :title="`${m.lang}: ${m.anzahl} Ausleihen`"
          >
            <span class="h-4 text-xs tabular-nums text-gray-600 dark:text-gray-300">{{
              zeigeZahl(m, i) ? m.anzahl : ''
            }}</span>
            <div class="flex w-full flex-1 items-end">
              <div
                class="w-full rounded-t bg-blue-500 dark:bg-blue-400"
                :style="{
                  height: `${(m.anzahl / maxMonat) * 100}%`,
                  minHeight: m.anzahl ? '2px' : '0',
                }"
              />
            </div>
            <span class="mt-1 text-xs text-gray-500">{{ m.kurz }}</span>
          </div>
        </div>
        <details class="mt-3 text-sm">
          <summary class="cursor-pointer text-gray-500">Als Tabelle</summary>
          <table class="mt-2 w-full">
            <tr
              v-for="m in letzte12"
              :key="m.key"
              class="border-b border-gray-100 dark:border-gray-600"
            >
              <td class="py-1">{{ m.lang }}</td>
              <td class="py-1 text-right tabular-nums">{{ m.anzahl }}</td>
            </tr>
          </table>
        </details>
      </section>

      <div class="grid gap-4 md:grid-cols-2">
        <section class="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
          <h2 class="mb-3 font-semibold">Nach Stufe (12 Monate)</h2>
          <BalkenListe :eintraege="proStufe" einheit="Ausleihen" />
        </section>
        <section class="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
          <h2 class="mb-3 font-semibold">Nach Anlass (12 Monate)</h2>
          <BalkenListe :eintraege="proAnlass" einheit="Ausleihen" />
        </section>
        <section class="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
          <h2 class="mb-3 font-semibold">Meistgeliehen</h2>
          <BalkenListe :eintraege="top" einheit="Ausleihen" />
        </section>
        <section class="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
          <h2 class="mb-3 font-semibold">Meiste Schadensmeldungen</h2>
          <BalkenListe :eintraege="schaeden" einheit="Meldungen" />
        </section>
      </div>

      <section class="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
        <h2 class="mb-2 font-semibold">Seit über einem Jahr nicht ausgeliehen</h2>
        <p v-if="!ladenhueter.length" class="text-sm text-gray-500">Alles wird gebraucht 👍</p>
        <p v-else class="text-sm">{{ ladenhueter.map((m) => m.name).join(', ') }}</p>
      </section>
    </template>
  </div>
</template>
