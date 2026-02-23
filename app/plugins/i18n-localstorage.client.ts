const STORAGE_KEY = 'i18n_locale'

const LOCALE_CODES = ['en-us', 'de', 'vi-VN']

export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n as { locale: { value: string }; setLocale: (locale: string) => void }

  function isValidLocale(code: string): boolean {
    return LOCALE_CODES.includes(code)
  }

  function getStoredLocale(): string | null {
    if (import.meta.server) return null
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored && isValidLocale(stored) ? stored : null
    } catch {
      return null
    }
  }

  function storeLocale(code: string) {
    if (import.meta.server) return
    try {
      localStorage.setItem(STORAGE_KEY, code)
    } catch {
      /* ignore */
    }
  }

  // Restore locale from localStorage on init (with no_prefix, setLocale just sets locale without navigation)
  const stored = getStoredLocale()
  if (stored && stored !== i18n.locale.value) {
    i18n.setLocale(stored)
  }

  // Persist locale to localStorage whenever it changes
  nuxtApp.hook('i18n:localeSwitched', ({ newLocale }: { newLocale: string }) => {
    storeLocale(newLocale)
  })
  storeLocale(i18n.locale.value)
})
