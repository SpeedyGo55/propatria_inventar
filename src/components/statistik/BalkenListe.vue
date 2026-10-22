<script setup>
import { computed } from 'vue'

const props = defineProps({
  eintraege: { type: Array, required: true }, // [{ label, wert, hinweis? }]
  einheit: { type: String, default: '' },
})
const max = computed(() => Math.max(1, ...props.eintraege.map((e) => e.wert)))
</script>

<template>
  <p v-if="!eintraege.length" class="text-sm text-gray-500">Noch keine Daten.</p>
  <ul v-else class="space-y-2">
    <li
      v-for="e in eintraege"
      :key="e.label"
      :title="`${e.label}: ${e.wert} ${einheit}${e.hinweis ? ' · ' + e.hinweis : ''}`"
      class="text-sm"
    >
      <div class="flex justify-between gap-2">
        <span class="truncate">{{ e.label }}</span>
        <span class="shrink-0 tabular-nums text-gray-600 dark:text-gray-300">
          {{ e.wert
          }}<span v-if="e.hinweis" class="ml-1 text-xs text-gray-400">({{ e.hinweis }})</span>
        </span>
      </div>
      <div class="mt-0.5 h-2 rounded-r bg-gray-100 dark:bg-gray-600">
        <div
          class="h-2 rounded-r bg-blue-500 dark:bg-blue-400"
          :style="{ width: `${(e.wert / max) * 100}%` }"
        />
      </div>
    </li>
  </ul>
</template>
