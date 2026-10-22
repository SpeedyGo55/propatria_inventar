import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'

export const useCartStore = defineStore('cart', () => {
  const items = useLocalStorage('warenkorb-items', []) // [{ material_id, name, anzahl }]
  const von = useLocalStorage('warenkorb-von', null) // ISO-String
  const bis = useLocalStorage('warenkorb-bis', null)
  const stufeId = ref(null)
  const anlassId = ref(null)
  const freitext = ref('')
  const kommentar = ref('')

  const anzahl = computed(() => items.value.reduce((s, i) => s + i.anzahl, 0))
  const zeitraumGesetzt = computed(() => !!von.value && !!bis.value && von.value < bis.value)

  function hinzufuegen(material, n = 1) {
    const it = items.value.find((i) => i.material_id === material.id)
    if (it) it.anzahl += n
    else items.value.push({ material_id: material.id, name: material.name, anzahl: n })
  }

  function setzen(materialId, n) {
    if (n <= 0) return entfernen(materialId)
    const it = items.value.find((i) => i.material_id === materialId)
    if (it) it.anzahl = n
  }

  function entfernen(materialId) {
    items.value = items.value.filter((i) => i.material_id !== materialId)
  }

  function leeren() {
    items.value = []
    stufeId.value = null
    anlassId.value = null
    freitext.value = ''
    kommentar.value = ''
  }

  return {
    items,
    von,
    bis,
    stufeId,
    anlassId,
    freitext,
    kommentar,
    anzahl,
    zeitraumGesetzt,
    hinzufuegen,
    setzen,
    entfernen,
    leeren,
  }
})
