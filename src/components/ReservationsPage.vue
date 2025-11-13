<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useWindowSize } from '@vueuse/core'
import { supabase } from '@/utils/supabase.js'
import { VueFinalModal, ModalsContainer } from 'vue-final-modal'
import HeaderBar from './HeaderBar.vue'

const { width } = useWindowSize()
const router = useRouter()

// Reactive state
const session = ref(null)
const reservations = ref([])
const inventory = ref([])
const loading = ref(true)

const itemId = ref(null)
const fromDate = ref('')
const toDate = ref('')
const quantity = ref(1)
const newToDate = ref('')
const showModal = ref(false)

// --- Session Management ---
const getSession = async () => {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  return data?.session
}

const ensureSession = async () => {
  session.value = await getSession()
  if (!session.value?.user) {
    console.warn('No active session, redirecting to login')
    await router.push('/login')
  }
}

// --- Inventory ---
async function fetchInventory() {
  const { data, error } = await supabase.from('inventory').select('*')
  if (error) {
    console.error('Error fetching inventory:', error)
    return []
  }
  return data
}

// --- Reservations ---
async function fetchReservations() {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .order('from', { ascending: true })
    .eq('user_id', session.value.user.id)

  if (error) {
    console.error('Error fetching reservations:', error)
    return []
  }
  return data
}

// --- Actions ---
async function cancelReservation(reservationId) {
  const { error } = await supabase.from('reservations').delete().eq('id', reservationId)

  if (error) {
    console.error('Error cancelling reservation:', error)
    alert('Failed to cancel reservation: ' + error.message)
  } else {
    await loadItems()
    showModal.value = false
    // Reset form
    itemId.value = null
    fromDate.value = ''
    toDate.value = ''
    quantity.value = 1
  }
}

async function extendReservation(reservationId, newTo) {
  if (!newTo) {
    alert('Please select a new end date.')
    return
  }

  const { error } = await supabase
    .from('reservations')
    .update({ to: new Date(newTo).toISOString() })
    .eq('id', reservationId)

  if (error) {
    console.error('Error extending reservation:', error)
    alert('Failed to extend reservation: ' + error.message)
  } else {
    await loadItems()
  }
}

async function createReservation(itemId, from, to, quantity = 1) {
  const inventoryData = inventory.value
  const item = inventoryData.find((item) => item.id === Number(itemId))
  if (!item) {
    alert('Item not found in inventory.')
    return
  }

  const overlapping = reservations.value.filter(
    (reservation) =>
      reservation.item_id === itemId &&
      new Date(from) < new Date(reservation.to) &&
      new Date(to) > new Date(reservation.from),
  )

  for (let date = new Date(from); date <= new Date(to); date.setDate(date.getDate() + 1)) {
    const reservedForDay = overlapping.filter(
      (res) => new Date(res.from) <= date && new Date(res.to) >= date,
    )
    const totalReserved = reservedForDay.reduce((sum, r) => sum + r.quantity, 0)

    if (totalReserved + quantity > item.quantity_available) {
      alert(`Not enough quantity available for item ${item.name} on ${date.toLocaleDateString()}.`)
      return
    }
  }

  const { error } = await supabase.from('reservations').insert({
    item_id: itemId,
    from: new Date(from).toISOString(),
    to: new Date(to).toISOString(),
    quantity: quantity,
    user_id: session.value.user.id,
  })

  if (error) {
    console.error('Error creating reservation:', error)
    alert('Failed to create reservation: ' + error.message)
  } else {
    await loadItems()
  }
}

const maxQuantity = computed(() => {
  const item = inventory.value.find((i) => i.id === Number(itemId.value))
  return item?.quantity_available || 1
})

watch(quantity, (val) => {
  if (val > maxQuantity.value) {
    quantity.value = maxQuantity.value
  }
})

// --- Load items and session ---
async function loadItems() {
  loading.value = true

  if (!session.value || !session.value.user) {
    console.warn('User not authenticated; redirecting...')
    await router.push('/login')
    return
  }

  ;[reservations.value, inventory.value] = await Promise.all([
    fetchReservations(),
    fetchInventory(),
  ])

  loading.value = false
}

onMounted(async () => {
  await ensureSession()
  if (session.value?.user) {
    await loadItems()
  }
})

