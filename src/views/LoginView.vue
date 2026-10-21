<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const s = useSessionStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)

function weiter() {
  if (route.query.beitreten) {
    return router.replace({ name: 'warten', query: { beitreten: route.query.beitreten } })
  }
  router.replace(String(route.query.redirect ?? '/'))
}

if (s.user) weiter() // schon eingeloggt

async function login() {
  loading.value = true
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })
  if (error) {
    loading.value = false
    return toast.fehler('Login fehlgeschlagen: ' + error.message)
  }
  s.session = data.session
  await s.laden() // Mitgliedschaften laden, BEVOR der Guard prüft
  loading.value = false
  weiter()
}

async function passwortVergessen() {
  if (!email.value) return toast.info('Bitte zuerst deine E-Mail eingeben.')
  const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: `${location.origin}/profil`,
  })
  if (error) return toast.fehler(error.message)
  toast.ok('Link zum Zurücksetzen wurde gesendet.')
}
</script>

<template>
  <div class="mx-auto mt-10 max-w-md">
    <h1 class="mb-4 text-center text-2xl font-bold dark:text-white">Pfadi Pro Patria Material</h1>

    <form class="space-y-4 rounded-lg bg-white p-6 shadow-md dark:bg-gray-700" @submit.prevent="login">
      <BaseInput v-model="email" label="E-Mail" type="email" autocomplete="email" required />
      <BaseInput
        v-model="password"
        label="Passwort"
        type="password"
        autocomplete="current-password"
        required
      />
      <BaseButton type="submit" class="w-full" :loading="loading">Login</BaseButton>

      <div class="text-sm">
        <button type="button" class="text-blue-600 hover:underline dark:text-blue-400" @click="passwortVergessen">
          Passwort vergessen?
        </button>
      </div>
    </form>
  </div>
</template>
