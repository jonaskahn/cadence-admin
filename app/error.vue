<script lang="ts" setup>
import type { NuxtError } from '#app'

defineProps<{
  error: NuxtError
}>()

const { t, locale } = useI18n()

useSeoMeta({
  title: () => t('errors.notFound'),
  description: () => t('errors.notFoundDescription')
})

useHead({
  htmlAttrs: {
    lang: locale
  }
})
</script>

<template>
  <UApp>
    <UError :error="error" />
  </UApp>
</template>
