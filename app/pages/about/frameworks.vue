<script lang="ts" setup>
const { t } = useI18n()

const frameworkDetails = computed(() => [
  {
    id: 'langgraph',
    name: 'LangGraph',
    color: 'primary' as const,
    model: t('about.frameworks.executionSection.langgraph.model'),
    tools: t('about.frameworks.executionSection.langgraph.tools'),
    ref: t('about.frameworks.executionSection.langgraph.ref'),
    implemented: true
  },
  {
    id: 'adk',
    name: 'Google ADK',
    color: 'success' as const,
    model: t('about.frameworks.executionSection.adk.model'),
    tools: t('about.frameworks.executionSection.adk.tools'),
    ref: t('about.frameworks.executionSection.adk.ref'),
    implemented: true
  },
  {
    id: 'openai',
    name: 'OpenAI Agents',
    color: 'neutral' as const,
    model: t('about.frameworks.executionSection.openai.model'),
    tools: '',
    ref: t('about.frameworks.executionSection.openai.ref'),
    implemented: false
  }
])

const providerCompat = [
  {
    id: 'langgraph',
    name: 'LangGraph',
    color: 'primary' as const,
    providers: ['litellm', 'bifrost', 'tensorzero', 'openai', 'azure', 'google', 'gemini', 'claude', 'anthropic', 'groq']
  },
  { id: 'adk', name: 'Google ADK', color: 'success' as const, providers: ['litellm', 'bifrost', 'claude', 'anthropic'] },
  { id: 'openai', name: 'OpenAI Agents', color: 'neutral' as const, providers: ['litellm', 'bifrost', 'openai'] }
]

const factoryFields = computed(() => [
  { key: 'framework_type',          desc: t('about.frameworks.techSection.factory.frameworkType') },
  { key: 'mode',                    desc: t('about.frameworks.techSection.factory.mode') },
  { key: 'adapter_class',           desc: t('about.frameworks.techSection.factory.adapterClass') },
  { key: 'orchestrator_class',      desc: t('about.frameworks.techSection.factory.orchestratorClass') },
  { key: 'streaming_wrapper_class', desc: t('about.frameworks.techSection.factory.streamingWrapperClass') }
])

const faqItems = computed(() => [
  {
    label: t('about.frameworks.faq1.question'),
    content: t('about.frameworks.faq1.answer')
  },
  {
    label: t('about.frameworks.faq2.question'),
    content: t('about.frameworks.faq2.answer')
  },
  {
    label: t('about.frameworks.faq3.question'),
    content: t('about.frameworks.faq3.answer')
  }
])
</script>

