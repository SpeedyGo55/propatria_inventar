<script setup>
import { onMounted, ref } from 'vue'
import { ShieldCheckIcon } from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'
import { faktoren, einrichtenStarten, codePruefen, entfernen } from '@/api/mfa'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'

const toast = useToast()
const aktiv = ref([]) // bestätigte Faktoren
const neu = ref(null) // { factorId, qr, secret } während der Einrichtung
const code = ref('')
const laedt = ref(false)

async function laden() {
  aktiv.value = await faktoren().catch(() => [])
}
onMounted(laden)

async function starten() {
  laedt.value = true
  try {
    neu.value = await einrichtenStarten()
  } catch (e) {
    toast.fehler(e.message)
  } finally {
    laedt.value = false
  }
}

async function bestaetigen() {
  laedt.value = true
  try {
    await codePruefen(code.value, neu.value.factorId)
    toast.ok('Zwei-Faktor-Anmeldung aktiviert')
    neu.value = null
    code.value = ''
    await laden()
  } catch (e) {
    toast.fehler(e.message)
  } finally {
    laedt.value = false
  }
}

async function ausschalten(f) {
  if (!confirm('Zwei-Faktor-Anmeldung wirklich ausschalten?')) return
  try {
    await entfernen(f.id)
    toast.ok('Ausgeschaltet')
    await laden()
  } catch (e) {
    toast.fehler(e.message)
  }
}
</script>

<template>
  <section class="space-y-3">
    <h2 class="flex items-center gap-2 text-lg font-semibold">
      <ShieldCheckIcon class="size-5" /> Zwei-Faktor-Anmeldung
    </h2>

    <div
      v-if="aktiv.length"
      class="flex items-center justify-between gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-900 dark:bg-green-900/30 dark:text-green-100"
    >
      <span>Aktiv – beim Login wird ein Code aus deiner Authenticator-App verlangt.</span>
      <BaseButton variant="secondary" class="!px-3 !py-1 text-sm" @click="ausschalten(aktiv[0])">
        Ausschalten
      </BaseButton>
    </div>

    <template v-else-if="neu">
      <ol class="list-decimal space-y-1 pl-5 text-sm">
        <li>Authenticator-App öffnen (z.B. Aegis, Google Authenticator, 1Password).</li>
        <li>QR-Code scannen oder den Schlüssel von Hand eingeben.</li>
        <li>Den angezeigten 6-stelligen Code unten eingeben.</li>
      </ol>
      <img :src="neu.qr" alt="QR-Code für die Authenticator-App" class="size-48 rounded bg-white p-2" />
      <p class="break-all font-mono text-xs text-gray-600 dark:text-gray-300">{{ neu.secret }}</p>
      <form class="flex items-end gap-2" @submit.prevent="bestaetigen">
        <div class="flex-1">
          <BaseInput
            v-model="code"
            label="Code"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            required
          />
        </div>
        <BaseButton type="submit" :loading="laedt">Aktivieren</BaseButton>
      </form>
      <button type="button" class="text-sm text-gray-500 hover:underline" @click="neu = null">
        Abbrechen
      </button>
    </template>

    <template v-else>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Schützt dein Konto zusätzlich mit einem Code vom Handy. Für Matchefs und Admins empfohlen.
      </p>
      <BaseButton variant="secondary" :loading="laedt" @click="starten">Einrichten</BaseButton>
    </template>
  </section>
</template>
