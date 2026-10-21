<script setup>
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | danger | ghost
  type: { type: String, default: 'button' },
  loading: Boolean,
  disabled: Boolean,
})

const VARIANTEN = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600',
  secondary: 'border border-gray-300 hover:bg-gray-100 dark:border-gray-500 dark:hover:bg-gray-600',
  danger: 'bg-red-700 text-white hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900',
  ghost: 'text-blue-600 hover:underline dark:text-blue-400',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="VARIANTEN[variant]"
    class="inline-flex items-center justify-center gap-2 rounded px-4 py-2 font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <ArrowPathIcon v-if="loading" class="size-4 animate-spin" />
    <slot />
  </button>
</template>
