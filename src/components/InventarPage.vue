<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/utils/supabase.js'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { useWindowSize } from '@vueuse/core'
import { useRouter } from 'vue-router'
const router = useRouter()

const { width } = useWindowSize()

const inventory = ref([])
const reservations = ref([])
const loading = ref(true)
const session = ref(null)

supabase.auth.getSession().then(({ data }) => {
  session.value = data.session
})
supabase.auth.onAuthStateChange((_, _session) => {
  session.value = _session
})

async function fetchInventory() {
  const { data, error } = await supabase.from('inventory').select('*')

  if (error) {
    loading.value = false
    return
  }

  inventory.value = data
}

async function fetchReservations() {
  const { data, error } = await supabase.from('reservations').select('*').lt('from', new Date().toISOString()).gt('to', new Date().toISOString())
  if (error) {
    return
  }

  reservations.value = data
}

async function update() {
  loading.value = true
  await fetchInventory()
  loading.value = false
}

onMounted(() => {
  update()
}
)
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-6 dark:bg-gray-800 dark:text-gray-200">
    <h1 class="text-2xl font-bold mb-4 text-center dark:text-white">Pfadi Pro Patria Inventar</h1>
    <div class="flex justify-between items-center mb-4">
      <div class="text-lg font-semibold dark:text-gray-300">Inventar</div>
      <div v-if="session" class="text-sm text-gray-500 dark:text-gray-400">
        Eingeloggt als: {{ session.user.email }}
        <button
          @click="supabase.auth.signOut()"
          class="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Logout
        </button>
      </div>
      <button
        v-else
        @click="router.push({ name: 'login' })"
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200 dark:bg-blue-700 dark:hover:bg-blue-600"
      >
        Login
      </button>
    </div>
    <div v-if="loading" class="text-center text-gray-500 dark:text-gray-300">
      <p>Loading...</p>
    </div>
    <table
      v-else
      class="table-auto min-w-full bg-white shadow-md rounded-lg overflow-hidden dark:bg-gray-700"
    >
      <thead>
        <tr
          class="bg-gray-200 text-gray-600 uppercase text-sm leading-normal dark:bg-gray-600 dark:text-gray-200"
        >
          <th class="py-3 px-2 text-left w-1">Anz.</th>
          <th class="py-3 px-2 text-left w-1">Verfügbar</th>
          <th class="py-3 px-6 text-left">Name</th>
          <th v-if="width > 860" class="py-3 px-6 text-left">Ort</th>
          <th v-if="width > 1240" class="py-3 px-2 text-left">Foto</th>
          <th class="w-10">
            <button
              @click="update"
              class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition duration-200 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              <ArrowPathIcon class="size-5" />
            </button>
          </th>
        </tr>
      </thead>
      <tbody class="text-gray-600 text-sm font-light dark:text-gray-300">
        <tr
          v-for="item in inventory"
          :key="item.id"
          class="border-b border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 dark:border-gray-500"
        >
          <td class="py-3 px-2">{{ item.quantity }}</td>
          <td v-if="item.quantity_available" class="py-3 px-2">{{ item.quantity_available }}</td>
          <td v-else class="py-3 px-2 text-gray-400">{{ item.quantity }}</td>
          <td class="py-3 px-6">{{ item.name }}</td>
          <td v-if="width > 860" class="py-3 px-6">{{ item.location }}</td>
          <td v-if="width > 1240" class="py-3 px-6">
            <img
              v-if="item.photo_url"
              :src="item.photo_url"
              alt="Item Photo"
              class="w-10 h-10 object-cover rounded"
            />
            <span v-else class="text-gray-400">Kein Foto</span>
          </td>
          <td class="py-3 px-2 text-right w-10"></td>
        </tr>
      </tbody>
      <tfoot>
        <tr
          class="bg-gray-200 text-gray-600 uppercase text-sm leading-normal dark:bg-gray-600 dark:text-gray-200"
        >
          <td v-if="width >= 1240" colspan="5" class="py-3 px-6 text-center">
            Total Items: {{ inventory.length }}
          </td>
          <td v-if="width > 860 && width < 1240" colspan="4" class="py-3 px-6 text-center">
            Total Items: {{ inventory.length }}
          </td>
          <td v-if="width <= 860" colspan="3" class="py-3 px-6 text-center">
            Total Items: {{ inventory.length }}
          </td>
          <td class="py-3 px-2 text-right">
            <button
              @click="update"
              class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              <ArrowPathIcon class="size-5" />
            </button>
          </td>
        </tr>
      </tfoot>
    </table>
    <div v-if="inventory.length === 0 && !loading" class="text-center text-gray-500 mt-4">
      Keine Items im Inventar
    </div>
  </div>
</template>
