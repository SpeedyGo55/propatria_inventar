<script setup>
import { computed, ref, watch } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useCartStore } from '@/stores/cart'
import { stufen as ladeStufen, anlaesse as ladeAnlaesse } from '@/api/stammdaten'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseInput from '@/components/base/BaseInput.vue'

const s = useSessionStore()
const cart = useCartStore()
const stufen = ref([])
const anlaesse = ref([])

watch(
  () => s.abteilungId,
  async (id) => {
    if (!id) return
    const [st, an] = await Promise.all([ladeStufen(id), ladeAnlaesse(id)])
    stufen.value = st.data ?? []
    anlaesse.value = an.data ?? []
  },
  { immediate: true },
)

const stufenOpt = computed(() => stufen.value.map((g) => ({ value: g.id, label: g.name })))
const anlassOpt = computed(() => anlaesse.value.map((g) => ({ value: g.id, label: g.name })))
// Freitext nur bei "Anderes" (typ = sonstiges)
const zeigeFreitext = computed(
  () => anlaesse.value.find((g) => g.id === cart.anlassId)?.typ === 'sonstiges',
)
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2">
    <BaseSelect
      v-model="cart.stufeId"
      label="Stufe"
      :optionen="stufenOpt"
      platzhalter="– keine –"
    />
    <BaseSelect
      v-model="cart.anlassId"
      label="Anlass"
      :optionen="anlassOpt"
      platzhalter="– keiner –"
    />
    <div v-if="zeigeFreitext" class="sm:col-span-2">
      <BaseInput v-model="cart.freitext" label="Wofür?" placeholder="z.B. Elternabend" required />
    </div>
  </div>
</template>
