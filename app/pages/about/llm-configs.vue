<script lang="ts" setup>
const { t } = useI18n()

const providerCards = computed(() => [
  { id: 'openai', name: 'OpenAI', color: 'success' as const, note: t('about.llmConfigs.techSection.providers.openai.note') },
  { id: 'anthropic', name: 'Anthropic', color: 'warning' as const, note: t('about.llmConfigs.techSection.providers.anthropic.note') },
  { id: 'google', name: 'Google', color: 'info' as const, note: t('about.llmConfigs.techSection.providers.google.note') },
  { id: 'groq', name: 'Groq', color: 'primary' as const, note: t('about.llmConfigs.techSection.providers.groq.note') },
  { id: 'azure', name: 'Azure', color: 'neutral' as const, note: t('about.llmConfigs.techSection.providers.azure.note') },
  { id: 'litellm', name: 'LiteLLM', color: 'error' as const, note: t('about.llmConfigs.techSection.providers.litellm.note') },
  { id: 'tensorzero', name: 'TensorZero', color: 'success' as const, note: t('about.llmConfigs.techSection.providers.tensorzero.note') },
  { id: 'bifrost', name: 'Bifrost', color: 'info' as const, note: t('about.llmConfigs.techSection.providers.bifrost.note') }
])

const llmConfigFields = computed(() => [
  { key: 'is_enabled', desc: t('about.llmConfigs.techSection.fields.isEnabled.desc') },
  { key: 'additional_config', desc: t('about.llmConfigs.techSection.fields.additionalConfig.desc') },
  { key: 'base_url', desc: t('about.llmConfigs.techSection.fields.baseUrl.desc') }
])

const llmEndpoints = computed(() => [
  { method: 'GET', path: '/api/orgs/{org_id}/llm-configs', desc: t('about.llmConfigs.techSection.endpoints.list.desc') },
  { method: 'POST', path: '/api/orgs/{org_id}/llm-configs', desc: t('about.llmConfigs.techSection.endpoints.create.desc') },
  { method: 'PATCH', path: '/api/orgs/{org_id}/llm-configs/{id}', desc: t('about.llmConfigs.techSection.endpoints.update.desc') },
  { method: 'DELETE', path: '/api/orgs/{org_id}/llm-configs/{id}', desc: t('about.llmConfigs.techSection.endpoints.delete.desc') },
  { method: 'GET', path: '/api/orgs/{org_id}/llm-configs/{id}/models', desc: t('about.llmConfigs.techSection.endpoints.models.desc') }
])

const faqItems = computed(() => [
  {
    label: t('about.llmConfigs.faq1.question'),
    content: t('about.llmConfigs.faq1.answer')
  },
  {
    label: t('about.llmConfigs.faq2.question'),
    content: t('about.llmConfigs.faq2.answer')
  },
  {
    label: t('about.llmConfigs.faq3.question'),
    content: t('about.llmConfigs.faq3.answer')
  }
])
</script>

<template>
  <section class="space-y-8">
    <div class="flex items-center gap-2 mb-1">
      <UIcon name="i-lucide-cable" class="text-primary size-5" />
      <h2 class="text-lg font-semibold">{{ t('about.llmConfigs.title') }}</h2>
    </div>
    <p class="text-xs text-dimmed">{{ t('about.llmConfigs.subtitle') }}</p>
    <p class="text-sm">{{ t('about.llmConfigs.intro') }}</p>
    <ul class="text-sm list-disc list-inside space-y-1 mb-4">
      <li>{{ t('about.llmConfigs.bullet1') }}</li>
      <li>{{ t('about.llmConfigs.bullet2') }}</li>
      <li>{{ t('about.llmConfigs.bullet3') }}</li>
      <li>{{ t('about.llmConfigs.bullet4') }}</li>
      <li>{{ t('about.llmConfigs.bullet5') }}</li>
    </ul>

    <!-- Technical Reference -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-key" class="w-4 h-4 text-primary" />
        <h3 class="text-sm font-semibold">{{ t('about.llmConfigs.techSection.title') }}</h3>
      </div>

      <!-- Providers grid -->
      <div>
        <p class="text-xs font-semibold text-dimmed uppercase tracking-wide mb-2">{{ t('about.llmConfigs.techSection.providers.title') }}</p>
        <div class="grid grid-cols-2 gap-2">
          <div v-for="prov in providerCards" :key="prov.id" class="border border-(--ui-border) rounded-lg p-3">
            <UBadge :label="prov.name" :color="prov.color" variant="soft" class="mb-2" />
            <p class="text-xs text-dimmed">{{ prov.note }}</p>
          </div>
        </div>
      </div>

      <!-- Notable fields -->
      <div>
        <p class="text-xs font-semibold text-dimmed uppercase tracking-wide mb-2">{{ t('about.llmConfigs.techSection.fields.title') }}</p>
        <div class="space-y-2">
          <div v-for="field in llmConfigFields" :key="field.key" class="flex items-start gap-3">
            <code class="text-primary text-sm font-mono shrink-0">{{ field.key }}</code>
            <p class="text-xs text-dimmed">{{ field.desc }}</p>
          </div>
        </div>
      </div>

      <p class="text-xs text-dimmed italic">{{ t('about.llmConfigs.techSection.lifecycleNote') }}</p>

      <!-- Endpoints -->
      <div>
        <p class="text-xs font-semibold text-dimmed uppercase tracking-wide mb-2">{{ t('about.llmConfigs.techSection.endpoints.title') }}</p>
        <div class="space-y-2">
          <div v-for="ep in llmEndpoints" :key="ep.path + ep.method" class="flex items-start gap-3 border border-(--ui-border) rounded-lg p-3">
            <UBadge
              :label="ep.method"
              :color="ep.method === 'GET' ? 'info' : ep.method === 'POST' ? 'success' : ep.method === 'PATCH' ? 'warning' : 'error'"
              variant="soft"
              class="mt-0.5 shrink-0"
            />
            <div class="flex-1 min-w-0">
              <code class="text-xs text-primary">{{ ep.path }}</code>
              <p class="text-xs text-dimmed mt-1">{{ ep.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UAccordion :items="faqItems" />
  </section>
</template>
