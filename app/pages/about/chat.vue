<script lang="ts" setup>
const { t } = useI18n()

const sseEventTypes = computed(() => [
  { type: 'agent', color: 'primary' as const, desc: t('about.chat.techSection.events.agent.desc'), fields: t('about.chat.techSection.events.agent.fields') },
  {
    type: 'message',
    color: 'success' as const,
    desc: t('about.chat.techSection.events.message.desc'),
    fields: t('about.chat.techSection.events.message.fields')
  },
  { type: 'tool', color: 'warning' as const, desc: t('about.chat.techSection.events.tool.desc'), fields: t('about.chat.techSection.events.tool.fields') },
  {
    type: 'suggestion',
    color: 'info' as const,
    desc: t('about.chat.techSection.events.suggestion.desc'),
    fields: t('about.chat.techSection.events.suggestion.fields')
  },
  {
    type: 'metadata',
    color: 'neutral' as const,
    desc: t('about.chat.techSection.events.metadata.desc'),
    fields: t('about.chat.techSection.events.metadata.fields')
  }
])

const chatEndpoints = computed(() => [
  { method: 'POST', path: '/api/chat/{orchestrator_id}', desc: t('about.chat.techSection.endpoints.direct.desc') },
  { method: 'POST', path: '/api/chat/{central_point_id}', desc: t('about.chat.techSection.endpoints.centralPoint.desc') }
])

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
  <section class="space-y-8">
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

    <!-- Technical Reference -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-terminal" class="w-4 h-4 text-primary" />
        <h3 class="text-sm font-semibold">{{ t('about.chat.techSection.title') }}</h3>
      </div>
      <p class="text-sm text-dimmed">{{ t('about.chat.techSection.intro') }}</p>
      <code class="block text-xs font-mono text-dimmed bg-(--ui-bg-muted) rounded p-2 whitespace-pre">{{ 'event: {type}\ndata: {json}\n\n' }}</code>

      <!-- SSE Events -->
      <div>
        <p class="text-xs font-semibold text-dimmed uppercase tracking-wide mb-2">{{ t('about.chat.techSection.events.title') }}</p>
        <div class="space-y-2">
          <div v-for="ev in sseEventTypes" :key="ev.type" class="flex items-start gap-3 border border-(--ui-border) rounded-lg p-3">
            <UBadge :label="ev.type" :color="ev.color" variant="soft" class="mt-0.5 shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs">{{ ev.desc }}</p>
              <p class="text-xs text-dimmed mt-1">
                Fields: <code class="text-primary">{{ ev.fields }}</code>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Endpoints -->
      <div>
        <p class="text-xs font-semibold text-dimmed uppercase tracking-wide mb-2">{{ t('about.chat.techSection.endpoints.title') }}</p>
        <div class="space-y-2">
          <div v-for="ep in chatEndpoints" :key="ep.path" class="flex items-start gap-3 border border-(--ui-border) rounded-lg p-3">
            <UBadge :label="ep.method" color="success" variant="soft" class="mt-0.5 shrink-0" />
            <div class="flex-1 min-w-0">
              <code class="text-xs text-primary">{{ ep.path }}</code>
              <p class="text-xs text-dimmed mt-1">{{ ep.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <p class="text-xs text-dimmed">{{ t('about.chat.techSection.streamingNodes') }}</p>
    </div>

    <UAccordion :items="faqItems" />
  </section>
</template>
