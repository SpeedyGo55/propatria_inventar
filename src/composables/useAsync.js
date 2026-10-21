import { ref } from 'vue'
import { useToast } from './useToast'

export function useAsync(fn) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const toast = useToast()

  async function run(...args) {
    loading.value = true
    error.value = null
    try {
      const { data: d, error: e } = await fn(...args)
      if (e) throw e
      data.value = d
      return d
    } catch (e) {
      error.value = e
      toast.fehler(e.message)
      throw e
    } finally {
      loading.value = false
    }
  }
  return { data, loading, error, run }
}
