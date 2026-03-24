import { PRIMARY_COLORS, NEUTRAL_COLORS } from '~/constants/theme'

const STORAGE_KEY = 'ca-theme'

interface StoredTheme {
  primary: string
  neutral: string
}

export function useThemeStorage() {
  const appConfig = useAppConfig()

  function hydrateTheme() {
    if (import.meta.server) return

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw) as StoredTheme
      if (parsed.primary && PRIMARY_COLORS.includes(parsed.primary as (typeof PRIMARY_COLORS)[number])) {
        appConfig.ui.colors.primary = parsed.primary
      }
      if (parsed.neutral && NEUTRAL_COLORS.includes(parsed.neutral as (typeof NEUTRAL_COLORS)[number])) {
        appConfig.ui.colors.neutral = parsed.neutral
      }
    } catch {
      // Ignore invalid stored data
    }
  }

  function persistTheme() {
    if (import.meta.server) return

    try {
      const theme: StoredTheme = {
        primary: appConfig.ui.colors.primary,
        neutral: appConfig.ui.colors.neutral
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
    } catch {
      // Ignore storage errors
    }
  }

  return { hydrateTheme, persistTheme }
}
