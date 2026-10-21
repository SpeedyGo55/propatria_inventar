<script setup>
import { ref } from 'vue'
import { supabase } from '@/utils/supabase.js'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'
import { profilNameSetzen } from '@/api/mitglieder'

const s = useSessionStore()
const toast = useToast()
const router = useRouter()
const password = ref('')
const email = ref('')
const name = ref('')

const changePassword = async () => {
  try {
    const { error } = await supabase.auth.updateUser({ password: password.value })
    if (error) throw error
    toast.ok('Password updated successfully!')
    password.value = ''
  } catch (error) {
    toast.fehler('Error updating password: ' + error.message)
  }
}

const changeEmail = async () => {
  try {
    const { error } = await supabase.auth.updateUser({ email: email.value })
    await profilNameSetzen(s.user.id, name.value)
    await s.laden()
    if (error) throw error
    toast.ok('Email update initiated! Please check your new email for confirmation.')
    email.value = ''
  } catch (error) {
    toast.fehler('Error updating email: ' + error.message)
  }
}

const changeName = async () => {
  try {
    const { error } = await supabase.auth.updateUser({
      data: { name: name.value },
    })
    if (error) throw error
    toast.ok('Name updated successfully!')
    name.value = ''
  } catch (error) {
    toast.fehler('Error updating name: ' + error.message)
  }
}
</script>

<template>
  <!-- profile settings page for changing password, email etc -->
  <div class="min-h-screen bg-gray-100 dark:bg-gray-800 dark:text-gray-200">
    <div class="px-3 mt-3">
      <div class="flex justify-between items-center mb-3">
        <p class="text-xl font-bold dark:text-white">Profile Settings</p>
        <button
          @click="router.back()"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          Zurück
        </button>
      </div>
    </div>

    <div class="max-w-md mx-auto">
      <p class="text-lg font-bold dark:text-white">Change Password</p>
      <form @submit.prevent="changePassword">
        <input
          type="password"
          v-model="password"
          placeholder="New Password"
          class="border border-gray-300 rounded px-3 py-2 w-full mb-3"
        />
        <button
          type="submit"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          Change Password
        </button>
      </form>
      <p class="text-lg font-bold dark:text-white">Change Email</p>
      <form @submit.prevent="changeEmail">
        <input
          type="email"
          v-model="email"
          placeholder="New Email"
          class="border border-gray-300 rounded px-3 py-2 w-full mb-3"
        />
        <button
          type="submit"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          Change Email
        </button>
      </form>
      <p class="text-lg font-bold dark:text-white">Change Name</p>
      <form @submit.prevent="changeName">
        <input
          type="text"
          v-model="name"
          placeholder="New Name"
          class="border border-gray-300 rounded px-3 py-2 w-full mb-3"
        />
        <button
          type="submit"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          Change Name
        </button>
      </form>
      <button
        type="button"
        @click="abmelden"
        class="mt-3 bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 transition duration-200 dark:bg-red-800 dark:hover:bg-red-900"
      >
        Logout
      </button>
    </div>
  </div>
</template>
