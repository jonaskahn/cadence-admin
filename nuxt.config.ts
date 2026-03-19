// https://nuxt.com/docs/api/configuration/nuxt-config
// NUXT_PUBLIC_APP_VERSION and NUXT_PUBLIC_GIT_HASH are written to .env
// before dev/build by the predev / prebuild npm hooks (scripts/write-version.mjs).
// They can also be set manually or injected by CI at runtime.

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@vueuse/nuxt', '@nuxtjs/mdc', '@nuxtjs/i18n', '@formkit/auto-animate/nuxt', 'motion-v/nuxt'],

  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],

  devtools: {
    enabled: true,
    componentInspector: false
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    backendUrl: process.env.NUXT_BACKEND_URL || 'http://localhost:8888',
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Cadence',
      appTagline: process.env.NUXT_PUBLIC_APP_TAGLINE || 'AI Orchestration Platform',
      appVersion: process.env.NUXT_PUBLIC_APP_VERSION || 'dev',
      gitHash: process.env.NUXT_PUBLIC_GIT_HASH || '',
      copyright: process.env.NUXT_PUBLIC_APP_COPYRIGHT || '© {year}'
    }
  },

  compatibilityDate: '2024-07-11',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  i18n: {
    locales: [
      { code: 'en-us', language: 'en-US', file: 'en-us.json', dir: 'ltr', name: 'English' },
      { code: 'de', language: 'de', file: 'de.json', dir: 'ltr', name: 'Deutsch' },
      { code: 'vi-VN', language: 'vi-VN', file: 'vi-VN.json', dir: 'ltr', name: 'Tiếng Việt' }
    ],
    defaultLocale: 'en-us',
    langDir: 'locales',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: false
    }
  }
})
