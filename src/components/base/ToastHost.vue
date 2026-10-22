<script setup>
import { useToast } from '@/composables/useToast'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

const { toasts } = useToast()

const STIL = {
  ok: { icon: CheckCircleIcon, klasse: 'bg-green-600 text-white' },
  fehler: { icon: ExclamationTriangleIcon, klasse: 'bg-red-600 text-white' },
  info: {
    icon: InformationCircleIcon,
    klasse: 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900',
  },
}

function schliessen(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-4 md:items-end"
    aria-live="polite"
  >
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        :class="STIL[t.typ].klasse"
        class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg px-4 py-3 shadow-lg"
        :role="t.typ === 'fehler' ? 'alert' : 'status'"
      >
        <component :is="STIL[t.typ].icon" class="size-5 shrink-0" />
        <p class="flex-1 text-sm">{{ t.text }}</p>
        <button
          type="button"
          class="shrink-0 opacity-70 hover:opacity-100"
          @click="schliessen(t.id)"
        >
          <XMarkIcon class="size-5" />
          <span class="sr-only">Schliessen</span>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
