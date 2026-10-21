<script setup>
import { STATUS } from '@/utils/status'

defineProps({ status: { type: String, required: true } })
</script>

<template>
  <span :class="STATUS[status]?.farbe" class="inline-block rounded-full px-2 py-0.5 text-xs font-medium">
    {{ STATUS[status]?.label ?? status }}
  </span>
</template>
