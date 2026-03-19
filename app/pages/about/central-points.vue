<script lang="ts" setup>
const { t } = useI18n()

const useCases = computed(() => [
  {
    id: 'bluegreen',
    icon: 'i-lucide-arrow-left-right',
    title: t('about.centralPoints.useCasesSection.bluegreen.title'),
    scenario: t('about.centralPoints.useCasesSection.bluegreen.scenario'),
    benefit: t('about.centralPoints.useCasesSection.bluegreen.benefit')
  },
  {
    id: 'rollback',
    icon: 'i-lucide-undo-2',
    title: t('about.centralPoints.useCasesSection.rollback.title'),
    scenario: t('about.centralPoints.useCasesSection.rollback.scenario'),
    benefit: t('about.centralPoints.useCasesSection.rollback.benefit')
  },
  {
    id: 'testing',
    icon: 'i-lucide-flask-conical',
    title: t('about.centralPoints.useCasesSection.testing.title'),
    scenario: t('about.centralPoints.useCasesSection.testing.scenario'),
    benefit: t('about.centralPoints.useCasesSection.testing.benefit')
  },
  {
    id: 'public',
    icon: 'i-lucide-globe',
    title: t('about.centralPoints.useCasesSection.public.title'),
    scenario: t('about.centralPoints.useCasesSection.public.scenario'),
    benefit: t('about.centralPoints.useCasesSection.public.benefit')
  },
  {
    id: 'multienv',
    icon: 'i-lucide-layers',
    title: t('about.centralPoints.useCasesSection.multienv.title'),
    scenario: t('about.centralPoints.useCasesSection.multienv.scenario'),
    benefit: t('about.centralPoints.useCasesSection.multienv.benefit')
  }
])

const cpHeaders = computed(() => [
  { key: 'X-CENTRAL-ID',   desc: t('about.centralPoints.techSection.headers.centralId') },
  { key: 'X-ORG-ID',       desc: t('about.centralPoints.techSection.headers.orgId') },
  { key: 'Authorization',  desc: t('about.centralPoints.techSection.headers.authorization') }
])

const cpVisibility = computed(() => [
  { mode: 'public',  color: 'success' as const, desc: t('about.centralPoints.techSection.visibility.public') },
  { mode: 'private', color: 'warning' as const, desc: t('about.centralPoints.techSection.visibility.private') }
])

const faqItems = computed(() => [
  {
    label: t('about.centralPoints.faq1.question'),
    content: t('about.centralPoints.faq1.answer')
  },
  {
    label: t('about.centralPoints.faq2.question'),
    content: t('about.centralPoints.faq2.answer')
  },
  {
    label: t('about.centralPoints.faq3.question'),
    content: t('about.centralPoints.faq3.answer')
  }
])
</script>

<template>
  <section class="space-y-8">
    <!-- 1. Overview -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-radio" class="text-primary size-5" />
        <h2 class="text-lg font-semibold">{{ t('about.centralPoints.title') }}</h2>
      </div>
      <p class="text-xs text-dimmed">{{ t('about.centralPoints.subtitle') }}</p>
      <p class="text-sm">{{ t('about.centralPoints.intro') }}</p>
      <ul class="text-sm list-disc list-inside space-y-1">
        <li>{{ t('about.centralPoints.bullet1') }}</li>
        <li>{{ t('about.centralPoints.bullet2') }}</li>
        <li>{{ t('about.centralPoints.bullet3') }}</li>
        <li>{{ t('about.centralPoints.bullet4') }}</li>
        <li>{{ t('about.centralPoints.bullet5') }}</li>
      </ul>
    </div>

    <!-- 2. Use Cases -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-lightbulb" class="text-primary size-5" />
        <h3 class="text-base font-semibold">{{ t('about.centralPoints.useCasesSection.title') }}</h3>
      </div>
      <p class="text-sm">{{ t('about.centralPoints.useCasesSection.intro') }}</p>
      <div class="space-y-3">
        <div v-for="uc in useCases" :key="uc.id" class="rounded-lg border p-4 space-y-2">
          <div class="flex items-center gap-2">
            <UIcon :name="uc.icon" class="text-primary size-4 shrink-0" />
            <p class="text-sm font-medium">{{ uc.title }}</p>
          </div>
          <p class="text-xs text-dimmed">{{ uc.scenario }}</p>
          <p class="text-xs text-dimmed italic">{{ uc.benefit }}</p>
        </div>
      </div>
    </div>

    <!-- Technical Reference -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-globe" class="w-4 h-4 text-primary" />
        <h3 class="text-sm font-semibold">{{ t('about.centralPoints.techSection.title') }}</h3>
      </div>

      <!-- Endpoint -->
      <div>
        <p class="text-xs font-semibold text-dimmed uppercase tracking-wide mb-2">{{ t('about.centralPoints.techSection.endpoints.title') }}</p>
        <div class="flex items-start gap-3 border border-(--ui-border) rounded-lg p-3">
          <UBadge label="POST" color="success" variant="soft" class="mt-0.5 shrink-0" />
          <div class="flex-1 min-w-0">
            <code class="text-xs text-primary">/api/chat/{central_point_id}</code>
            <p class="text-xs text-dimmed mt-1">{{ t('about.centralPoints.techSection.endpoints.chat.desc') }}</p>
          </div>
        </div>
      </div>

      <!-- Headers -->
      <div>
        <p class="text-xs font-semibold text-dimmed uppercase tracking-wide mb-2">{{ t('about.centralPoints.techSection.headers.title') }}</p>
        <div class="space-y-2">
          <div v-for="hdr in cpHeaders" :key="hdr.key" class="flex items-start gap-3">
            <code class="text-primary text-sm font-mono shrink-0">{{ hdr.key }}</code>
            <p class="text-xs text-dimmed">{{ hdr.desc }}</p>
          </div>
        </div>
      </div>

      <!-- Visibility -->
      <div>
        <p class="text-xs font-semibold text-dimmed uppercase tracking-wide mb-2">{{ t('about.centralPoints.techSection.visibility.title') }}</p>
        <div class="grid grid-cols-2 gap-2">
          <div v-for="vis in cpVisibility" :key="vis.mode" class="border border-(--ui-border) rounded-lg p-3">
            <UBadge :label="vis.mode" :color="vis.color" variant="soft" class="mb-2" />
            <p class="text-xs text-dimmed">{{ vis.desc }}</p>
          </div>
        </div>
      </div>

      <p class="text-xs text-dimmed">{{ t('about.centralPoints.techSection.statusNote') }}</p>
      <p class="text-xs text-dimmed">{{ t('about.centralPoints.techSection.tierNote') }}</p>
    </div>

    <!-- 3. FAQ -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-help-circle" class="text-primary size-5" />
        <h3 class="text-base font-semibold">{{ t('about.centralPoints.faqSection.title') }}</h3>
      </div>
      <UAccordion :items="faqItems" />
    </div>
  </section>
</template>
