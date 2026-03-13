<script lang="ts" setup>
const { t } = useI18n()

const tierCards = computed(() => [
  { name: t('about.orchestrator.tiersSection.hot.name'), desc: t('about.orchestrator.tiersSection.hot.desc'), color: 'error' },
  { name: t('about.orchestrator.tiersSection.warm.name'), desc: t('about.orchestrator.tiersSection.warm.desc'), color: 'warning' },
  { name: t('about.orchestrator.tiersSection.cold.name'), desc: t('about.orchestrator.tiersSection.cold.desc'), color: 'info' }
])

const pipelineSteps = computed(() => [
  { n: 1, title: t('about.orchestrator.pluginLoadSection.step1.title'), desc: t('about.orchestrator.pluginLoadSection.step1.desc'), ref: t('about.orchestrator.pluginLoadSection.step1.ref') },
  { n: 2, title: t('about.orchestrator.pluginLoadSection.step2.title'), desc: t('about.orchestrator.pluginLoadSection.step2.desc'), ref: t('about.orchestrator.pluginLoadSection.step2.ref') },
  { n: 3, title: t('about.orchestrator.pluginLoadSection.step3.title'), desc: t('about.orchestrator.pluginLoadSection.step3.desc'), ref: t('about.orchestrator.pluginLoadSection.step3.ref') },
  { n: 4, title: t('about.orchestrator.pluginLoadSection.step4.title'), desc: t('about.orchestrator.pluginLoadSection.step4.desc'), ref: t('about.orchestrator.pluginLoadSection.step4.ref') },
  { n: 5, title: t('about.orchestrator.pluginLoadSection.step5.title'), desc: t('about.orchestrator.pluginLoadSection.step5.desc'), ref: t('about.orchestrator.pluginLoadSection.step5.ref') },
  { n: 6, title: t('about.orchestrator.pluginLoadSection.step6.title'), desc: t('about.orchestrator.pluginLoadSection.step6.desc'), ref: t('about.orchestrator.pluginLoadSection.step6.ref') },
  { n: 7, title: t('about.orchestrator.pluginLoadSection.step7.title'), desc: t('about.orchestrator.pluginLoadSection.step7.desc'), ref: t('about.orchestrator.pluginLoadSection.step7.ref') },
  { n: 8, title: t('about.orchestrator.pluginLoadSection.step8.title'), desc: t('about.orchestrator.pluginLoadSection.step8.desc'), ref: t('about.orchestrator.pluginLoadSection.step8.ref') },
  { n: 9, title: t('about.orchestrator.pluginLoadSection.step9.title'), desc: t('about.orchestrator.pluginLoadSection.step9.desc'), ref: t('about.orchestrator.pluginLoadSection.step9.ref') }
])

const faqItems = computed(() => [
  { label: t('about.orchestrator.faq1.question'), content: t('about.orchestrator.faq1.answer') },
  { label: t('about.orchestrator.faq2.question'), content: t('about.orchestrator.faq2.answer') },
  { label: t('about.orchestrator.faq3.question'), content: t('about.orchestrator.faq3.answer') },
  { label: t('about.orchestrator.faq4.question'), content: t('about.orchestrator.faq4.answer') },
  { label: t('about.orchestrator.faq5.question'), content: t('about.orchestrator.faq5.answer') },
  { label: t('about.orchestrator.faq6.question'), content: t('about.orchestrator.faq6.answer') },
  { label: t('about.orchestrator.faq7.question'), content: t('about.orchestrator.faq7.answer') }
])
</script>

