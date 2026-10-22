<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useSessionStore } from '@/stores/session'
import { useCartStore } from '@/stores/cart'
import { useToast } from '@/composables/useToast'
import { useVerfuegbarkeit } from '@/composables/useVerfuegbarkeit'
import { erstellen } from '@/api/bestellungen'
import ZeitraumWahl from '@/components/material/ZeitraumWahl.vue'
import ZuordnungWahl from '@/components/bestellung/ZuordnungWahl.vue'
import SammlungModal from '@/components/bestellung/SammlungModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const s = useSessionStore()
const cart = useCartStore()
const toast = useToast()
const router = useRouter()
const { frei, neuLaden } = useVerfuegbarkeit()

const sammlungOffen = ref(false)
const sendet = ref(false)

const zuViel = (it) =>
  cart.zeitraumGesetzt &&
  frei.value.has(it.material_id) &&
  it.anzahl > frei.value.get(it.material_id)

const fehlt = computed(() => {
  if (!cart.items.length) return 'Der Warenkorb ist leer.'
  if (!cart.zeitraumGesetzt) return 'Bitte Zeitraum wählen.'
  if (!cart.stufeId && !cart.anlassId) return 'Bitte Stufe oder Anlass wählen.'
  if (cart.items.some(zuViel)) return 'Nicht alles ist im Zeitraum verfügbar.'
  return null
})

async function bestellen() {
  sendet.value = true
  const { data: id, error } = await erstellen({
    abteilungId: s.abteilungId,
    von: cart.von,
    bis: cart.bis,
    items: cart.items,
    stufeId: cart.stufeId,
    anlassId: cart.anlassId,
    gruppeFreitext: cart.freitext || null,
    kommentar: cart.kommentar || null,
  })
  sendet.value = false
  if (error) {
    if (error.hint === 'nicht_verfuegbar') neuLaden() // jemand war schneller → Zahlen aktualisieren
    return toast.fehler(error.message)
  }
  cart.leeren()
  toast.ok('Bestellung gesendet')
  router.push({ name: 'bestellung', params: { id } })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="bestellen">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-xl font-bold dark:text-white">Warenkorb</h1>
      <BaseButton variant="secondary" @click="sammlungOffen = true">Sammlung hinzufügen</BaseButton>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <!-- Positionen -->
      <section class="rounded-lg bg-white shadow-sm lg:col-span-2 dark:bg-gray-700">
        <p v-if="!cart.items.length" class="p-6 text-center text-gray-500">
          Noch leer.
          <RouterLink :to="{ name: 'material' }" class="text-blue-600 hover:underline"
            >Material ansehen</RouterLink
          >
        </p>
        <ul v-else class="divide-y divide-gray-200 dark:divide-gray-600">
          <li
            v-for="it in cart.items"
            :key="it.material_id"
            :class="zuViel(it) && 'bg-red-50 dark:bg-red-900/30'"
            class="flex items-center gap-3 px-3 py-2"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate">{{ it.name }}</p>
              <p
                v-if="cart.zeitraumGesetzt && frei.has(it.material_id)"
                :class="zuViel(it) ? 'text-red-600' : 'text-gray-500'"
                class="text-xs"
              >
                {{ frei.get(it.material_id) }} frei im Zeitraum
              </p>
            </div>
            <div class="flex items-center">
              <button
                type="button"
                class="rounded-l border border-gray-300 p-1.5 dark:border-gray-500"
                @click="cart.setzen(it.material_id, it.anzahl - 1)"
              >
                <MinusIcon class="size-4" /><span class="sr-only">Weniger</span>
              </button>
              <input
                :value="it.anzahl"
                type="number"
                min="1"
                class="w-14 border-y border-gray-300 py-1 text-center dark:border-gray-500 dark:bg-gray-600"
                @change="cart.setzen(it.material_id, Number($event.target.value))"
              />
              <button
                type="button"
                class="rounded-r border border-gray-300 p-1.5 dark:border-gray-500"
                @click="cart.setzen(it.material_id, it.anzahl + 1)"
              >
                <PlusIcon class="size-4" /><span class="sr-only">Mehr</span>
              </button>
            </div>
            <button
              type="button"
              class="text-gray-400 hover:text-red-600"
              @click="cart.entfernen(it.material_id)"
            >
              <TrashIcon class="size-5" /><span class="sr-only">Entfernen</span>
            </button>
          </li>
        </ul>
      </section>

      <!-- Angaben -->
      <section class="space-y-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
        <ZeitraumWahl />
        <ZuordnungWahl />
        <div>
          <label for="kommentar" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Kommentar (optional)</label
          >
          <textarea
            id="kommentar"
            v-model="cart.kommentar"
            rows="3"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-500 dark:bg-gray-600"
          />
        </div>
        <p v-if="fehlt" class="text-sm text-gray-500">{{ fehlt }}</p>
        <BaseButton type="submit" class="w-full" :loading="sendet" :disabled="!!fehlt"
          >Bestellen</BaseButton
        >
      </section>
    </div>

    <SammlungModal v-model="sammlungOffen" />
  </form>
</template>
