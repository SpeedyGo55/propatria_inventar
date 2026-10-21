import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { verfuegbarkeit } from '@/api/material'
import { useSessionStore } from '@/stores/session'
import { useCartStore } from '@/stores/cart'

// Liefert eine Map material_id → freie Stückzahl im Warenkorb-Zeitraum.
// Ohne Zeitraum ist die Map leer.
export function useVerfuegbarkeit() {
  const s = useSessionStore()
  const cart = useCartStore()
  const frei = ref(new Map())
  const laedt = ref(false)

  const laden = useDebounceFn(async () => {
    if (!s.abteilungId || !cart.zeitraumGesetzt) {
      frei.value = new Map()
      return
    }
    laedt.value = true
    const { data, error } = await verfuegbarkeit(s.abteilungId, cart.von, cart.bis)
    laedt.value = false
    if (error) return
    frei.value = new Map(data.map((r) => [r.material_id, r.verfuegbar]))
  }, 300)

  watch(() => [s.abteilungId, cart.von, cart.bis], laden, { immediate: true })
  return { frei, laedt, neuLaden: laden }
}
