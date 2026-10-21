<script setup>
import { VueFinalModal } from 'vue-final-modal'

const offen = defineModel({ type: Boolean, default: false })
defineProps({ titel: String })
</script>

<template>
  <VueFinalModal
    v-model="offen"
    class="flex items-center justify-center"
    content-class="mx-4 w-full max-w-md"
    overlay-transition="vfm-fade"
    content-transition="vfm-fade"
  >
    <div class="rounded-lg bg-white p-6 shadow-xl dark:bg-gray-700 dark:text-gray-200">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">{{ titel }}</h2>
        <button
          type="button"
          class="text-2xl leading-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          @click="offen = false"
        >
          &times;
        </button>
      </div>
      <slot />
      <div v-if="$slots.footer" class="mt-6 flex justify-end gap-2">
        <slot name="footer" />
      </div>
    </div>
  </VueFinalModal>
</template>