supabase.auth.onAuthStateChange((_, newSession) => {
  session.value = newSession
  if (newSession?.user) {
    loadItems()
  }
})
</script>
<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-800 dark:text-gray-200">
    <HeaderBar title="Pfadi Pro Patria Material" />

    <div class="px-3 mt-3">
      <div class="flex justify-between items-center mb-3">
        <p class="text-xl font-bold dark:text-white">Reservierungen</p>
        <div class="flex gap-2">
          <button
            @click="showModal = true"
            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-200 dark:bg-green-700 dark:hover:bg-green-600"
            type="button"
          >
            Neue Reservierung
          </button>
          <button
            @click="router.back()"
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200 dark:bg-blue-700 dark:hover:bg-blue-600"
            type="button"
          >
            Zurück
          </button>
        </div>
      </div>
      <div v-if="loading" class="text-center">Loading...</div>
      <div v-else>
        <!-- Reservation Table -->
        <table class="w-full bg-white dark:bg-gray-700 rounded-lg shadow-md">
          <thead>
            <tr>
              <th
                :class="width > 680 ? 'px-6 py-3' : 'px-2 py-3'"
                class="border-b text-left text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                Item
              </th>
              <th
                v-if="width > 740"
                class="px-6 py-3 border-b text-left text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                Beginn
              </th>
              <th
                v-if="width > 740"
                class="px-6 py-3 border-b text-left text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                Ende
              </th>
              <th
                v-else
                class="px-6 py-3 border-b text-left text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                Dauer
              </th>
              <th
                class="px-4 py-3 border-b text-left text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 w-1"
              >
                Qty
              </th>
              <th
                :class="width > 680 ? 'px-6' : 'px-2'"
                class="py-3 border-b text-right text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="reservation in reservations" :key="reservation.id">
              <td
                :class="width > 560 ? 'px-6 py-4' : 'px-2 py-4'"
                class="border-b dark:border-gray-600"
              >
                {{
                  inventory.find((item) => item.id === reservation.item_id)?.name || 'Unknown Item'
                }}
              </td>

              <td v-if="width > 740" class="px-6 py-4 border-b dark:border-gray-600">
                {{ new Date(reservation.from).toLocaleDateString() }}
              </td>
              <td v-if="width > 740" class="px-6 py-4 border-b dark:border-gray-600">
                {{ new Date(reservation.to).toLocaleDateString() }}
              </td>
              <td v-else class="px-6 py-4 border-b dark:border-gray-600">
                {{ new Date(reservation.from).toLocaleDateString() }} -
                {{ new Date(reservation.to).toLocaleDateString() }}
              </td>

              <td class="px-4 py-4 border-b text-left dark:border-gray-600">
                {{ reservation.quantity }}
              </td>

              <td
                :class="width > 680 ? 'px-6' : 'px-2'"
                class="py-4 border-b text-right dark:border-gray-600"
              >
                <button
                  @click="cancelReservation(reservation.id)"
                  class="text-red-500 hover:underline"
                >
                  Cancel
                </button>

                <template v-if="width > 560">
                  <button
                    @click="extendReservation(reservation.id, newToDate)"
                    class="text-blue-500 hover:underline ml-2"
                  >
                    Extend
                  </button>
                  <input
                    v-model="newToDate"
                    type="date"
                    class="ml-2 px-2 py-1 border rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
                    placeholder="New To Date"
                  />
                </template>
              </td>
            </tr>
          </tbody>

          <tfoot>
            <tr>
              <td
                colspan="6"
                class="px-6 py-4 border-t bg-gray-50 text-center dark:border-gray-600 dark:bg-gray-600 rounded-b-lg"
              >
                <button @click="loadItems" class="text-blue-500 hover:underline">Refresh</button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Modal for Reservation Form -->
    <VueFinalModal
      v-model="showModal"
      class="flex justify-center items-center"
      content-class="max-w-md w-full mx-4"
      overlay-transition="vfm-fade"
      content-transition="vfm-fade"
    >
      <div class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-xl">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold dark:text-gray-300">Neue Reservierung erstellen</h2>
          <button
            @click="showModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
            type="button"
          >
            &times;
          </button>
        </div>

        <form
          @submit.prevent="createReservation(itemId, fromDate, toDate, quantity)"
          class="space-y-4"
        >
          <div>
            <label for="itemId" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Item</label
            >
            <select
              v-model="itemId"
              id="itemId"
              required
              class="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
            >
              <option value="" disabled selected>Wähle Material aus</option>
              <option v-for="item in inventory" :key="item.id" :value="item.id">
                {{ item.name }} ({{ item.quantity_available }} available)
              </option>
            </select>
          </div>

          <div>
            <label for="fromDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Von</label
            >
            <input
              v-model="fromDate"
              type="date"
              id="fromDate"
              required
              class="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
            />
          </div>

          <div>
            <label for="toDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Bis</label
            >
            <input
              v-model="toDate"
              type="date"
              id="toDate"
              required
              class="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
            />
          </div>

          <div>
            <label for="quantity" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Anzahl</label
            >
            <input
              v-model.number="quantity"
              type="number"
              id="quantity"
              min="1"
              :max="maxQuantity"
              required
              class="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
            />
          </div>

          <div class="flex gap-2 pt-2">
            <button
              type="submit"
              class="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              Reservierung erstellen
            </button>
            <button
              type="button"
              @click="showModal = false"
              class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition duration-200 dark:border-gray-500 dark:hover:bg-gray-600"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </VueFinalModal>

    <ModalsContainer />
  </div>
</template>
