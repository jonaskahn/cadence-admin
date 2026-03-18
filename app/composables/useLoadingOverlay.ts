const MIN_DISPLAY_MS = 1500

export function useLoadingOverlay() {
  const $loading = inject<{ show: (opts?: object) => { hide: () => void } } | null>('$loading', null)

  async function withOverlay<T>(fn: () => Promise<T>): Promise<T> {
    if (!$loading) {
      return fn()
    }
    const style = getComputedStyle(document.documentElement)
    const loader = $loading.show({
      canCancel: false,
      loader: 'bars',
      opacity: 0.75,
      color: style.getPropertyValue('--color-primary-500').trim() || '#000',
      backgroundColor: style.getPropertyValue('--ui-bg').trim() || '#fff'
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
