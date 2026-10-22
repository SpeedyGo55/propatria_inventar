<script setup>
import { computed, ref, watch } from 'vue'
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'
import {
  sammlungen as ladeSammlungen,
  sammlungSpeichern,
  sammlungItemsSetzen,
  sammlungLoeschen,
} from '@/api/stammdaten'
import { materialListe } from '@/api/material'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseModal from '@/components/base/BaseModal.vue'

const s = useSessionStore()
const toast = useToast()

const liste = ref([])
const material = ref([])
const laedt = ref(true)

async function laden() {
  if (!s.abteilungId) return
  laedt.value = true
  const [sm, m] = await Promise.all([ladeSammlungen(s.abteilungId), materialListe(s.abteilungId)])
  laedt.value = false
  if (sm.error) return toast.fehler(sm.error.message)
  liste.value = sm.data
  material.value = m.data ?? []
}
watch(() => s.abteilungId, laden, { immediate: true })

// --- Editor ---
const offen = ref(false)
const speichert = ref(false)
const form = ref({ id: null, name: '', beschreibung: '' })
const items = ref([]) // [{ material_id, name, anzahl }]
const auswahl = ref(null)
const auswahlAnzahl = ref(1)

// Nur Material anbieten, das noch nicht in der Sammlung ist
const materialOpt = computed(() =>
  material.value
    .filter((m) => !items.value.some((i) => i.material_id === m.id))
    .map((m) => ({ value: m.id, label: m.name })),
)

function neu() {
  form.value = { id: null, name: '', beschreibung: '' }
  items.value = []
  offen.value = true
}

function bearbeiten(sm) {
  form.value = { id: sm.id, name: sm.name, beschreibung: sm.beschreibung ?? '' }
  items.value = sm.items.map((i) => ({
    material_id: i.material.id,
    name: i.material.name,
    anzahl: i.anzahl,
  }))
  offen.value = true
}

function itemHinzufuegen() {
  const m = material.value.find((x) => x.id === auswahl.value)
  if (!m) return
  items.value.push({
    material_id: m.id,
    name: m.name,
    anzahl: Math.max(1, auswahlAnzahl.value || 1),
  })
  auswahl.value = null
  auswahlAnzahl.value = 1
}

async function speichern() {
  speichert.value = true
  const eintrag = {
    name: form.value.name.trim(),
    beschreibung: form.value.beschreibung.trim() || null,
  }
  if (form.value.id) eintrag.id = form.value.id

  const { data, error } = await sammlungSpeichern(s.abteilungId, eintrag)
  if (error) {
    speichert.value = false
    return toast.fehler(error.code === '23505' ? 'Diesen Namen gibt es schon.' : error.message)
  }
  const res = await sammlungItemsSetzen(data.id, items.value)
  speichert.value = false
  if (res.error) return toast.fehler(res.error.message)

  offen.value = false
  toast.ok('Gespeichert')
  laden()
}

async function loeschen(sm) {
  if (!confirm(`Sammlung „${sm.name}“ löschen? Das Material selbst bleibt erhalten.`)) return
  const { error } = await sammlungLoeschen(sm.id)
  if (error) return toast.fehler(error.message)
  toast.ok('Gelöscht')
  laden()
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-xl font-bold dark:text-white">Sammlungen</h1>
      <BaseButton @click="neu"><PlusIcon class="size-5" /> Neue Sammlung</BaseButton>
    </div>
    <p class="text-sm text-gray-600 dark:text-gray-300">
      Sammlungen sind Material-Sets, die man mit einem Klick in den Warenkorb legen kann (z.B.
      „Kochset Stufe“).
    </p>

    <p v-if="laedt" class="text-gray-500">Lädt …</p>
    <p v-else-if="!liste.length" class="py-10 text-center text-gray-500">Noch keine Sammlungen.</p>

    <div v-else class="grid gap-3 sm:grid-cols-2">
      <article
        v-for="sm in liste"
        :key="sm.id"
        class="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700"
      >
        <div class="flex items-start justify-between gap-2">
          <h2 class="font-semibold">{{ sm.name }}</h2>
          <div class="flex shrink-0 gap-2">
            <button type="button" class="text-gray-400 hover:text-blue-600" @click="bearbeiten(sm)">
              <PencilSquareIcon class="size-5" /><span class="sr-only">Bearbeiten</span>
            </button>
            <button type="button" class="text-gray-400 hover:text-red-600" @click="loeschen(sm)">
              <TrashIcon class="size-5" /><span class="sr-only">Löschen</span>
            </button>
          </div>
        </div>
        <p v-if="sm.beschreibung" class="text-sm text-gray-600 dark:text-gray-300">
          {{ sm.beschreibung }}
        </p>
        <ul class="mt-2 text-sm">
          <li v-for="i in sm.items" :key="i.material.id">{{ i.anzahl }}× {{ i.material.name }}</li>
        </ul>
      </article>
    </div>

    <BaseModal v-model="offen" :titel="form.id ? 'Sammlung bearbeiten' : 'Neue Sammlung'">
      <form id="sammlung-form" class="space-y-3" @submit.prevent="speichern">
        <BaseInput v-model="form.name" label="Name" required />
        <BaseInput v-model="form.beschreibung" label="Beschreibung" />

        <div>
          <p class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Material</p>
          <ul class="divide-y divide-gray-200 dark:divide-gray-600">
            <li v-for="(i, idx) in items" :key="i.material_id" class="flex items-center gap-2 py-1">
              <span class="min-w-0 flex-1 truncate">{{ i.name }}</span>
              <input
                v-model.number="i.anzahl"
                type="number"
                min="1"
                class="w-16 rounded border border-gray-300 px-2 py-1 text-center dark:border-gray-500 dark:bg-gray-600"
              />
              <button
                type="button"
                class="text-gray-400 hover:text-red-600"
                @click="items.splice(idx, 1)"
              >
                <TrashIcon class="size-4" /><span class="sr-only">Entfernen</span>
              </button>
            </li>
            <li v-if="!items.length" class="py-2 text-sm text-gray-500">Noch kein Material.</li>
          </ul>

          <div class="mt-2 flex items-end gap-2">
            <div class="min-w-0 flex-1">
              <BaseSelect
                v-model="auswahl"
                :optionen="materialOpt"
                platzhalter="Material wählen …"
              />
            </div>
            <input
              v-model.number="auswahlAnzahl"
              type="number"
              min="1"
              class="w-16 rounded border border-gray-300 px-2 py-2 text-center dark:border-gray-500 dark:bg-gray-600"
            />
            <BaseButton variant="secondary" :disabled="!auswahl" @click="itemHinzufuegen">
              <PlusIcon class="size-5" /><span class="sr-only">Hinzufügen</span>
            </BaseButton>
          </div>
        </div>
      </form>

      <template #footer>
        <BaseButton variant="secondary" @click="offen = false">Abbrechen</BaseButton>
        <BaseButton type="submit" form="sammlung-form" :loading="speichert">Speichern</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
