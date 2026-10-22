<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useCartStore } from '@/stores/cart'
import { useToast } from '@/composables/useToast'
import * as api from '@/api/bestellungen'
import { aktionenFuer, historieText } from '@/utils/status'
import { zuordnung, istAktiv, istUeberfaellig } from '@/utils/bestellung'
import { datum, datumZeit, alsDatumInput, tagEnde } from '@/utils/format'
import StatusBadge from '@/components/base/StatusBadge.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'

const props = defineProps({ id: { type: String, required: true } })

const s = useSessionStore()
const cart = useCartStore()
const toast = useToast()
const router = useRouter()

const b = ref(null)
const laedt = ref(true)
const arbeitet = ref(false)
const matchefKommentar = ref('')
const neuesBis = ref('')
const kommentar = ref('')

async function laden() {
  const { data, error } = await api.detail(Number(props.id))
  laedt.value = false
  if (error) {
    toast.fehler('Bestellung nicht gefunden')
    return router.replace({ name: 'bestellungen' })
  }
  b.value = data
  matchefKommentar.value = data.matchef_kommentar ?? ''
  neuesBis.value = alsDatumInput(data.bis)
}
watch(() => props.id, laden, { immediate: true })

const istMatchef = computed(() => s.hasRole('matchef'))
const istBesteller = computed(() => b.value?.besteller?.id === s.user?.id)
const bearbeitbar = computed(() => ['pending', 'created'].includes(b.value?.status))
const historie = computed(() =>
  [...(b.value?.historie ?? [])].sort((x, y) => x.created_at.localeCompare(y.created_at)),
)

// Aktion ausführen → Fehler anzeigen → neu laden. Gibt true bei Erfolg zurück.
async function ausfuehren(fn, erfolg) {
  arbeitet.value = true
  const { error } = await fn()
  arbeitet.value = false
  if (error) {
    toast.fehler(error.message)
    return false
  }
  if (erfolg) toast.ok(erfolg)
  await laden()
  return true
}

// --- Matchef: Status ---
const allesGeruestet = computed(() => b.value?.items.every((i) => i.prepared))
const allesKontrolliert = computed(() => b.value?.items.every((i) => i.controlled))
const aktionen = computed(() => {
  if (!b.value || !istMatchef.value) return []
  return aktionenFuer(b.value.status).map((a) => ({
    ...a,
    gesperrt:
      (a.nach === 'delivered' && !allesGeruestet.value) ||
      (a.nach === 'completed' && !allesKontrolliert.value),
  }))
})

const ablehnenOffen = ref(false)
const grund = ref('')

function statusKlick(a) {
  if (a.nach === 'rejected') {
    grund.value = ''
    ablehnenOffen.value = true
    return
  }
  ausfuehren(() => api.statusSetzen(b.value.id, a.nach), a.label)
}

function ablehnen() {
  ablehnenOffen.value = false
  ausfuehren(() => api.ablehnen(b.value.id, grund.value.trim()), 'Abgelehnt')
}

// --- Matchef: Positionen ---
function haken(item, feld) {
  ausfuehren(() => api.itemSetzen(b.value.id, item.material.id, { [feld]: !item[feld] }))
}

function anzahlAendern(item, n) {
  if (n <= 0) {
    if (!confirm(`${item.material.name} aus der Bestellung entfernen?`)) return
    return ausfuehren(() => api.itemEntfernen(b.value.id, item.material.id))
  }
  ausfuehren(() => api.itemSetzen(b.value.id, item.material.id, { anzahl: n }))
}

function kommentarSpeichern() {
  ausfuehren(
    () => api.aendern(b.value.id, { matchef_kommentar: matchefKommentar.value.trim() || null }),
    'Gespeichert',
  )
}

// --- Besteller ---
function stornieren() {
  if (!confirm('Bestellung wirklich stornieren?')) return
  ausfuehren(() => api.stornieren(b.value.id), 'Storniert')
}

function verlaengern() {
  ausfuehren(() => api.verlaengern(b.value.id, tagEnde(neuesBis.value)), 'Enddatum geändert')
}

function nochmals() {
  for (const i of b.value.items) cart.hinzufuegen(i.material, i.anzahl)
  cart.stufeId = b.value.stufe?.id ?? null
  cart.anlassId = b.value.anlass?.id ?? null
  cart.freitext = b.value.gruppe_freitext ?? ''
  cart.von = null
  cart.bis = null
  router.push({ name: 'warenkorb' })
}

// --- Kommentar (alle, die die Bestellung sehen) ---
async function kommentieren() {
  const text = kommentar.value.trim()
  if (!text) return
  if (await ausfuehren(() => api.kommentieren(b.value.id, text))) kommentar.value = ''
}
</script>

