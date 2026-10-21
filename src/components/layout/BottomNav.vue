<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Squares2X2Icon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  UserCircleIcon,
} from '@heroicons/vue/24/outline'
import { useSessionStore } from '@/stores/session'

const s = useSessionStore()

const items = computed(() =>
  [
    { name: 'material', label: 'Material', icon: Squares2X2Icon, rolle: 'guest' },
    { name: 'warenkorb', label: 'Warenkorb', icon: ShoppingCartIcon, rolle: 'member' },
    { name: 'bestellungen', label: 'Bestellungen', icon: ClipboardDocumentListIcon, rolle: 'member' },
    { name: 'matchef', label: 'Matchef', icon: WrenchScrewdriverIcon, rolle: 'matchef' },
    { name: 'profil', label: 'Profil', icon: UserCircleIcon, rolle: null },
  ].filter((i) => !i.rolle || s.hasRole(i.rolle)),
)
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700">
    <ul class="flex justify-around">
      <li v-for="i in items" :key="i.name">
        <RouterLink
          :to="{ name: i.name }"
          class="flex flex-col items-center px-3 py-2 text-xs text-gray-500 dark:text-gray-300"
          active-class="!text-blue-600 dark:!text-blue-400"
        >
          <component :is="i.icon" class="size-6" />
          {{ i.label }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
