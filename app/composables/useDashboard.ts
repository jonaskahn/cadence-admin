import { createSharedComposable } from '@vueuse/core'

/**
 * Dashboard composable. Registers global keyboard shortcuts for navigation.
 */
const _useDashboard = () => {
  const router = useRouter()

  defineShortcuts({
    'g-d': () => router.push('/dashboard'),
    'g-o': () => router.push('/orchestrators'),
    'g-c': () => router.push('/chat'),
    'g-s': () => router.push('/settings')
  })
}

export const useDashboard = createSharedComposable(_useDashboard)
