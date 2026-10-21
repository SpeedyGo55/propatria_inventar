<script setup>
import { computed } from 'vue'
import { MagnifyingGlassIcon, Squares2X2Icon, TableCellsIcon } from '@heroicons/vue/24/outline'
import BaseSelect from '@/components/base/BaseSelect.vue'

const props = defineProps({
  kategorien: { type: Array, default: () => [] },
  standorte: { type: Array, default: () => [] },
})
const suche = defineModel('suche', { default: '' })
const kategorie = defineModel('kategorie', { default: null })
const standort = defineModel('standort', { default: null })
const ansicht = defineModel('ansicht', { default: 'grid' })

const katOptionen = computed(() => props.kategorien.map((k) => ({ value: k.id, label: k.name })))
const ortOptionen = computed(() => props.standorte.map((o) => ({ value: o.id, label: o.name })))
</script>

<template>
  <div class="flex flex-wrap items-end gap-2">
    <label class="relative min-w-48 flex-1">
      <span class="sr-only">Suche</span>
      <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
      <input
        v-model="suche"
        type="search"
        placeholder="Material suchen …"
        class="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 shadow-sm focus:border-blue-500 focus:outline-none dark:border-gray-500 dark:bg-gray-600"
      />
    </label>
    <BaseSelect v-model="kategorie" :optionen="katOptionen" platzhalter="Alle Kategorien" class="w-44" />
    <BaseSelect v-model="standort" :optionen="ortOptionen" platzhalter="Alle Standorte" class="w-44" />
    <div class="flex overflow-hidden rounded-md border border-gray-300 dark:border-gray-500">
      <button
        type="button"
        :class="ansicht === 'grid' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-600'"
        class="px-3 py-2"
        @click="ansicht = 'grid'"
      >
        <Squares2X2Icon class="size-5" /><span class="sr-only">Kacheln</span>
      </button>
      <button
        type="button"
        :class="ansicht === 'tabelle' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-600'"
        class="px-3 py-2"
        @click="ansicht = 'tabelle'"
      >
        <TableCellsIcon class="size-5" /><span class="sr-only">Tabelle</span>
      </button>
    </div>
  </div>
</template>
