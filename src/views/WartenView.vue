<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { beitreten } from '@/api/mitglieder'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const s = useSessionStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const slug = ref(String(route.query.beitreten ?? 'pro-patria'))
const wartend = computed(() => s.memberships.filter((m) => m.role === 'pending'))
const { loading, run } = useAsync(() => beitreten(slug.value))

async function anfragen() {
  try {
    await run()
    await s.laden()
    toast.ok('Anfrage gesendet')
  } catch {
    /* Toast kommt aus useAsync */
  }
}

async function pruefen() {
  await s.laden()
  if (s.hasRole('guest')) router.replace({ name: 'material' })
  else toast.info('Noch nicht freigegeben')
}

onMounted(() => {
  if (route.query.beitreten && !s.memberships.length) anfragen()
})
</script>

<template>
  <div class="mx-auto mt-10 max-w-md space-y-4 rounded-lg bg-white p-6 shadow-md dark:bg-gray-700">
    <template v-if="wartend.length">
      <h1 class="text-xl font-bold">Wartet auf Freigabe</h1>
      <p v-for="m in wartend" :key="m.abteilung.id">
        Deine Anfrage bei <strong>{{ m.abteilung.name }}</strong> wird von einem Admin geprüft.
      </p>
      <BaseButton variant="secondary" @click="pruefen">Status prüfen</BaseButton>
    </template>

    <template v-else>
      <h1 class="text-xl font-bold">Abteilung beitreten</h1>
      <p class="text-sm text-gray-600 dark:text-gray-300">Du bist noch in keiner Abteilung.</p>
      <BaseInput v-model="slug" label="Abteilungs-Kürzel" />
      <BaseButton :loading="loading" @click="anfragen">Beitritt anfragen</BaseButton>
    </template>
  </div>
</template>
