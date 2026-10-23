<script setup>
import { ref, watch } from 'vue'
import imageCompression from 'browser-image-compression'
import { CameraIcon } from '@heroicons/vue/24/outline'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'
import { melden, fotoHochladen } from '@/api/schaeden'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const offen = defineModel({ type: Boolean, default: false })
const props = defineProps({
  material: { type: Object, default: null }, // { id, name }
  bestellungId: { type: Number, default: null },
})
const emit = defineEmits(['gemeldet'])

const s = useSessionStore()
const toast = useToast()

const typ = ref('damaged')
const anzahl = ref(1)
const beschreibung = ref('')
const foto = ref(null)
const vorschau = ref(null)
const sendet = ref(false)

// Beim Öffnen zurücksetzen
watch(offen, (o) => {
  if (!o) return
  typ.value = 'damaged'
  anzahl.value = 1
  beschreibung.value = ''
  foto.value = null
  vorschau.value = null
})

async function fotoGewaehlt(ev) {
  const datei = ev.target.files[0]
  if (!datei) return
  foto.value = await imageCompression(datei, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
  })
  vorschau.value = URL.createObjectURL(foto.value)
}

async function senden() {
  sendet.value = true
  try {
    const fotoPath = foto.value ? await fotoHochladen(s.abteilungId, foto.value) : null
    const { error } = await melden({
      materialId: props.material.id,
      bestellungId: props.bestellungId,
      typ: typ.value,
      anzahl: anzahl.value,
      beschreibung: beschreibung.value.trim() || null,
      fotoPath,
    })
    if (error) throw error
    toast.ok('Schaden gemeldet – danke!')
    offen.value = false
    emit('gemeldet')
  } catch (e) {
    toast.fehler(e.code === '23514' ? 'Mehr gemeldet als vorhanden.' : e.message)
  } finally {
    sendet.value = false
  }
}
</script>

<template>
  <BaseModal v-model="offen" :titel="`Schaden melden: ${material?.name ?? ''}`">
    <form id="schaden-form" class="space-y-3" @submit.prevent="senden">
      <fieldset class="flex gap-4">
        <legend class="sr-only">Art</legend>
        <label class="flex items-center gap-2"
          ><input v-model="typ" type="radio" value="damaged" /> Beschädigt</label
        >
        <label class="flex items-center gap-2"
          ><input v-model="typ" type="radio" value="lost" /> Verloren</label
        >
      </fieldset>

      <BaseInput v-model.number="anzahl" label="Anzahl" type="number" min="1" required />

      <div>
        <label for="schaden-text" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >Was ist passiert?</label
        >
        <textarea
          id="schaden-text"
          v-model="beschreibung"
          rows="3"
          placeholder="z.B. Stange gebrochen, Blache hat Loch"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-500 dark:bg-gray-600"
        />
      </div>

      <label
        class="flex cursor-pointer items-center gap-3 rounded border-2 border-dashed border-gray-300 p-3 hover:border-blue-500 dark:border-gray-500"
      >
        <img v-if="vorschau" :src="vorschau" alt="" class="size-16 rounded object-cover" />
        <CameraIcon v-else class="size-8 text-gray-400" />
        <span class="text-sm">{{
          vorschau ? 'Anderes Foto wählen' : 'Foto aufnehmen (optional)'
        }}</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          class="sr-only"
          @change="fotoGewaehlt"
        />
      </label>
    </form>

    <template #footer>
      <BaseButton variant="secondary" @click="offen = false">Abbrechen</BaseButton>
      <BaseButton type="submit" form="schaden-form" variant="danger" :loading="sendet"
        >Melden</BaseButton
      >
    </template>
  </BaseModal>
</template>
