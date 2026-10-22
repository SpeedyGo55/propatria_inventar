<script setup>
import { ref, watch } from 'vue'
import { ShoppingBagIcon } from '@heroicons/vue/24/outline'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'
import { unterMin, nachgekauft } from '@/api/material'
import BaseButton from '@/components/base/BaseButton.vue'

const s = useSessionStore()
const toast = useToast()
const liste = ref([])
const menge = ref({}) // material_id → eingegebene Menge

async function laden() {
  if (!s.abteilungId) return
  const { data, error } = await unterMin(s.abteilungId)
  if (error) return toast.fehler(error.message)
  liste.value = data
  menge.value = Object.fromEntries(data.map((m) => [m.id, m.fehlend]))
}
watch(() => s.abteilungId, laden, { immediate: true })

async function eingekauft(m) {
  const n = Number(menge.value[m.id])
  if (!n || n < 1) return
  const { error } = await nachgekauft(m.id, n)
  if (error) return toast.fehler(error.message)
  toast.ok(`${m.name}: +${n}`)
  laden()
}
</script>

<template>
  <section
    v-if="liste.length"
    class="space-y-2 rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/30"
  >
    <h2 class="flex items-center gap-2 font-semibold">
      <ShoppingBagIcon class="size-5" /> Nachkaufen ({{ liste.length }})
    </h2>
    <ul class="divide-y divide-yellow-200 dark:divide-yellow-800">
      <li v-for="m in liste" :key="m.id" class="flex flex-wrap items-center gap-2 py-2">
        <span class="min-w-0 flex-1">
          {{ m.name }}
          <span class="block text-xs text-gray-600 dark:text-gray-300">
            Bestand {{ m.bestand }} / Minimum {{ m.min_bestand }} · es fehlen {{ m.fehlend }}
          </span>
        </span>
        <input
          v-model.number="menge[m.id]"
          type="number"
          min="1"
          class="w-16 rounded border border-gray-300 px-2 py-1 text-center dark:border-gray-500 dark:bg-gray-600"
        />
        <BaseButton variant="secondary" class="!px-3 !py-1 text-sm" @click="eingekauft(m)"
          >Eingekauft</BaseButton
        >
      </li>
    </ul>
  </section>
</template>
