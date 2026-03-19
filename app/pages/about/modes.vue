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

const supervisorConfigFields = computed(() => [
  { key: 'max_agent_hops',      default: '5',     desc: t('about.modes.techSection.supervisorConfig.maxAgentHops') },
  { key: 'parallel_tool_calls', default: 'true',  desc: t('about.modes.techSection.supervisorConfig.parallelToolCalls') },
  { key: 'llm_validation',      default: 'false', desc: t('about.modes.techSection.supervisorConfig.llmValidation') },
  { key: 'auto_compact',        default: 'true',  desc: t('about.modes.techSection.supervisorConfig.autoCompact') },
  { key: 'node_timeout',        default: '60',    desc: t('about.modes.techSection.supervisorConfig.nodeTimeout') }
])

const supervisorNodes = ['Router', 'Planner', 'Executor', 'Synthesizer', 'Clarifier', 'Responder', 'ErrorHandler']

const groundedConfigFields = computed(() => [
  { key: 'scope_rules',       default: t('about.modes.techSection.groundedConfig.scopeRulesDefault'), desc: t('about.modes.techSection.groundedConfig.scopeRules') },
  { key: 'max_tool_rounds',   default: '3',     desc: t('about.modes.techSection.groundedConfig.maxToolRounds') },
  { key: 'enabled_validator', default: 'true',  desc: t('about.modes.techSection.groundedConfig.enabledValidator') },
  { key: 'node_timeout',      default: '60',    desc: t('about.modes.techSection.groundedConfig.nodeTimeout') }
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
  <section class="space-y-8">
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

    <!-- Technical Reference -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-sliders-horizontal" class="w-4 h-4 text-primary" />
        <h3 class="text-sm font-semibold">{{ t('about.modes.techSection.title') }}</h3>
      </div>

      <!-- Supervisor Config -->
      <div>
        <p class="text-xs font-semibold text-dimmed uppercase tracking-wide mb-2">{{ t('about.modes.techSection.supervisorConfig.title') }}</p>
        <div class="space-y-2">
          <div v-for="field in supervisorConfigFields" :key="field.key" class="flex items-start gap-3">
            <code class="text-primary text-sm font-mono w-52 shrink-0">{{ field.key }}</code>
            <UBadge :label="field.default" color="neutral" variant="soft" class="shrink-0 mt-0.5" />
            <p class="text-xs text-dimmed">{{ field.desc }}</p>
          </div>
        </div>
        <div class="mt-3 text-xs text-dimmed">
          <span>{{ t('about.modes.techSection.supervisorConfig.nodeOverridesNote') }}</span>
          <span v-for="node in supervisorNodes" :key="node" class="inline-flex ml-1">
            <UBadge :label="node" color="neutral" variant="outline" size="xs" />
          </span>
        </div>
        <p class="text-xs text-dimmed mt-1">{{ t('about.modes.techSection.supervisorConfig.nodeOverridesFields') }}</p>
      </div>

      <!-- Grounded Config -->
      <div>
        <p class="text-xs font-semibold text-dimmed uppercase tracking-wide mb-2">{{ t('about.modes.techSection.groundedConfig.title') }}</p>
        <div class="space-y-2">
          <div v-for="field in groundedConfigFields" :key="field.key" class="flex items-start gap-3">
            <code class="text-primary text-sm font-mono w-52 shrink-0">{{ field.key }}</code>
            <UBadge :label="field.default" color="neutral" variant="soft" class="shrink-0 mt-0.5" />
            <p class="text-xs text-dimmed">{{ field.desc }}</p>
          </div>
        </div>
        <p class="text-xs text-dimmed mt-2">{{ t('about.modes.techSection.groundedConfig.stateNote') }}</p>
      </div>
    </div>

    <UAccordion :items="faqItems" />
  </section>
</template>
