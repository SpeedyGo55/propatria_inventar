<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import imageCompression from 'browser-image-compression'
import { TrashIcon, PhotoIcon } from '@heroicons/vue/24/outline'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'
import { materialEinzeln, materialSpeichern, kategorienSetzen, archivieren, bildHochladen, bildLoeschen } from '@/api/material'
import { kategorien as ladeKategorien, standorte as ladeStandorte } from '@/api/stammdaten'
import { ZUSTAENDE } from '@/utils/material'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const props = defineProps({ id: { type: String, default: null } }) // null = neues Material

const s = useSessionStore()
const toast = useToast()
const router = useRouter()

// Nur diese Spalten werden gespeichert (eingebettete Objekte wie "standort" fliegen raus)
const SPALTEN = ['name', 'beschreibung', 'anzahl', 'consumable', 'min_bestand', 'standort_id', 'zustand',
                 'gewicht_kg', 'inventarnummer', 'kaufdatum', 'kaufpreis', 'image_urls', 'only_internal']

const form = ref({
  name: '', beschreibung: '', anzahl: 1, consumable: false, min_bestand: null, standort_id: null,
  zustand: null, gewicht_kg: null, inventarnummer: '', kaufdatum: '', kaufpreis: null,
  image_urls: [], only_internal: true,
})
const kategorieIds = ref([])
const kategorien = ref([])
const standorte = ref([])
const zuLoeschen = ref([]) // Bild-URLs, die beim Speichern entfernt werden
const laedt = ref(true)
const speichert = ref(false)
const bildLaedt = ref(false)

const standortOptionen = computed(() => standorte.value.map((o) => ({ value: o.id, label: o.name })))

onMounted(async () => {
  const [k, o] = await Promise.all([ladeKategorien(s.abteilungId), ladeStandorte(s.abteilungId)])
  kategorien.value = k.data ?? []
  standorte.value = o.data ?? []

  if (props.id) {
    const { data, error } = await materialEinzeln(Number(props.id))
    if (error) {
      toast.fehler('Material nicht gefunden')
      return router.replace({ name: 'material' })
    }
    form.value = Object.fromEntries(SPALTEN.map((k) => [k, data[k] ?? (k === 'image_urls' ? [] : null)]))
    kategorieIds.value = data.kategorien.map((k) => k.kategorie_id)
  }
  laedt.value = false
})

function kategorieUmschalten(id) {
  kategorieIds.value = kategorieIds.value.includes(id)
    ? kategorieIds.value.filter((k) => k !== id)
    : [...kategorieIds.value, id]
}

async function bilderGewaehlt(ev) {
  const dateien = [...ev.target.files]
  ev.target.value = ''
  bildLaedt.value = true
  try {
    for (const datei of dateien) {
      const klein = await imageCompression(datei, { maxSizeMB: 0.5, maxWidthOrHeight: 1600, useWebWorker: true })
      form.value.image_urls.push(await bildHochladen(s.abteilungId, klein))
    }
  } catch (e) {
    toast.fehler('Bild-Upload fehlgeschlagen: ' + e.message)
  } finally {
    bildLaedt.value = false
  }
}

function bildEntfernen(url) {
  form.value.image_urls = form.value.image_urls.filter((u) => u !== url)
  zuLoeschen.value.push(url)
}

function fehlerText(e) {
  if (e.code === '23514') return 'Die Anzahl ist kleiner als beschädigt + verloren.'
  return e.message
}

async function speichern() {
  speichert.value = true
  // '' → null, Mindestbestand nur bei Verbrauchsmaterial
  const felder = Object.fromEntries(Object.entries(form.value).map(([k, v]) => [k, v === '' ? null : v]))
  if (!felder.consumable) felder.min_bestand = null
  if (props.id) felder.id = Number(props.id)

  const { data, error } = await materialSpeichern(s.abteilungId, felder)
  if (error) {
    speichert.value = false
    return toast.fehler(fehlerText(error))
  }
  const kat = await kategorienSetzen(data.id, kategorieIds.value)
  if (kat.error) toast.fehler('Kategorien: ' + kat.error.message)

  await Promise.all(zuLoeschen.value.map(bildLoeschen))
  speichert.value = false
  toast.ok('Gespeichert')
  router.push({ name: 'material' })
}

