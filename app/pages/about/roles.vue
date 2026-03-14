<script lang="ts" setup>
const { t } = useI18n()

const faqItems = computed(() => [
  {
    label: t('about.roles.faq1.question'),
    content: t('about.roles.faq1.answer')
  },
  {
    label: t('about.roles.faq2.question'),
    content: t('about.roles.faq2.answer')
  },
  {
    label: t('about.roles.faq3.question'),
    content: t('about.roles.faq3.answer')
  }
])
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center gap-2 mb-1">
      <UIcon name="i-lucide-shield-check" class="text-primary size-5" />
      <h2 class="text-lg font-semibold">{{ t('about.roles.title') }}</h2>
    </div>
    <p class="text-xs text-dimmed">{{ t('about.roles.subtitle') }}</p>
    <p class="text-sm">{{ t('about.roles.intro') }}</p>
    <ul class="text-sm list-disc list-inside space-y-1 mb-4">
      <li>{{ t('about.roles.bullet1') }}</li>
      <li>{{ t('about.roles.bullet2') }}</li>
      <li>{{ t('about.roles.bullet3') }}</li>
      <li>{{ t('about.roles.bullet4') }}</li>
      <li>{{ t('about.roles.bullet5') }}</li>
    </ul>
    <UAccordion :items="faqItems" />
  </section>
</template>
