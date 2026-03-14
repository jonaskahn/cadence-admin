<script lang="ts" setup>
const { t } = useI18n()

const faqItems = computed(() => [
  {
    label: t('about.chat.faq1.question'),
    content: t('about.chat.faq1.answer')
  },
  {
    label: t('about.chat.faq2.question'),
    content: t('about.chat.faq2.answer')
  },
  {
    label: t('about.chat.faq3.question'),
    content: t('about.chat.faq3.answer')
  }
])
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center gap-2 mb-1">
      <UIcon name="i-lucide-message-square" class="text-primary size-5" />
      <h2 class="text-lg font-semibold">{{ t('about.chat.title') }}</h2>
    </div>
    <p class="text-xs text-dimmed">{{ t('about.chat.subtitle') }}</p>
    <p class="text-sm">{{ t('about.chat.intro') }}</p>
    <ul class="text-sm list-disc list-inside space-y-1 mb-4">
      <li>{{ t('about.chat.bullet1') }}</li>
      <li>{{ t('about.chat.bullet2') }}</li>
      <li>{{ t('about.chat.bullet3') }}</li>
      <li>{{ t('about.chat.bullet4') }}</li>
      <li>{{ t('about.chat.bullet5') }}</li>
    </ul>
    <UAccordion :items="faqItems" />
  </section>
</template>
