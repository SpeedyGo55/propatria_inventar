<script setup>
import { supabase } from '@/utils/supabase.js'

import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const session = ref(null)
supabase.auth.getSession().then(({ data }) => {
  session.value = data.session
  if (session.value) {
    // User is already logged in, redirect to homepage
    router.push('/')
  }
})
supabase.auth.onAuthStateChange((_, _session) => {
  session.value = _session
})

async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  })

  if (error) {
    console.error('Login error:', error)
    alert('Login failed: ' + error.message)
  } else {
    // redirect to homepage
    router.push('/')

  }

  return data
}

</script>

<template>
  <div class="min-h-screen bg-gray-100 p-6 dark:bg-gray-800 dark:text-gray-200">
    <h1 class="text-2xl font-bold mb-4 text-center dark:text-white">Login</h1>
    <form @submit.prevent="signInWithEmail(email, password)" class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md dark:bg-gray-700">
      <div class="mb-4">
        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
        <input v-model="email" type="email" id="email" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200">
      </div>
      <div class="mb-4">
        <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
        <input v-model="password" type="password" id="password" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200">
      </div>
      <button type="submit" class="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200 dark:bg-blue-700 dark:hover:bg-blue-600">Login</button>
    </form>
  </div>
</template>
