<script lang="ts" setup>
const { t } = useI18n()

const faqItems = computed(() => [
  {
    label: t('about.admin.faq1.question'),
    content: t('about.admin.faq1.answer')
  },
  {
    label: t('about.admin.faq2.question'),
    content: t('about.admin.faq2.answer')
  },
  {
    label: t('about.admin.faq3.question'),
    content: t('about.admin.faq3.answer')
  }
])
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center gap-2 mb-1">
      <UIcon name="i-lucide-sliders" class="text-primary size-5" />
      <h2 class="text-lg font-semibold">{{ t('about.admin.title') }}</h2>
    </div>
    <p class="text-sm text-muted">{{ t('about.admin.subtitle') }}</p>
    <p class="text-sm">{{ t('about.admin.intro') }}</p>
    <ul class="text-sm list-disc list-inside space-y-1 mb-4">
      <li>{{ t('about.admin.bullet1') }}</li>
      <li>{{ t('about.admin.bullet2') }}</li>
      <li>{{ t('about.admin.bullet3') }}</li>
      <li>{{ t('about.admin.bullet4') }}</li>
      <li>{{ t('about.admin.bullet5') }}</li>
    </ul>
    <UAccordion :items="faqItems" />
  </section>
</template>
