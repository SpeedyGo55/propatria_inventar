<script setup>
import { useRoute } from 'vue-router'
import { ModalsContainer } from 'vue-final-modal'
import { useSessionStore } from '@/stores/session'
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import ToastHost from '@/components/base/ToastHost.vue'

const route = useRoute()
const s = useSessionStore()
</script>

<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-800 dark:text-gray-200">
    <AppHeader v-if="s.user && route.name !== 'login'" />
    <main class="mx-auto max-w-6xl px-3 py-4 pb-20 md:pb-4">
      <RouterView />
    </main>
    <BottomNav v-if="s.user && route.name !== 'login'" class="md:hidden" />
    <ToastHost />
    <ModalsContainer />
  </div>
</template>