async function archivierenKlick() {
  if (!confirm(`„${form.value.name}“ archivieren? Es verschwindet aus der Liste, alte Bestellungen bleiben erhalten.`)) return
  const { error } = await archivieren(Number(props.id))
  if (error) return toast.fehler(error.message)
  toast.ok('Archiviert')
  router.push({ name: 'material' })
}
</script>

<template>
  <p v-if="laedt" class="text-gray-500">Lädt …</p>

  <form v-else class="mx-auto max-w-2xl space-y-6" @submit.prevent="speichern">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold dark:text-white">{{ id ? 'Material bearbeiten' : 'Neues Material' }}</h1>
      <BaseButton variant="secondary" @click="router.back()">Abbrechen</BaseButton>
    </div>

    <!-- Grunddaten -->
    <section class="space-y-3 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
      <BaseInput v-model="form.name" label="Name" required />
      <div>
        <label for="beschreibung" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Beschreibung</label>
        <textarea
          id="beschreibung"
          v-model="form.beschreibung"
          rows="3"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm dark:border-gray-500 dark:bg-gray-600"
        />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <BaseInput v-model.number="form.anzahl" label="Anzahl" type="number" min="0" required />
        <BaseSelect v-model="form.standort_id" label="Standort" :optionen="standortOptionen" platzhalter="– kein –" />
      </div>
      <label class="flex items-center gap-2 text-sm">
        <input v-model="form.consumable" type="checkbox" class="size-4" /> Verbrauchsmaterial (wird bei Rückgabe abgebucht)
      </label>
      <BaseInput
        v-if="form.consumable"
        v-model.number="form.min_bestand"
        label="Mindestbestand (Warnung, wenn darunter)"
        type="number"
        min="0"
      />
    </section>

    <!-- Kategorien -->
    <section class="space-y-2 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
      <h2 class="font-semibold">Kategorien</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="k in kategorien"
          :key="k.id"
          type="button"
          :class="kategorieIds.includes(k.id) ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-600'"
          class="rounded-full px-3 py-1 text-sm"
          @click="kategorieUmschalten(k.id)"
        >
          {{ k.name }}
        </button>
        <p v-if="!kategorien.length" class="text-sm text-gray-500">Noch keine Kategorien – unter „Verwaltung“ anlegen.</p>
      </div>
    </section>

    <!-- Bilder -->
    <section class="space-y-2 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
      <h2 class="font-semibold">Bilder</h2>
      <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
        <div v-for="url in form.image_urls" :key="url" class="relative aspect-square overflow-hidden rounded">
          <img :src="url" alt="" class="size-full object-cover" />
          <button
            type="button"
            class="absolute right-1 top-1 rounded bg-white/80 p-1 text-red-600 hover:bg-white"
            @click="bildEntfernen(url)"
          >
            <TrashIcon class="size-4" /><span class="sr-only">Bild entfernen</span>
          </button>
        </div>
        <label
          class="flex aspect-square cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-blue-500 dark:border-gray-500"
        >
          <PhotoIcon class="size-8" />
          {{ bildLaedt ? 'Lädt …' : 'Hinzufügen' }}
          <input type="file" accept="image/*" multiple class="sr-only" :disabled="bildLaedt" @change="bilderGewaehlt" />
        </label>
      </div>
    </section>

    <!-- Details (optional) -->
    <details class="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
      <summary class="cursor-pointer font-semibold">Weitere Angaben</summary>
      <div class="mt-3 grid grid-cols-2 gap-3">
        <BaseSelect v-model="form.zustand" label="Zustand" :optionen="ZUSTAENDE" platzhalter="– unbekannt –" />
        <BaseInput v-model.number="form.gewicht_kg" label="Gewicht (kg)" type="number" step="0.01" min="0" />
        <BaseInput v-model="form.inventarnummer" label="Inventarnummer" />
        <BaseInput v-model="form.kaufdatum" label="Kaufdatum" type="date" />
        <BaseInput v-model.number="form.kaufpreis" label="Kaufpreis (CHF)" type="number" step="0.05" min="0" />
      </div>
    </details>

    <div class="flex flex-wrap justify-between gap-2">
      <BaseButton v-if="id" variant="danger" @click="archivierenKlick">Archivieren</BaseButton>
      <BaseButton type="submit" class="ml-auto" :loading="speichert" :disabled="bildLaedt">Speichern</BaseButton>
    </div>
  </form>
</template>
