<script setup>
import { computed } from 'vue'
import { bestand } from '@/utils/material'

const props = defineProps({
  material: { type: Object, required: true },
  frei: { type: Number, default: undefined }, // undefined = kein Zeitraum gewählt
})

const anzeige = computed(() => {
  if (props.frei === undefined)
    return {
      text: `${bestand(props.material)} Stk.`,
      klasse: 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200',
    }
  if (props.frei <= 0) return { text: 'nicht verfügbar', klasse: 'bg-red-100 text-red-800' }
  return { text: `${props.frei} frei`, klasse: 'bg-green-100 text-green-800' }
})
</script>

<template>
  <span :class="anzeige.klasse" class="inline-block rounded-full px-2 py-0.5 text-xs font-medium">{{
    anzeige.text
  }}</span>
</template>
