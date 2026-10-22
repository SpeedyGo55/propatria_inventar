<script setup>
import { RouterLink } from 'vue-router'
import { CubeIcon, PencilSquareIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { useSessionStore } from '@/stores/session'
import VerfuegbarBadge from './VerfuegbarBadge.vue'

defineProps({
  material: { type: Object, required: true },
  frei: { type: Number, default: undefined },
})
defineEmits(['hinzufuegen'])
const s = useSessionStore()
</script>

<template>
  <article class="flex flex-col overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-700">
    <div class="aspect-[4/3] bg-gray-100 dark:bg-gray-600">
      <img
        v-if="material.image_urls[0]"
        :src="material.image_urls[0]"
        :alt="material.name"
        loading="lazy"
        class="size-full object-cover"
      />
      <CubeIcon v-else class="m-auto size-full p-10 text-gray-300 dark:text-gray-500" />
    </div>

    <div class="flex flex-1 flex-col gap-2 p-3">
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-semibold">{{ material.name }}</h3>
        <RouterLink
          v-if="s.hasRole('matchef')"
          :to="{ name: 'material-edit', params: { id: material.id } }"
          class="shrink-0 text-gray-400 hover:text-blue-600"
        >
          <PencilSquareIcon class="size-5" /><span class="sr-only">Bearbeiten</span>
        </RouterLink>
      </div>

      <p v-if="material.standort" class="text-sm text-gray-500 dark:text-gray-300">
        {{ material.standort.name }}
      </p>

      <div class="flex flex-wrap gap-1">
        <span
          v-for="k in material.kategorien"
          :key="k.kategorie.id"
          class="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-200"
        >
          {{ k.kategorie.name }}
        </span>
      </div>

      <div class="mt-auto flex items-center justify-between pt-2">
        <VerfuegbarBadge :material="material" :frei="frei" />
        <button
          v-if="s.hasRole('member')"
          type="button"
          :disabled="frei !== undefined && frei <= 0"
          class="rounded bg-blue-500 p-1.5 text-white hover:bg-blue-600 disabled:opacity-40 dark:bg-blue-700"
          @click="$emit('hinzufuegen', material)"
        >
          <PlusIcon class="size-5" /><span class="sr-only">In den Warenkorb</span>
        </button>
      </div>
    </div>
  </article>
</template>
