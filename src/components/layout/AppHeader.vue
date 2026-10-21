<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ShoppingCartIcon, UserCircleIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/vue/24/outline'
import { useSessionStore } from '@/stores/session'
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()

const s = useSessionStore()
const router = useRouter()

const links = computed(() =>
  [
    { name: 'material', label: 'Material', rolle: 'guest' },
    { name: 'bestellungen', label: 'Bestellungen', rolle: 'member' },
    { name: 'matchef', label: 'Matchef', rolle: 'matchef' },
    { name: 'stammdaten', label: 'Verwaltung', rolle: 'matchef' },
    { name: 'mitglieder', label: 'Mitglieder', rolle: 'admin' },
  ].filter((l) => s.hasRole(l.rolle)),
)

async function abmelden() {
  await s.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="bg-blue-600 px-4 py-3 text-white dark:bg-blue-800">
    <div class="mx-auto flex max-w-6xl items-center gap-4">
      <RouterLink :to="{ name: 'material' }" class="flex items-center gap-2 text-lg font-bold">
        <img v-if="s.abteilung?.logo_url" :src="s.abteilung.logo_url" alt="" class="size-8 rounded" />
        <span class="truncate">{{ s.abteilung?.name ?? 'Pfadi Pro Patria Material' }}</span>
      </RouterLink>

      <select
        v-if="s.memberships.length > 1"
        v-model="s.abteilungId"
        class="rounded bg-blue-700 px-2 py-1 text-sm dark:bg-blue-900"
      >
        <option v-for="m in s.memberships" :key="m.abteilung.id" :value="m.abteilung.id">
          {{ m.abteilung.name }}
        </option>
      </select>

      <nav class="ml-auto hidden items-center gap-4 md:flex">
        <RouterLink
          v-for="l in links"
          :key="l.name"
          :to="{ name: l.name }"
          class="hover:text-blue-200"
          active-class="underline underline-offset-4"
        >
          {{ l.label }}
        </RouterLink>
      </nav>

      <div class="ml-auto flex items-center gap-3 md:ml-0">
        <RouterLink v-if="s.hasRole('member')" :to="{ name: 'warenkorb' }" class="relative hover:text-blue-200">
          <ShoppingCartIcon class="size-6" />
          <span
            v-if="cart.anzahl"
            class="absolute -right-2 -top-2 min-w-5 rounded-full bg-red-500 px-1 text-center text-xs font-bold"
          >
            {{ cart.anzahl }}
          </span>
          <span class="sr-only">Warenkorb</span>
        </RouterLink>
        <RouterLink :to="{ name: 'profil' }" class="hover:text-blue-200" :title="s.profile?.display_name">
          <UserCircleIcon class="size-6" />
          <span class="sr-only">Profil</span>
        </RouterLink>
        <button type="button" class="hover:text-blue-200" @click="abmelden">
          <ArrowRightStartOnRectangleIcon class="size-6" />
          <span class="sr-only">Logout</span>
        </button>
      </div>
    </div>
  </header>
</template>
