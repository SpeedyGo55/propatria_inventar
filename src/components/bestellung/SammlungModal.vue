<script setup>
import { ref, watch } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useCartStore } from '@/stores/cart'
import { useToast } from '@/composables/useToast'
import { sammlungen as ladeSammlungen } from '@/api/stammdaten'
import BaseModal from '@/components/base/BaseModal.vue'

const offen = defineModel({ type: Boolean, default: false })
const s = useSessionStore()
const cart = useCartStore()
const toast = useToast()
const liste = ref([])

watch(offen, async (o) => {
  if (!o) return
  const { data, error } = await ladeSammlungen(s.abteilungId)
  if (error) return toast.fehler(error.message)
  liste.value = data
})

function waehlen(sm) {
  for (const it of sm.items) cart.hinzufuegen(it.material, it.anzahl)
  toast.ok(`${sm.name} hinzugefügt`)
  offen.value = false
}
</script>

<template>
  <BaseModal v-model="offen" titel="Sammlung hinzufügen">
    <p v-if="!liste.length" class="text-sm text-gray-500">Keine Sammlungen vorhanden.</p>
    <ul class="divide-y divide-gray-200 dark:divide-gray-600">
      <li v-for="sm in liste" :key="sm.id">
        <button type="button" class="w-full px-2 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600" @click="waehlen(sm)">
          <span class="font-medium">{{ sm.name }}</span>
          <span class="block text-sm text-gray-500 dark:text-gray-300">
            {{ sm.items.map((i) => `${i.anzahl}× ${i.material.name}`).join(', ') }}
          </span>
        </button>
      </li>
    </ul>
  </BaseModal>
</template>
