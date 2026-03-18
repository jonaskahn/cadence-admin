<script lang="ts" setup>
const { t } = useI18n()

const modesInfo = computed(() => [
  { id: 'supervisor', label: 'Supervisor', status: 'stable', frameworks: ['LangGraph', 'Google ADK'] },
  { id: 'grounded', label: 'Grounded', status: 'stable', frameworks: ['LangGraph', 'Google ADK'] },
  { id: 'coordinator', label: 'Coordinator', status: 'preview', frameworks: ['LangGraph', 'Google ADK'] },
  { id: 'handoff', label: 'Handoff', status: 'preview', frameworks: ['LangGraph', 'Google ADK'] },
  { id: 'pipeline', label: 'Pipeline', status: 'preview', frameworks: ['LangGraph', 'Google ADK'] },
  { id: 'reflection', label: 'Reflection', status: 'preview', frameworks: ['LangGraph', 'Google ADK'] },
  { id: 'ensemble', label: 'Ensemble', status: 'preview', frameworks: ['LangGraph', 'Google ADK'] },
  { id: 'hierarchical', label: 'Hierarchical', status: 'preview', frameworks: ['LangGraph', 'Google ADK'] }
])

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
    <p class="text-xs text-dimmed">{{ t('about.modes.subtitle') }}</p>
    <p class="text-sm">{{ t('about.modes.intro') }}</p>
    <ul class="text-sm list-disc list-inside space-y-1">
      <li>{{ t('about.modes.bullet1') }}</li>
      <li>{{ t('about.modes.bullet2') }}</li>
      <li>{{ t('about.modes.bullet3') }}</li>
      <li>{{ t('about.modes.bullet4') }}</li>
    </ul>
    <div class="space-y-2">
      <div
        v-for="mode in modesInfo"
        :key="mode.id"
        class="flex items-center gap-3 rounded-lg border px-4 py-2"
      >
        <span class="text-sm font-medium w-28 shrink-0">{{ mode.label }}</span>
        <UBadge
          :color="mode.status === 'stable' ? 'success' : 'warning'"
          variant="subtle"
          class="shrink-0 w-20 justify-center"
        >
          {{ mode.status === 'stable' ? t('about.modes.status.stable') : t('about.modes.status.preview') }}
        </UBadge>
        <div class="flex gap-1 flex-wrap">
          <UBadge
            v-for="fw in mode.frameworks"
            :key="fw"
            color="neutral"
            variant="subtle"
            size="sm"
          >
            {{ fw }}
          </UBadge>
        </div>
      </div>
    </div>
    <UAccordion :items="faqItems" />
  </section>
</template>