<template>
  <section class="space-y-8">

    <!-- 1. Overview -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-cpu" class="text-primary size-5" />
        <h2 class="text-lg font-semibold">{{ t('about.orchestrator.title') }}</h2>
      </div>
      <p class="text-sm text-muted">{{ t('about.orchestrator.subtitle') }}</p>
      <p class="text-sm">{{ t('about.orchestrator.intro') }}</p>
      <ul class="text-sm list-disc list-inside space-y-1">
        <li>{{ t('about.orchestrator.bullet1') }}</li>
        <li>{{ t('about.orchestrator.bullet2') }}</li>
        <li>{{ t('about.orchestrator.bullet3') }}</li>
        <li>{{ t('about.orchestrator.bullet4') }}</li>
        <li>{{ t('about.orchestrator.bullet5') }}</li>
      </ul>
    </div>

    <!-- 2. Managing Orchestrators (CRUD) -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-list-checks" class="text-primary size-5" />
        <h3 class="text-base font-semibold">{{ t('about.orchestrator.crudSection.title') }}</h3>
      </div>
      <p class="text-sm">{{ t('about.orchestrator.crudSection.intro') }}</p>
      <ul class="text-sm list-disc list-inside space-y-1">
        <li>{{ t('about.orchestrator.crudSection.create') }}</li>
        <li>{{ t('about.orchestrator.crudSection.view') }}</li>
        <li>{{ t('about.orchestrator.crudSection.edit') }}</li>
        <li>{{ t('about.orchestrator.crudSection.clone') }}</li>
        <li>{{ t('about.orchestrator.crudSection.delete') }}</li>
        <li>{{ t('about.orchestrator.crudSection.activate') }}</li>
      </ul>
    </div>

    <!-- 3. Loading & Performance Tiers -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-zap" class="text-primary size-5" />
        <h3 class="text-base font-semibold">{{ t('about.orchestrator.tiersSection.title') }}</h3>
      </div>
      <p class="text-sm">{{ t('about.orchestrator.tiersSection.intro') }}</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          v-for="card in tierCards"
          :key="card.name"
          class="rounded-lg border p-3 space-y-2"
        >
          <UBadge :color="card.color" variant="subtle" size="sm">{{ card.name }}</UBadge>
          <p class="text-xs text-muted">{{ card.desc }}</p>
        </div>
      </div>
      <p class="text-xs text-muted">{{ t('about.orchestrator.tiersSection.note') }}</p>
    </div>

    <!-- 4. What You Can Do -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-sparkles" class="text-primary size-5" />
        <h3 class="text-base font-semibold">{{ t('about.orchestrator.featuresSection.title') }}</h3>
      </div>
      <p class="text-sm">{{ t('about.orchestrator.featuresSection.intro') }}</p>
      <ul class="text-sm list-disc list-inside space-y-1">
        <li>{{ t('about.orchestrator.featuresSection.bullet1') }}</li>
        <li>{{ t('about.orchestrator.featuresSection.bullet2') }}</li>
        <li>{{ t('about.orchestrator.featuresSection.bullet3') }}</li>
        <li>{{ t('about.orchestrator.featuresSection.bullet4') }}</li>
        <li>{{ t('about.orchestrator.featuresSection.bullet5') }}</li>
      </ul>
    </div>

    <!-- 5. How Plugin Loading Works -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-workflow" class="text-primary size-5" />
        <h3 class="text-base font-semibold">{{ t('about.orchestrator.pluginLoadSection.title') }}</h3>
      </div>
      <p class="text-sm">{{ t('about.orchestrator.pluginLoadSection.intro') }}</p>
      <ol class="space-y-3">
        <li v-for="step in pipelineSteps" :key="step.n" class="flex gap-3">
          <UBadge color="primary" variant="subtle" class="shrink-0 mt-0.5">{{ step.n }}</UBadge>
          <div class="space-y-0.5">
            <p class="text-sm font-medium">{{ step.title }}</p>
            <p class="text-sm text-muted">{{ step.desc }}</p>
            <code class="text-xs text-muted font-mono">{{ step.ref }}</code>
          </div>
        </li>
      </ol>
      <p class="text-xs text-muted">{{ t('about.orchestrator.pluginLoadSection.securityNote') }}</p>
      <p class="text-xs text-muted">{{ t('about.orchestrator.pluginLoadSection.cacheNote') }}</p>
    </div>

    <!-- 6. FAQ -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-help-circle" class="text-primary size-5" />
        <h3 class="text-base font-semibold">{{ t('about.orchestrator.faqSection.title') }}</h3>
      </div>
      <UAccordion :items="faqItems" />
    </div>

  </section>
</template>
