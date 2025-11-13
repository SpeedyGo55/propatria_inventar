<script setup>
import { ref } from 'vue'
import { supabase } from '@/utils/supabase.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const session = ref(null)
const loading = ref(true)

supabase.auth.getSession().then(({ data }) => {
  session.value = data.session
  loading.value = false
})
supabase.auth.onAuthStateChange((_, _session) => {
  session.value = _session
  loading.value = false
})

defineProps({
  title: {
    type: String,
    default: 'Pfadi Pro Patria Material',
  },
})
</script>

<template>
  <div class="bg-blue-600 dark:bg-blue-800 py-4 px-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-white">{{ title }}</h1>
      <div v-if="!loading">
        <div v-if="session" class="text-sm text-blue-100 dark:text-blue-200">
          <span>Eingeloggt als: {{ session.user.email }}</span>
          <button
            @click="supabase.auth.signOut()"
            class="ml-2 text-white hover:text-blue-200 dark:hover:text-blue-300 font-medium"
          >
            Logout
          </button>
        </div>
        <button
          v-else
          @click="router.push({ name: 'login' })"
          class="bg-white text-blue-600 px-4 py-1 rounded hover:bg-blue-50 transition duration-200 font-medium"
        >
          Login
        </button>
      </div>
      <div v-else class="w-20 h-8"></div>
    </div>
  </div>
</template>
