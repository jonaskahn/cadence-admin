<script lang="ts" setup>
const { t } = useI18n()

const isolatedResources = computed(() => [
  { key: 'llm_configs', desc: t('about.orgs.techSection.isolation.llmConfigs') },
  { key: 'plugins', desc: t('about.orgs.techSection.isolation.plugins') },
  { key: 'orchestrators', desc: t('about.orgs.techSection.isolation.orchestrators') },
  { key: 'central_points', desc: t('about.orgs.techSection.isolation.centralPoints') },
  { key: 'members', desc: t('about.orgs.techSection.isolation.members') }
])

const quotaFields = computed(() => [
  { key: 'max_orchestrators', desc: t('about.orgs.techSection.quotas.maxOrchestrators') },
  { key: 'max_central_points', desc: t('about.orgs.techSection.quotas.maxCentralPoints') },
  { key: 'max_plugins', desc: t('about.orgs.techSection.quotas.maxPlugins') },
  { key: 'max_members', desc: t('about.orgs.techSection.quotas.maxMembers') }
])

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
  <section class="space-y-8">
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

    <!-- Technical Reference -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-building-2" class="w-4 h-4 text-primary" />
        <h3 class="text-sm font-semibold">{{ t('about.orgs.techSection.title') }}</h3>
      </div>

      <!-- Isolated Resources -->
      <div>
        <p class="text-xs font-semibold text-dimmed uppercase tracking-wide mb-2">{{ t('about.orgs.techSection.isolation.title') }}</p>
        <div class="space-y-2">
          <div v-for="res in isolatedResources" :key="res.key" class="flex items-start gap-3">
            <code class="text-primary text-sm font-mono shrink-0">{{ res.key }}</code>
            <p class="text-xs text-dimmed">{{ res.desc }}</p>
          </div>
        </div>
      </div>

      <!-- Quota Fields -->
      <div>
        <p class="text-xs font-semibold text-dimmed uppercase tracking-wide mb-2">{{ t('about.orgs.techSection.quotas.title') }}</p>
        <div class="space-y-2">
          <div v-for="field in quotaFields" :key="field.key" class="flex items-start gap-3">
            <code class="text-primary text-sm font-mono shrink-0">{{ field.key }}</code>
            <p class="text-xs text-dimmed">{{ field.desc }}</p>
          </div>
        </div>
      </div>

      <p class="text-xs text-dimmed">{{ t('about.orgs.techSection.membershipNote') }}</p>
      <p class="text-xs text-dimmed">{{ t('about.orgs.techSection.slugNote') }}</p>
    </div>

    <UAccordion :items="faqItems" />
  </section>
</template>