<template>
  <section class="space-y-8">
    <!-- 1. Overview -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-layers" class="text-primary size-5" />
        <h2 class="text-lg font-semibold">{{ t('about.frameworks.title') }}</h2>
      </div>
      <p class="text-xs text-dimmed">{{ t('about.frameworks.subtitle') }}</p>
      <p class="text-sm">{{ t('about.frameworks.intro') }}</p>
      <ul class="text-sm list-disc list-inside space-y-1">
        <li>{{ t('about.frameworks.bullet1') }}</li>
        <li>{{ t('about.frameworks.bullet2') }}</li>
        <li>{{ t('about.frameworks.bullet3') }}</li>
        <li>{{ t('about.frameworks.bullet4') }}</li>
        <li>{{ t('about.frameworks.bullet5') }}</li>
      </ul>
    </div>

    <!-- 2. How Each Framework Executes -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-cpu" class="text-primary size-5" />
        <h3 class="text-base font-semibold">{{ t('about.frameworks.executionSection.title') }}</h3>
      </div>
      <p class="text-sm">{{ t('about.frameworks.executionSection.intro') }}</p>
      <div class="space-y-3">
        <div v-for="fw in frameworkDetails" :key="fw.id" class="rounded-lg border p-4 space-y-2">
          <div class="flex items-center gap-2">
            <UBadge :color="fw.color" variant="subtle">{{ fw.name }}</UBadge>
            <span v-if="!fw.implemented" class="text-xs text-dimmed">{{ t('about.frameworks.executionSection.notImplemented') }}</span>
          </div>
          <p class="text-sm">{{ fw.model }}</p>
          <p v-if="fw.tools" class="text-xs text-dimmed">{{ fw.tools }}</p>
          <code class="text-xs font-mono text-dimmed">{{ fw.ref }}</code>
        </div>
      </div>
    </div>

    <!-- 3. Provider Compatibility -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-plug" class="text-primary size-5" />
        <h3 class="text-base font-semibold">{{ t('about.frameworks.compatSection.title') }}</h3>
      </div>
      <p class="text-sm">{{ t('about.frameworks.compatSection.intro') }}</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div v-for="fw in providerCompat" :key="fw.id" class="rounded-lg border p-3 space-y-2">
          <UBadge :color="fw.color" variant="subtle" size="sm">{{ fw.name }}</UBadge>
          <div class="flex flex-wrap gap-1">
            <UBadge v-for="p in fw.providers" :key="p" color="neutral" variant="subtle" size="xs">{{ p }}</UBadge>
          </div>
        </div>
      </div>
    </div>

    <!-- Technical Reference -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-code-2" class="w-4 h-4 text-primary" />
        <h3 class="text-sm font-semibold">{{ t('about.frameworks.techSection.title') }}</h3>
      </div>

      <!-- Registration Signature -->
      <div>
        <p class="text-xs font-semibold text-dimmed uppercase tracking-wide mb-2">{{ t('about.frameworks.techSection.factory.title') }}</p>
        <code class="block text-xs font-mono text-primary bg-(--ui-bg-muted) rounded p-2">register_backend(framework_type, mode, adapter_class, orchestrator_class, streaming_wrapper_class)</code>
        <div class="space-y-2 mt-3">
          <div v-for="field in factoryFields" :key="field.key" class="flex items-start gap-3">
            <code class="text-primary text-sm font-mono shrink-0">{{ field.key }}</code>
            <p class="text-xs text-dimmed">{{ field.desc }}</p>
          </div>
        </div>
        <p class="text-xs text-dimmed mt-2">{{ t('about.frameworks.techSection.factory.registryNote') }}</p>
      </div>

      <!-- Streaming Internals -->
      <div>
        <p class="text-xs font-semibold text-dimmed uppercase tracking-wide mb-2">{{ t('about.frameworks.techSection.streaming.title') }}</p>
        <div class="space-y-2">
          <div class="border border-(--ui-border) rounded-lg p-3">
            <p class="text-xs font-medium mb-1">LangGraph</p>
            <p class="text-xs text-dimmed">{{ t('about.frameworks.techSection.streaming.langraph') }}</p>
          </div>
          <div class="border border-(--ui-border) rounded-lg p-3">
            <p class="text-xs font-medium mb-1">Google ADK</p>
            <p class="text-xs text-dimmed">{{ t('about.frameworks.techSection.streaming.adk') }}</p>
          </div>
        </div>
      </div>

      <!-- Discovery API -->
      <div>
        <p class="text-xs font-semibold text-dimmed uppercase tracking-wide mb-2">{{ t('about.frameworks.techSection.endpoints.title') }}</p>
        <div class="flex items-start gap-3 border border-(--ui-border) rounded-lg p-3">
          <UBadge label="GET" color="info" variant="soft" class="mt-0.5 shrink-0" />
          <div class="flex-1 min-w-0">
            <code class="text-xs text-primary">/api/frameworks</code>
            <p class="text-xs text-dimmed mt-1">{{ t('about.frameworks.techSection.endpoints.list.desc') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. FAQ -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-help-circle" class="text-primary size-5" />
        <h3 class="text-base font-semibold">{{ t('about.frameworks.faqSection.title') }}</h3>
      </div>
      <UAccordion :items="faqItems" />
    </div>
  </section>
</template>