<template>
  <p v-if="laedt" class="text-gray-500">Lädt …</p>

  <div v-else-if="b" class="mx-auto max-w-3xl space-y-4">
    <div class="flex items-center justify-between gap-2">
      <BaseButton variant="secondary" @click="router.back()">Zurück</BaseButton>
      <StatusBadge :status="b.status" />
    </div>

    <!-- Kopf -->
    <section class="space-y-1 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
      <h1 class="text-xl font-bold">{{ zuordnung(b) }}</h1>
      <p class="text-gray-600 dark:text-gray-300">
        {{ datum(b.von) }} – {{ datum(b.bis) }}
        <span v-if="istUeberfaellig(b)" class="ml-1 font-medium text-red-600">überfällig</span>
      </p>
      <p v-if="b.besteller" class="text-sm text-gray-500 dark:text-gray-400">
        Bestellt von {{ b.besteller.display_name
        }}<template v-if="istMatchef"> ({{ b.besteller.email }})</template> am
        {{ datumZeit(b.created_at) }}
      </p>
      <p v-if="b.kommentar" class="whitespace-pre-line pt-2">{{ b.kommentar }}</p>
      <p v-if="b.ablehnungsgrund" class="rounded bg-red-50 p-2 text-red-800">
        Abgelehnt: {{ b.ablehnungsgrund }}
      </p>
      <p v-if="b.matchef_kommentar && !istMatchef" class="rounded bg-blue-50 p-2 text-blue-900">
        Matchef: {{ b.matchef_kommentar }}
      </p>
    </section>

    <!-- Positionen -->
    <section class="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
      <h2 class="mb-2 font-semibold">Material</h2>
      <ul class="divide-y divide-gray-200 dark:divide-gray-600">
        <li
          v-for="i in b.items"
          :key="i.material.id"
          class="flex flex-wrap items-center gap-3 py-2"
        >
          <img
            v-if="i.material.image_urls?.[0]"
            :src="i.material.image_urls[0]"
            alt=""
            class="size-10 rounded object-cover"
          />
          <span class="min-w-32 flex-1">{{ i.anzahl }}× {{ i.material.name }}</span>

          <template v-if="istMatchef">
            <div v-if="bearbeitbar" class="flex items-center gap-1">
              <button
                type="button"
                class="rounded border border-gray-300 px-2 dark:border-gray-500"
                :disabled="arbeitet"
                @click="anzahlAendern(i, i.anzahl - 1)"
              >
                −
              </button>
              <button
                type="button"
                class="rounded border border-gray-300 px-2 dark:border-gray-500"
                :disabled="arbeitet"
                @click="anzahlAendern(i, i.anzahl + 1)"
              >
                +
              </button>
            </div>
            <label class="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                class="size-4"
                :checked="i.prepared"
                :disabled="arbeitet || !bearbeitbar"
                @change="haken(i, 'prepared')"
              />
              gerüstet
            </label>
            <label class="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                class="size-4"
                :checked="i.controlled"
                :disabled="arbeitet || b.status !== 'delivered'"
                @change="haken(i, 'controlled')"
              />
              kontrolliert
            </label>
          </template>
        </li>
      </ul>
    </section>

    <!-- Matchef -->
    <section v-if="istMatchef" class="space-y-3 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
      <h2 class="font-semibold">Matchef</h2>
      <div class="flex flex-wrap gap-2">
        <BaseButton
          v-for="a in aktionen"
          :key="a.nach"
          :variant="a.variant"
          :disabled="a.gesperrt || arbeitet"
          @click="statusKlick(a)"
        >
          {{ a.label }}
        </BaseButton>
      </div>
      <p v-if="aktionen.some((a) => a.gesperrt)" class="text-sm text-gray-500">
        „Ausgeben“ geht erst, wenn alles gerüstet ist, „Rücknahme abschliessen“ erst, wenn alles
        kontrolliert ist.
      </p>
      <div>
        <label for="mk" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >Kommentar für den Besteller</label
        >
        <textarea
          id="mk"
          v-model="matchefKommentar"
          rows="2"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-500 dark:bg-gray-600"
        />
        <BaseButton
          variant="secondary"
          class="mt-2"
          :disabled="arbeitet"
          @click="kommentarSpeichern"
          >Speichern</BaseButton
        >
      </div>
    </section>

    <!-- Besteller / Enddatum -->
    <section
      v-if="(istBesteller || istMatchef) && istAktiv(b)"
      class="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700"
    >
      <h2 class="mb-2 font-semibold">Enddatum ändern</h2>
      <div class="flex flex-wrap items-end gap-2">
        <BaseInput
          v-model="neuesBis"
          type="date"
          label="Neues Enddatum"
          :min="alsDatumInput(b.von)"
        />
        <BaseButton variant="secondary" :disabled="arbeitet || !neuesBis" @click="verlaengern"
          >Ändern</BaseButton
        >
      </div>
    </section>

    <div v-if="istBesteller" class="flex flex-wrap gap-2">
      <BaseButton v-if="bearbeitbar" variant="danger" :disabled="arbeitet" @click="stornieren"
        >Stornieren</BaseButton
      >
      <BaseButton variant="secondary" @click="nochmals">Nochmals bestellen</BaseButton>
    </div>

    <!-- Verlauf -->
    <section class="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
      <h2 class="mb-2 font-semibold">Verlauf</h2>
      <ol class="space-y-2 border-l-2 border-gray-200 pl-4 dark:border-gray-600">
        <li v-for="h in historie" :key="h.id">
          <p class="text-sm">
            <span class="font-medium">{{ historieText(h.typ) }}</span> ·
            {{ datumZeit(h.created_at) }}
            <template v-if="h.user"> · {{ h.user.display_name }}</template>
          </p>
          <p v-if="h.text" class="whitespace-pre-line text-sm text-gray-600 dark:text-gray-300">
            {{ h.text }}
          </p>
        </li>
      </ol>
      <form class="mt-3 flex gap-2" @submit.prevent="kommentieren">
        <input
          v-model="kommentar"
          placeholder="Kommentar schreiben …"
          class="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 dark:border-gray-500 dark:bg-gray-600"
        />
        <BaseButton type="submit" :disabled="arbeitet || !kommentar.trim()">Senden</BaseButton>
      </form>
    </section>

    <BaseModal v-model="ablehnenOffen" titel="Bestellung ablehnen">
      <BaseInput v-model="grund" label="Grund (sieht der Besteller)" required />
      <template #footer>
        <BaseButton variant="secondary" @click="ablehnenOffen = false">Abbrechen</BaseButton>
        <BaseButton variant="danger" :disabled="!grund.trim()" @click="ablehnen"
          >Ablehnen</BaseButton
        >
      </template>
    </BaseModal>
  </div>
</template>
