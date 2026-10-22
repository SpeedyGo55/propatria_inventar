<script setup>
import { RouterLink } from 'vue-router'
import StatusBadge from '@/components/base/StatusBadge.vue'
import { datum } from '@/utils/format'
import { zuordnung, stueck, istUeberfaellig } from '@/utils/bestellung'

defineProps({
  bestellung: { type: Object, required: true },
  zeigeBesteller: Boolean,
})
</script>

<template>
  <RouterLink
    :to="{ name: 'bestellung', params: { id: bestellung.id } }"
    class="block rounded-lg bg-white p-3 shadow-sm hover:shadow-md dark:bg-gray-700"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <p class="truncate font-semibold">{{ zuordnung(bestellung) }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          {{ datum(bestellung.von) }} – {{ datum(bestellung.bis) }}
          <span v-if="istUeberfaellig(bestellung)" class="ml-1 font-medium text-red-600"
            >überfällig</span
          >
        </p>
        <p
          v-if="zeigeBesteller && bestellung.besteller"
          class="text-sm text-gray-500 dark:text-gray-400"
        >
          {{ bestellung.besteller.display_name }}
        </p>
      </div>
      <StatusBadge :status="bestellung.status" />
    </div>
    <p class="mt-2 truncate text-sm text-gray-500 dark:text-gray-400">
      {{ stueck(bestellung) }} Stk.:
      {{ bestellung.items.map((i) => `${i.anzahl}× ${i.material.name}`).join(', ') }}
    </p>
  </RouterLink>
</template>
