<script setup>
import { useId } from 'vue'

defineOptions({ inheritAttrs: false })
defineProps({
  label: String,
  fehler: String,
  optionen: { type: Array, default: () => [] }, // [{ value, label }]
  platzhalter: String,
})
const model = defineModel()
const id = useId()
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
    </label>
    <select
      :id="id"
      v-model="model"
      v-bind="$attrs"
      class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-200"
    >
      <option v-if="platzhalter" :value="null">{{ platzhalter }}</option>
      <option v-for="o in optionen" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <p v-if="fehler" class="mt-1 text-sm text-red-600">{{ fehler }}</p>
  </div>
</template>
