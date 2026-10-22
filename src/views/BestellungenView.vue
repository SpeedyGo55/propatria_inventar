<script setup>
import { computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useAsync } from '@/composables/useAsync'
import { meine } from '@/api/bestellungen'
import { istAktiv } from '@/utils/bestellung'
import BestellungKarte from '@/components/bestellung/BestellungKarte.vue'

const s = useSessionStore()
const { data, loading, run } = useAsync(() => meine(s.user.id))
watch(
  () => s.user?.id,
  (id) => id && run().catch(() => {}),
  { immediate: true },
)

const aktuell = computed(() =>
  (data.value ?? []).filter(istAktiv).sort((a, b) => a.von.localeCompare(b.von)),
)
const vergangen = computed(() => (data.value ?? []).filter((b) => !istAktiv(b)))
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold dark:text-white">Meine Bestellungen</h1>
    <p v-if="loading" class="text-gray-500">Lädt …</p>

    <template v-else>
      <section class="space-y-2">
        <h2 class="font-semibold">Aktuell &amp; kommend</h2>
        <p v-if="!aktuell.length" class="text-gray-500">
          Keine offenen Bestellungen.
          <RouterLink :to="{ name: 'material' }" class="text-blue-600 hover:underline"
            >Material ansehen</RouterLink
          >
        </p>
        <BestellungKarte v-for="b in aktuell" :key="b.id" :bestellung="b" />
      </section>

      <details v-if="vergangen.length" class="space-y-2">
        <summary class="cursor-pointer font-semibold">Vergangen ({{ vergangen.length }})</summary>
        <div class="mt-2 space-y-2">
          <BestellungKarte v-for="b in vergangen" :key="b.id" :bestellung="b" />
        </div>
      </details>
    </template>
  </div>
</template>
