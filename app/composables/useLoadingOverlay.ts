import { useLoadingIndicator } from '#app/composables/loading-indicator'

export function useLoadingOverlay() {
  const loading = useLoadingIndicator()

  async function withOverlay<T>(fn: () => Promise<T>): Promise<T> {
    loading.start()
    try {
      return await fn()
    } finally {
      loading.finish()
    }
  }

  return { withOverlay }
}
