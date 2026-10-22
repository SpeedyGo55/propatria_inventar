<script setup>
import { ref, watch } from 'vue'
import { PencilSquareIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'
import { liste, speichern, loeschen } from '@/api/stammdaten'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'

// felder: [{ key, label, typ?: 'text' | 'select' | 'checkbox', optionen?, standard?, pflicht? }]
const props = defineProps({
  tabelle: { type: String, required: true },
  felder: { type: Array, required: true },
  loeschHinweis: { type: String, default: '' },
})

const s = useSessionStore()
const toast = useToast()

const leer = () =>
  Object.fromEntries(
    props.felder.map((f) => [f.key, f.standard ?? (f.typ === 'checkbox' ? true : '')]),
  )
// Nur echte Spalten, leere Texte als null speichern
const nurFelder = (o) =>
  Object.fromEntries(props.felder.map((f) => [f.key, o[f.key] === '' ? null : o[f.key]]))
const anzeige = (f, wert) => {
  if (f.typ === 'checkbox') return wert ? '✓' : '–'
  if (f.typ === 'select') return f.optionen.find((o) => o.value === wert)?.label ?? wert
  return wert ?? ''
}
const fehlerText = (e) =>
  e.code === '23505'
    ? 'Diesen Namen gibt es schon.'
    : e.code === '23503'
      ? 'Wird noch verwendet.'
      : e.message

const eintraege = ref([])
const laedt = ref(false)
const neu = ref(leer())
const bearbeiteId = ref(null)
const entwurf = ref({})

async function laden() {
  if (!s.abteilungId) return
  laedt.value = true
  const { data, error } = await liste(props.tabelle, s.abteilungId)
  laedt.value = false
  if (error) return toast.fehler(error.message)
  eintraege.value = data
}
watch(() => s.abteilungId, laden, { immediate: true })

async function hinzufuegen() {
  const { error } = await speichern(props.tabelle, s.abteilungId, nurFelder(neu.value))
  if (error) return toast.fehler(fehlerText(error))
  neu.value = leer()
  toast.ok('Hinzugefügt')
  laden()
}

function bearbeiten(e) {
  bearbeiteId.value = e.id
  entwurf.value = { ...e }
}

async function speichernBearbeitet() {
  const { error } = await speichern(props.tabelle, s.abteilungId, {
    id: bearbeiteId.value,
    ...nurFelder(entwurf.value),
  })
  if (error) return toast.fehler(fehlerText(error))
  bearbeiteId.value = null
  toast.ok('Gespeichert')
  laden()
}

async function entfernen(e) {
  const text = `„${e.name}“ wirklich löschen?${props.loeschHinweis ? '\n\n' + props.loeschHinweis : ''}`
  if (!confirm(text)) return
  const { error } = await loeschen(props.tabelle, e.id)
  if (error) return toast.fehler(fehlerText(error))
  toast.ok('Gelöscht')
  laden()
}
</script>

<template>
  <div class="space-y-4">
    <!-- Neu -->
    <form
      class="flex flex-wrap items-end gap-2 rounded-lg bg-white p-3 shadow-sm dark:bg-gray-700"
      @submit.prevent="hinzufuegen"
    >
      <template v-for="f in felder" :key="f.key">
        <label v-if="f.typ === 'checkbox'" class="flex items-center gap-2 pb-2 text-sm">
          <input v-model="neu[f.key]" type="checkbox" class="size-4" /> {{ f.label }}
        </label>
        <BaseSelect
          v-else-if="f.typ === 'select'"
          v-model="neu[f.key]"
          :label="f.label"
          :optionen="f.optionen"
        />
        <BaseInput v-else v-model="neu[f.key]" :label="f.label" :required="f.pflicht" />
      </template>
      <BaseButton type="submit">Hinzufügen</BaseButton>
    </form>

    <!-- Liste -->
    <p v-if="laedt" class="text-gray-500">Lädt …</p>
    <div v-else class="overflow-x-auto rounded-lg bg-white shadow-md dark:bg-gray-700">
      <table class="min-w-full text-sm">
        <thead
          class="bg-gray-200 text-left text-xs uppercase text-gray-600 dark:bg-gray-600 dark:text-gray-200"
        >
          <tr>
            <th v-for="f in felder" :key="f.key" class="px-3 py-3">{{ f.label }}</th>
            <th class="w-1 px-3 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="e in eintraege"
            :key="e.id"
            class="border-b border-gray-200 dark:border-gray-600"
          >
            <template v-if="bearbeiteId === e.id">
              <td v-for="f in felder" :key="f.key" class="px-3 py-1">
                <input
                  v-if="f.typ === 'checkbox'"
                  v-model="entwurf[f.key]"
                  type="checkbox"
                  class="size-4"
                />
                <BaseSelect
                  v-else-if="f.typ === 'select'"
                  v-model="entwurf[f.key]"
                  :optionen="f.optionen"
                />
                <BaseInput v-else v-model="entwurf[f.key]" @keyup.enter="speichernBearbeitet" />
              </td>
              <td class="whitespace-nowrap px-3 py-1 text-right">
                <button type="button" class="mr-2 text-green-600" @click="speichernBearbeitet">
                  <CheckIcon class="size-5" /><span class="sr-only">Speichern</span>
                </button>
                <button type="button" class="text-gray-400" @click="bearbeiteId = null">
                  <XMarkIcon class="size-5" /><span class="sr-only">Abbrechen</span>
                </button>
              </td>
            </template>
            <template v-else>
              <td
                v-for="f in felder"
                :key="f.key"
                :class="e.aktiv === false && 'text-gray-400'"
                class="px-3 py-2"
              >
                {{ anzeige(f, e[f.key]) }}
              </td>
              <td class="whitespace-nowrap px-3 py-2 text-right">
                <button
                  type="button"
                  class="mr-2 text-gray-400 hover:text-blue-600"
                  @click="bearbeiten(e)"
                >
                  <PencilSquareIcon class="size-5" /><span class="sr-only">Bearbeiten</span>
                </button>
                <button
                  type="button"
                  class="text-gray-400 hover:text-red-600"
                  @click="entfernen(e)"
                >
                  <TrashIcon class="size-5" /><span class="sr-only">Löschen</span>
                </button>
              </td>
            </template>
          </tr>
          <tr v-if="!eintraege.length">
            <td :colspan="felder.length + 1" class="px-3 py-6 text-center text-gray-500">
              Noch keine Einträge.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
