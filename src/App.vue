<script setup>
import { useRoute } from 'vue-router'
import { ModalsContainer } from 'vue-final-modal'
import { useSessionStore } from '@/stores/session'
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import ToastHost from '@/components/base/ToastHost.vue'
import OfflineBanner from '@/components/layout/OfflineBanner.vue'
import { useOnline } from '@vueuse/core'
import { SignalSlashIcon } from '@heroicons/vue/24/outline'
import { RouterLink } from 'vue-router'

const online = useOnline()
const route = useRoute()
const s = useSessionStore()
</script>

<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-800 dark:text-gray-200">
    <OfflineBanner />
    <AppHeader v-if="s.user && route.name !== 'login'" />
    <main class="mx-auto max-w-6xl px-3 py-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-4">
        <main class="mx-auto max-w-6xl px-3 py-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-4">
          <div v-if="!online && !route.meta.offline && !route.meta.public" class="py-16 text-center text-gray-500">
            <SignalSlashIcon class="mx-auto mb-3 size-10" />
            <p>Diese Seite braucht eine Internetverbindung.</p>
            <RouterLink :to="{ name: 'material' }" class="mt-2 inline-block text-blue-600 hover:underline">
              Zur Materialliste (offline verfügbar)
            </RouterLink>
          </div>
          <RouterView v-else />
        </main>
    </main>
    <BottomNav v-if="s.user && route.name !== 'login'" class="md:hidden" />
    <ToastHost />
    <ModalsContainer />
  </div>
</template>
