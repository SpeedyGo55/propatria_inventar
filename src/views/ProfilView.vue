<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'
import { profilNameSetzen } from '@/api/mitglieder'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const s = useSessionStore()
const toast = useToast()
const router = useRouter()

const password = ref('')
const email = ref('')
const name = ref(s.profile?.display_name ?? '')
const laedt = ref('') // 'passwort' | 'email' | 'name' | ''

async function changePassword() {
  laedt.value = 'passwort'
  try {
    const { error } = await supabase.auth.updateUser({ password: password.value })
    if (error) throw error
    toast.ok('Passwort geändert.')
    password.value = ''
  } catch (error) {
    toast.fehler('Passwort ändern fehlgeschlagen: ' + error.message)
  } finally {
    laedt.value = ''
  }
}

async function changeEmail() {
  laedt.value = 'email'
  try {
    const { error } = await supabase.auth.updateUser({ email: email.value })
    if (error) throw error
    toast.ok('Bestätigungslink an die neue E-Mail gesendet.')
    email.value = ''
  } catch (error) {
    toast.fehler('E-Mail ändern fehlgeschlagen: ' + error.message)
  } finally {
    laedt.value = ''
  }
}

async function changeName() {
  laedt.value = 'name'
  try {
    const { error } = await supabase.auth.updateUser({ data: { name: name.value } })
    if (error) throw error
    const res = await profilNameSetzen(s.user.id, name.value)
    if (res.error) throw res.error
    await s.laden()
    toast.ok('Name geändert.')
  } catch (error) {
    toast.fehler('Name ändern fehlgeschlagen: ' + error.message)
  } finally {
    laedt.value = ''
  }
}

async function abmelden() {
  await s.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-8">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold dark:text-white">Profil</h1>
      <BaseButton variant="secondary" @click="router.back()">Zurück</BaseButton>
    </div>

    <p class="text-sm text-gray-600 dark:text-gray-300">
      Eingeloggt als <strong>{{ s.profile?.display_name }}</strong> ({{ s.user?.email }})
    </p>

    <form class="space-y-3" @submit.prevent="changeName">
      <h2 class="text-lg font-semibold">Name</h2>
      <BaseInput v-model="name" label="Anzeigename" required />
      <BaseButton type="submit" :loading="laedt === 'name'">Name speichern</BaseButton>
    </form>

    <form class="space-y-3" @submit.prevent="changeEmail">
      <h2 class="text-lg font-semibold">E-Mail</h2>
      <BaseInput v-model="email" label="Neue E-Mail" type="email" autocomplete="email" required />
      <BaseButton type="submit" :loading="laedt === 'email'">E-Mail ändern</BaseButton>
    </form>

    <form class="space-y-3" @submit.prevent="changePassword">
      <h2 class="text-lg font-semibold">Passwort</h2>
      <BaseInput
        v-model="password"
        label="Neues Passwort"
        type="password"
        autocomplete="new-password"
        minlength="6"
        required
      />
      <BaseButton type="submit" :loading="laedt === 'passwort'">Passwort ändern</BaseButton>
    </form>

    <BaseButton variant="danger" @click="abmelden">Logout</BaseButton>
  </div>
</template>
