<script lang="ts" setup>
const { t } = useI18n()

const faqItems = computed(() => [
  {
    label: t('about.orgs.faq1.question'),
    content: t('about.orgs.faq1.answer')
  },
  {
    label: t('about.orgs.faq2.question'),
    content: t('about.orgs.faq2.answer')
  },
  {
    label: t('about.orgs.faq3.question'),
    content: t('about.orgs.faq3.answer')
  }
])
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center gap-2 mb-1">
      <UIcon name="i-lucide-building" class="text-primary size-5" />
      <h2 class="text-lg font-semibold">{{ t('about.orgs.title') }}</h2>
    </div>
    <p class="text-xs text-dimmed">{{ t('about.orgs.subtitle') }}</p>
    <p class="text-sm">{{ t('about.orgs.intro') }}</p>
    <ul class="text-sm list-disc list-inside space-y-1 mb-4">
      <li>{{ t('about.orgs.bullet1') }}</li>
      <li>{{ t('about.orgs.bullet2') }}</li>
      <li>{{ t('about.orgs.bullet3') }}</li>
      <li>{{ t('about.orgs.bullet4') }}</li>
      <li>{{ t('about.orgs.bullet5') }}</li>
    </ul>
    <UAccordion :items="faqItems" />
  </section>
</template>
