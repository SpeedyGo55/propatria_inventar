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
    {
      name: 'bestellungen',
      label: 'Bestellungen',
      icon: ClipboardDocumentListIcon,
      rolle: 'member',
    },
    { name: 'matchef', label: 'Matchef', icon: WrenchScrewdriverIcon, rolle: 'matchef' },
    { name: 'profil', label: 'Profil', icon: UserCircleIcon, rolle: null },
  ].filter((i) => !i.rolle || s.hasRole(i.rolle)),
)
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <ul class="grid" :style="{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }">
      <li v-for="i in items" :key="i.name" class="min-w-0">
        <RouterLink
          :to="{ name: i.name }"
          class="flex flex-col items-center gap-0.5 px-1 py-2 text-[11px] leading-tight text-gray-500 dark:text-gray-300"
          active-class="!text-blue-600 dark:!text-blue-400"
        >
          <component :is="i.icon" class="size-6 shrink-0" />
          <span class="block w-full truncate text-center">{{ i.label }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
