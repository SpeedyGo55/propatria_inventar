<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { useSessionStore } from '@/stores/session'
import { useCartStore } from '@/stores/cart'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { useVerfuegbarkeit } from '@/composables/useVerfuegbarkeit'
import { materialListe } from '@/api/material'
import { kategorien as ladeKategorien, standorte as ladeStandorte } from '@/api/stammdaten'
import ZeitraumWahl from '@/components/material/ZeitraumWahl.vue'
import MaterialFilter from '@/components/material/MaterialFilter.vue'
import MaterialKarte from '@/components/material/MaterialKarte.vue'
import MaterialTabelle from '@/components/material/MaterialTabelle.vue'
import SchadenMeldenModal from '@/components/schaden/SchadenMeldenModal.vue'

const schadenMaterial = ref(null)
const schadenOffen = ref(false)
function schaden(m) {
  schadenMaterial.value = m
  schadenOffen.value = true
}

const s = useSessionStore()
const cart = useCartStore()
const toast = useToast()
const { frei } = useVerfuegbarkeit()

const { data: material, loading, run: ladeMaterial } = useAsync(() => materialListe(s.abteilungId))
const kategorien = ref([])
const standorte = ref([])

async function laden() {
  if (!s.abteilungId) return
  const [, k, o] = await Promise.all([
    ladeMaterial().catch(() => null),
    ladeKategorien(s.abteilungId),
    ladeStandorte(s.abteilungId),
  ])
  kategorien.value = k.data ?? []
  standorte.value = o.data ?? []
}
watch(() => s.abteilungId, laden, { immediate: true })

const suche = ref('')
const kategorie = ref(null)
const standort = ref(null)
const ansicht = useLocalStorage('material-ansicht', 'grid')

const gefiltert = computed(() => {
  const q = suche.value.trim().toLowerCase()
  return (material.value ?? []).filter(
    (m) =>
      (!q || m.name.toLowerCase().includes(q) || m.beschreibung?.toLowerCase().includes(q)) &&
      (!kategorie.value || m.kategorien.some((k) => k.kategorie.id === kategorie.value)) &&
      (!standort.value || m.standort?.id === standort.value),
  )
})

function hinzufuegen(m) {
  cart.hinzufuegen(m)
  toast.ok(`${m.name} im Warenkorb`)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-xl font-bold dark:text-white">Material</h1>
      <RouterLink
        v-if="s.hasRole('matchef')"
        :to="{ name: 'material-neu' }"
        class="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-2 text-white hover:bg-green-700"
      >
        <PlusIcon class="size-5" /> Neues Material
      </RouterLink>
    </div>

    <section v-if="s.hasRole('member')" class="rounded-lg bg-white p-3 shadow-sm dark:bg-gray-700">
      <p class="mb-2 text-sm text-gray-600 dark:text-gray-300">
        Zeitraum wählen, um die Verfügbarkeit zu sehen:
      </p>
      <ZeitraumWahl />
    </section>

    <MaterialFilter
      v-model:suche="suche"
      v-model:kategorie="kategorie"
      v-model:standort="standort"
      v-model:ansicht="ansicht"
      :kategorien="kategorien"
      :standorte="standorte"
    />

    <p v-if="loading" class="text-center text-gray-500">Lädt …</p>

    <p v-else-if="!gefiltert.length" class="py-10 text-center text-gray-500">
      {{ material?.length ? 'Nichts gefunden.' : 'Noch kein Material erfasst.' }}
    </p>

    <div
      v-else-if="ansicht === 'grid'"
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    >
      <MaterialKarte
        v-for="m in gefiltert"
        :key="m.id"
        :material="m"
        :frei="frei.get(m.id)"
        @hinzufuegen="hinzufuegen"
        @schaden="schaden"
      />
    </div>

    <MaterialTabelle v-else :material="gefiltert" :frei="frei" @hinzufuegen="hinzufuegen" />

    <p v-if="gefiltert.length" class="text-center text-sm text-gray-500">
      {{ gefiltert.length }} Einträge
    </p>
    <SchadenMeldenModal v-model="schadenOffen" :material="schadenMaterial" @gemeldet="laden" />
  </div>
</template>
