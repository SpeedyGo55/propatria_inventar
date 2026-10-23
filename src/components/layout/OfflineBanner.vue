<script setup>
import { useOnline } from '@vueuse/core'
import { SignalSlashIcon } from '@heroicons/vue/24/outline'

const online = useOnline()
</script>

<template>
  <div
    v-if="!online"
    class="flex items-center justify-center gap-2 bg-yellow-400 px-4 py-2 text-sm font-medium text-yellow-950"
    role="status"
  >
    <SignalSlashIcon class="size-5" />
    Offline – du siehst den zuletzt geladenen Stand. Bestellen geht erst wieder mit Netz.
  </div>
</template>
