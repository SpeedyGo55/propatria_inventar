<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'
import { profilNameSetzen, icalToken, icalTokenErneuern } from '@/api/mitglieder'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { RouterLink } from 'vue-router'
import { ChevronRightIcon } from '@heroicons/vue/24/outline'
import MfaEinstellungen from '@/components/profil/MfaEinstellungen.vue'

const ROLLEN_TEXT = {
  pending: 'wartet',
  guest: 'Gast',
  member: 'Member',
  matchef: 'Matchef',
  admin: 'Admin',
}
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


const token = ref(null)
onMounted(async () => {
  const { data } = await icalToken()
  token.value = data?.token ?? null
})
const aboUrl = computed(() =>
  token.value ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ical?token=${token.value}` : '',
)
const webcalUrl = computed(() => aboUrl.value.replace(/^https?:/, 'webcal:'))

async function aboKopieren() {
  await navigator.clipboard.writeText(aboUrl.value)
  toast.ok('Link kopiert')
}

async function aboErneuern() {
  if (!confirm('Neuen Link erzeugen? Der alte funktioniert danach nicht mehr.')) return
  const { data, error } = await icalTokenErneuern(s.user.id)
  if (error) return toast.fehler(error.message)
  token.value = data.token
  toast.ok('Neuer Link erstellt – im Kalender neu abonnieren')
}

async function abmelden() {
  await s.logout()
  router.replace({ name: 'login' })
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

    <section class="space-y-1">
      <h2 class="text-lg font-semibold">Abteilung</h2>
      <p v-for="m in s.memberships" :key="m.abteilung.id" class="text-sm">
        {{ m.abteilung.name }} · <strong>{{ ROLLEN_TEXT[m.role] }}</strong>
      </p>
    </section>

    <nav
      class="divide-y divide-gray-200 rounded-lg bg-white shadow-sm dark:divide-gray-600 dark:bg-gray-700"
    >
      <RouterLink :to="{ name: 'kalender' }" class="flex items-center justify-between px-4 py-3">
        Kalender <ChevronRightIcon class="size-5 text-gray-400" />
      </RouterLink>
      <template v-if="s.hasRole('matchef')">
        <RouterLink :to="{ name: 'schaeden' }" class="flex items-center justify-between px-4 py-3">
          Schäden <ChevronRightIcon class="size-5 text-gray-400" />
        </RouterLink>
        <RouterLink
          :to="{ name: 'stammdaten' }"
          class="flex items-center justify-between px-4 py-3"
        >
          Verwaltung (Kategorien, Standorte, Stufen &amp; Anlässe)
          <ChevronRightIcon class="size-5 text-gray-400" />
        </RouterLink>
        <RouterLink
          :to="{ name: 'sammlungen' }"
          class="flex items-center justify-between px-4 py-3"
        >
          Sammlungen <ChevronRightIcon class="size-5 text-gray-400" />
        </RouterLink>
        <RouterLink :to="{ name: 'statistik' }" class="flex items-center justify-between px-4 py-3">
          Statistik <ChevronRightIcon class="size-5 text-gray-400" />
        </RouterLink>
      </template>
      <RouterLink
        v-if="s.hasRole('admin')"
        :to="{ name: 'mitglieder' }"
        class="flex items-center justify-between px-4 py-3"
      >
        Mitglieder <ChevronRightIcon class="size-5 text-gray-400" />
      </RouterLink>
      <RouterLink :to="{ name: 'datenschutz' }" class="flex items-center justify-between px-4 py-3">
        Datenschutz <ChevronRightIcon class="size-5 text-gray-400" />
      </RouterLink>
    </nav>

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

    <MfaEinstellungen />

    <section v-if="s.hasRole('member') && aboUrl" class="space-y-2">
      <h2 class="text-lg font-semibold">Kalender abonnieren</h2>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Deine Bestellungen (als Matchef: alle) erscheinen automatisch in deinem Kalender.
        Google Kalender: „Weitere Kalender → Per URL“. Apple/iPhone: Link unten antippen.
      </p>
      <div class="flex gap-2">
        <input
          :value="aboUrl"
          readonly
          class="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-xs dark:border-gray-500 dark:bg-gray-600"
          @focus="$event.target.select()"
        />
        <BaseButton variant="secondary" @click="aboKopieren">Kopieren</BaseButton>
      </div>
      <div class="flex flex-wrap gap-3 text-sm">
        <a :href="webcalUrl" class="text-blue-600 hover:underline">In Apple Kalender öffnen</a>
        <button type="button" class="text-gray-500 hover:underline" @click="aboErneuern">Link erneuern</button>
      </div>
    </section>

    <BaseButton variant="danger" @click="abmelden">Logout</BaseButton>
  </div>
</template>
