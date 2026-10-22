<script setup>
import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import StammdatenTabelle from '@/components/admin/StammdatenTabelle.vue'

const TABS = [
  {
    key: 'kategorien',
    titel: 'Kategorien',
    felder: [{ key: 'name', label: 'Name', pflicht: true }],
    loeschHinweis: 'Das Material bleibt erhalten, verliert aber diese Kategorie.',
  },
  {
    key: 'standorte',
    titel: 'Standorte',
    felder: [
      { key: 'name', label: 'Name', pflicht: true },
      { key: 'adresse', label: 'Adresse' },
      { key: 'notiz', label: 'Notiz' },
    ],
    loeschHinweis: 'Material an diesem Standort hat danach keinen Standort mehr.',
  },
  {
    key: 'gruppen',
    titel: 'Stufen & Anlässe',
    felder: [
      { key: 'name', label: 'Name', pflicht: true },
      {
        key: 'typ',
        label: 'Typ',
        typ: 'select',
        standard: 'anlass',
        optionen: [
          { value: 'stufe', label: 'Stufe' },
          { value: 'anlass', label: 'Anlass' },
          { value: 'sonstiges', label: 'Sonstiges' },
        ],
      },
      { key: 'aktiv', label: 'Aktiv', typ: 'checkbox', standard: true },
    ],
    loeschHinweis: 'Tipp: Statt löschen besser „Aktiv“ ausschalten – alte Bestellungen behalten dann ihre Stufe/ihren Anlass.',
  },
]

const tabKey = useLocalStorage('stammdaten-tab', 'kategorien')
const tab = computed(() => TABS.find((t) => t.key === tabKey.value) ?? TABS[0])
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold dark:text-white">Verwaltung</h1>

    <nav class="flex gap-1 overflow-x-auto border-b border-gray-300 dark:border-gray-600">
      <button
        v-for="t in TABS"
        :key="t.key"
        type="button"
        :class="t.key === tab.key ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500'"
        class="whitespace-nowrap border-b-2 px-4 py-2 font-medium"
        @click="tabKey = t.key"
      >
        {{ t.titel }}
      </button>
    </nav>

    <!-- :key sorgt dafür, dass die Tabelle beim Tab-Wechsel neu lädt -->
    <StammdatenTabelle :key="tab.key" :tabelle="tab.key" :felder="tab.felder" :loesch-hinweis="tab.loeschHinweis" />
  </div>
</template>
