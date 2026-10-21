<script setup>
import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { alsDatumInput, tagStart, tagEnde } from '@/utils/format'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const cart = useCartStore()
const heute = alsDatumInput(new Date().toISOString())

const von = computed({
  get: () => alsDatumInput(cart.von),
  set: (v) => (cart.von = v ? tagStart(v) : null),
})
const bis = computed({
  get: () => alsDatumInput(cart.bis),
  set: (v) => (cart.bis = v ? tagEnde(v) : null),
})

function loeschen() {
  cart.von = null
  cart.bis = null
}
</script>

<template>
  <div class="flex flex-wrap items-end gap-2">
    <BaseInput v-model="von" type="date" label="Von" :min="heute" />
    <BaseInput v-model="bis" type="date" label="Bis" :min="von || heute" />
    <BaseButton v-if="cart.von || cart.bis" variant="ghost" @click="loeschen">Zeitraum löschen</BaseButton>
  </div>
</template>
