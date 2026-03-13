<script lang="ts" setup>
const { t } = useI18n()

const faqItems = computed(() => [
  {
    label: t('about.modes.faq1.question'),
    content: t('about.modes.faq1.answer')
  },
  {
    label: t('about.modes.faq2.question'),
    content: t('about.modes.faq2.answer')
  },
  {
    label: t('about.modes.faq3.question'),
    content: t('about.modes.faq3.answer')
  }
])
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center gap-2 mb-1">
      <UIcon name="i-lucide-git-branch" class="text-primary size-5" />
      <h2 class="text-lg font-semibold">{{ t('about.modes.title') }}</h2>
    </div>
    <p class="text-sm text-muted">{{ t('about.modes.subtitle') }}</p>
    <p class="text-sm">{{ t('about.modes.intro') }}</p>
    <ul class="text-sm list-disc list-inside space-y-1 mb-4">
      <li>{{ t('about.modes.bullet1') }}</li>
      <li>{{ t('about.modes.bullet2') }}</li>
      <li>{{ t('about.modes.bullet3') }}</li>
      <li>{{ t('about.modes.bullet4') }}</li>
    </ul>
    <UAccordion :items="faqItems" />
  </section>
</template>
