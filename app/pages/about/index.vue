<script lang="ts" setup>
const { t } = useI18n()
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center gap-2 mb-1">
      <UIcon name="i-lucide-layout-panel-top" class="text-primary size-5" />
      <h2 class="text-lg font-semibold">{{ t('about.overview.title') }}</h2>
    </div>
    <p class="text-sm text-muted">{{ t('about.overview.subtitle') }}</p>
    <p class="text-sm">{{ t('about.overview.intro') }}</p>
    <ul class="text-sm list-disc list-inside space-y-1">
      <li>{{ t('about.overview.bullet1') }}</li>
      <li>{{ t('about.overview.bullet2') }}</li>
      <li>{{ t('about.overview.bullet3') }}</li>
      <li>{{ t('about.overview.bullet4') }}</li>
      <li>{{ t('about.overview.bullet5') }}</li>
    </ul>
  </section>
</template>
