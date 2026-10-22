<script setup>
import { RouterLink } from 'vue-router'
import { PencilSquareIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { useSessionStore } from '@/stores/session'
import VerfuegbarBadge from './VerfuegbarBadge.vue'

defineProps({
  material: { type: Array, required: true },
  frei: { type: Map, required: true },
})
defineEmits(['hinzufuegen'])
const s = useSessionStore()
</script>

<template>
  <div class="overflow-x-auto rounded-lg bg-white shadow-md dark:bg-gray-700">
    <table class="min-w-full text-sm">
      <thead
        class="bg-gray-200 text-left text-xs uppercase text-gray-600 dark:bg-gray-600 dark:text-gray-200"
      >
        <tr>
          <th class="px-3 py-3">Name</th>
          <th class="hidden px-3 py-3 md:table-cell">Kategorien</th>
          <th class="hidden px-3 py-3 sm:table-cell">Standort</th>
          <th class="px-3 py-3">Verfügbar</th>
          <th class="w-1 px-3 py-3"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="m in material"
          :key="m.id"
          class="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          <td class="px-3 py-2 font-medium">{{ m.name }}</td>
          <td class="hidden px-3 py-2 md:table-cell">
            {{ m.kategorien.map((k) => k.kategorie.name).join(', ') }}
          </td>
          <td class="hidden px-3 py-2 sm:table-cell">{{ m.standort?.name }}</td>
          <td class="px-3 py-2"><VerfuegbarBadge :material="m" :frei="frei.get(m.id)" /></td>
          <td class="whitespace-nowrap px-3 py-2 text-right">
            <RouterLink
              v-if="s.hasRole('matchef')"
              :to="{ name: 'material-edit', params: { id: m.id } }"
              class="mr-2 inline-block text-gray-400 hover:text-blue-600"
            >
              <PencilSquareIcon class="size-5" />
            </RouterLink>
            <button
              v-if="s.hasRole('member')"
              type="button"
              :disabled="frei.has(m.id) && frei.get(m.id) <= 0"
              class="rounded bg-blue-500 p-1 text-white hover:bg-blue-600 disabled:opacity-40 dark:bg-blue-700"
              @click="$emit('hinzufuegen', m)"
            >
              <PlusIcon class="size-4" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
