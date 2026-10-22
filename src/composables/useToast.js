import { ref } from 'vue'
const toasts = ref([])
export function useToast() {
  function push(text, typ = 'info') {
    const id = crypto.randomUUID()
    toasts.value.push({ id, text, typ })
    setTimeout(() => (toasts.value = toasts.value.filter((t) => t.id !== id)), 4000)
  }
  return {
    toasts,
    info: (t) => push(t),
    ok: (t) => push(t, 'ok'),
    // Offline sind Fehler fast immer Netzwerkfehler → das Banner reicht
    fehler: (t) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return
      push(t, 'fehler')
    },
  }
}
