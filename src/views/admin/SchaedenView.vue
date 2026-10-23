<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'
import { liste as ladeListe, statusSetzen, fotoLinks } from '@/api/schaeden'
import { SCHADEN_TYP, SCHADEN_STATUS, SCHADEN_AKTIONEN } from '@/utils/schaden'
import { datumZeit } from '@/utils/format'
import BaseButton from '@/components/base/BaseButton.vue'

const s = useSessionStore()
const toast = useToast()
const meldungen = ref([])
const fotos = ref(new Map())
const laedt = ref(true)
const arbeitet = ref(false)

async function laden() {
  if (!s.abteilungId) return
  const { data, error } = await ladeListe(s.abteilungId)
  laedt.value = false
  if (error) return toast.fehler(error.message)
  meldungen.value = data
  fotos.value = await fotoLinks(data.map((m) => m.foto_path).filter(Boolean))
}
watch(() => s.abteilungId, laden, { immediate: true })

const tab = useLocalStorage('schaeden-tab', 'offen')
const offene = computed(() =>
  meldungen.value.filter((m) => ['offen', 'in_reparatur'].includes(m.status)),
)
const erledigte = computed(() =>
  meldungen.value.filter((m) => ['erledigt', 'abgeschrieben'].includes(m.status)),
)
const angezeigt = computed(() => (tab.value === 'offen' ? offene.value : erledigte.value))

async function aktion(m, a) {
  if (
    a.nach === 'abgeschrieben' &&
    !confirm(`${m.anzahl}× ${m.material.name} abschreiben? Der Bestand wird dauerhaft reduziert.`)
  )
    return
  arbeitet.value = true
  const { error } = await statusSetzen(m.id, a.nach)
  arbeitet.value = false
  if (error) return toast.fehler(error.message)
  toast.ok(SCHADEN_STATUS[a.nach].label)
  laden()
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold dark:text-white">Schäden</h1>

    <nav class="flex gap-1 border-b border-gray-300 dark:border-gray-600">
      <button
        v-for="t in [
          { key: 'offen', titel: 'Offen', n: offene.length },
          { key: 'erledigt', titel: 'Erledigt', n: erledigte.length },
        ]"
        :key="t.key"
        type="button"
        :class="
          t.key === tab
            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-gray-500'
        "
        class="flex items-center gap-1 border-b-2 px-4 py-2 font-medium"
        @click="tab = t.key"
      >
        {{ t.titel }}
        <span
          v-if="t.n"
          class="rounded-full bg-gray-200 px-1.5 text-xs text-gray-700 dark:bg-gray-600 dark:text-gray-200"
          >{{ t.n }}</span
        >
      </button>
    </nav>

    <p v-if="laedt" class="text-gray-500">Lädt …</p>
    <p v-else-if="!angezeigt.length" class="py-10 text-center text-gray-500">
      {{ tab === 'offen' ? 'Keine offenen Schäden 🎉' : 'Noch nichts erledigt.' }}
    </p>

    <div v-else class="grid gap-3 md:grid-cols-2">
      <article
        v-for="m in angezeigt"
        :key="m.id"
        class="flex gap-3 rounded-lg bg-white p-3 shadow-sm dark:bg-gray-700"
      >
        <a
          v-if="fotos.get(m.foto_path)"
          :href="fotos.get(m.foto_path)"
          target="_blank"
          rel="noopener"
          class="shrink-0"
        >
          <img
            :src="fotos.get(m.foto_path)"
            alt="Foto vom Schaden"
            class="size-20 rounded object-cover"
          />
        </a>
        <div class="min-w-0 flex-1 space-y-1">
          <div class="flex items-start justify-between gap-2">
            <p class="font-semibold">{{ m.anzahl }}× {{ m.material.name }}</p>
            <span
              :class="SCHADEN_STATUS[m.status].farbe"
              class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
            >
              {{ SCHADEN_STATUS[m.status].label }}
            </span>
          </div>
          <p class="text-sm">
            {{ SCHADEN_TYP[m.typ]
            }}<template v-if="m.beschreibung">: {{ m.beschreibung }}</template>
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ m.gemeldet?.display_name ?? 'Unbekannt' }} · {{ datumZeit(m.created_at) }}
            <template v-if="m.bestellung_id">
              ·
              <RouterLink
                :to="{ name: 'bestellung', params: { id: m.bestellung_id } }"
                class="text-blue-600 hover:underline"
              >
                Bestellung
              </RouterLink>
            </template>
          </p>
          <p v-if="m.bearbeiter && m.erledigt_at" class="text-xs text-gray-500">
            {{ SCHADEN_STATUS[m.status].label }} von {{ m.bearbeiter.display_name }} ·
            {{ datumZeit(m.erledigt_at) }}
          </p>
          <div v-if="SCHADEN_AKTIONEN[m.status]" class="flex flex-wrap gap-2 pt-1">
            <BaseButton
              v-for="a in SCHADEN_AKTIONEN[m.status]"
              :key="a.nach"
              :variant="a.variant"
              :disabled="arbeitet"
              class="!px-3 !py-1 text-sm"
              @click="aktion(m, a)"
            >
              {{ a.label }}
            </BaseButton>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
