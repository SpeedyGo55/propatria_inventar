<script setup>
import { ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'
import { codeNoetig, codePruefen } from '@/api/mfa'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const s = useSessionStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const email = ref('')
const password = ref('')
const code = ref('')
const loading = ref(false)
const mfaSchritt = ref(route.query.mfa === '1')

function weiter() {
  if (route.query.beitreten) {
    return router.replace({ name: 'warten', query: { beitreten: route.query.beitreten } })
  }
  router.replace(String(route.query.redirect ?? '/'))
}

if (s.user && !mfaSchritt.value) weiter() // schon eingeloggt (ohne offenen Code-Schritt)

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
  if (await codeNoetig()) {
    loading.value = false
    mfaSchritt.value = true
    return
  }
  await s.laden() // Mitgliedschaften laden, BEVOR der Guard prüft
  loading.value = false
  weiter()
}

async function mfaBestaetigen() {
  loading.value = true
  try {
    await codePruefen(code.value)
    await s.laden()
    weiter()
  } catch (e) {
    toast.fehler(e.message)
  } finally {
    loading.value = false
  }
}

async function mfaAbbrechen() {
  await s.logout()
  mfaSchritt.value = false
  code.value = ''
  router.replace({ name: 'login' })
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

    <!-- Schritt 2: Code aus der Authenticator-App -->
    <form
      v-if="mfaSchritt"
      class="space-y-4 rounded-lg bg-white p-6 shadow-md dark:bg-gray-700"
      @submit.prevent="mfaBestaetigen"
    >
      <p class="text-sm">Gib den 6-stelligen Code aus deiner Authenticator-App ein.</p>
      <BaseInput
        v-model="code"
        label="Code"
        inputmode="numeric"
        autocomplete="one-time-code"
        pattern="[0-9]{6}"
        maxlength="6"
        required
        autofocus
      />
      <BaseButton type="submit" class="w-full" :loading="loading">Bestätigen</BaseButton>
      <button type="button" class="w-full text-sm text-gray-500 hover:underline" @click="mfaAbbrechen">
        Abbrechen
      </button>
    </form>

    <!-- Schritt 1: E-Mail + Passwort -->
    <form
      v-else
      class="space-y-4 rounded-lg bg-white p-6 shadow-md dark:bg-gray-700"
      @submit.prevent="login"
    >
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
        <button
          type="button"
          class="text-blue-600 hover:underline dark:text-blue-400"
          @click="passwortVergessen"
        >
          Passwort vergessen?
        </button>
      </div>
    </form>

    <p class="mt-4 text-center text-sm">
      <RouterLink :to="{ name: 'datenschutz' }" class="text-gray-500 hover:underline">Datenschutz</RouterLink>
    </p>
  </div>
</template>
