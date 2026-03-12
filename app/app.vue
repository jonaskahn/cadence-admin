<script lang="ts" setup>
const colorMode = useColorMode()
const { fullTitle } = useAppBranding()
const { locale, t } = useI18n()

const color = computed(() => (colorMode.value === 'dark' ? '#1b1718' : 'white'))

const title = computed(() => fullTitle)
const description = computed(() => t('app.description'))

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: locale
  }
})

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <AppVersionFooter />
  </UApp>
</template>
