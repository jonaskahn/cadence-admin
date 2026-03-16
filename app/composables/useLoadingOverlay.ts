const MIN_DISPLAY_MS = 1500

export function useLoadingOverlay() {
  const $loading = inject<{ show: (opts?: object) => { hide: () => void } }>('$loading')
  if (!$loading) throw new Error('Loading overlay plugin not registered')

  async function withOverlay<T>(fn: () => Promise<T>): Promise<T> {
    const loader = $loading.show({
      canCancel: false,
      loader: 'bars',
      opacity: 0.75,
      color: 'var(--color-primary-500, #000)'
    })
    const start = Date.now()
    try {
      return await fn()
    } finally {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed)
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining))
      }
      loader.hide()
    }
  }
  return { withOverlay }
}
