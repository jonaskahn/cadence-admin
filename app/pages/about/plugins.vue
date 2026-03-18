<script lang="ts" setup>
const { t } = useI18n()

const pluginComponents = computed(() => [
  {
    id: 'plugin',
    name: 'BasePlugin',
    color: 'primary' as const,
    desc: t('about.plugins.anatomySection.basePlugin.desc'),
    methods: [
      t('about.plugins.anatomySection.basePlugin.method1'),
      t('about.plugins.anatomySection.basePlugin.method2'),
      t('about.plugins.anatomySection.basePlugin.method3')
    ],
    ref: 'cadence_sdk.BasePlugin'
  },
  {
    id: 'agent',
    name: 'BaseAgent',
    color: 'success' as const,
    desc: t('about.plugins.anatomySection.baseAgent.desc'),
    methods: [
      t('about.plugins.anatomySection.baseAgent.method1'),
      t('about.plugins.anatomySection.baseAgent.method2'),
      t('about.plugins.anatomySection.baseAgent.method3')
    ],
    ref: 'cadence_sdk.BaseAgent'
  },
  {
    id: 'specialized',
    name: 'BaseSpecializedAgent',
    color: 'info' as const,
    desc: t('about.plugins.anatomySection.specializedAgent.desc'),
    methods: [
      t('about.plugins.anatomySection.specializedAgent.method1')
    ],
    ref: 'cadence_sdk.BaseSpecializedAgent'
  },
  {
    id: 'scoped',
    name: 'BaseScopedAgent',
    color: 'error' as const,
    desc: t('about.plugins.anatomySection.scopedAgent.desc'),
    methods: [
      t('about.plugins.anatomySection.scopedAgent.method1'),
      t('about.plugins.anatomySection.scopedAgent.method2')
    ],
    ref: 'cadence_sdk.BaseScopedAgent'
  },
  {
    id: 'metadata',
    name: 'PluginMetadata',
    color: 'warning' as const,
    desc: t('about.plugins.anatomySection.metadata.desc'),
    methods: [
      t('about.plugins.anatomySection.metadata.field1'),
      t('about.plugins.anatomySection.metadata.field2'),
      t('about.plugins.anatomySection.metadata.field3'),
      t('about.plugins.anatomySection.metadata.field4'),
      t('about.plugins.anatomySection.metadata.field5')
    ],
    ref: 'cadence_sdk.PluginMetadata'
  }
])

const toolFields = computed(() => [
  { key: 'name / description', desc: t('about.plugins.toolsSection.field1.desc') },
  { key: 'args_schema', desc: t('about.plugins.toolsSection.field2.desc') },
  { key: 'stream=True', desc: t('about.plugins.toolsSection.field3.desc') },
  { key: 'stream_filter', desc: t('about.plugins.toolsSection.field4.desc') },
  { key: 'validate=True', desc: t('about.plugins.toolsSection.field5.desc') }
])

const settingFields = computed(() => [
  { key: 'key', desc: t('about.plugins.settingsSection.field1.desc') },
  { key: 'type', desc: t('about.plugins.settingsSection.field2.desc') },
  { key: 'required', desc: t('about.plugins.settingsSection.field3.desc') },
  { key: 'sensitive', desc: t('about.plugins.settingsSection.field4.desc') },
  { key: 'default', desc: t('about.plugins.settingsSection.field5.desc') }
])

const uploadSteps = computed(() => [
  {
    n: 1,
    title: t('about.plugins.uploadSection.step1.title'),
    desc: t('about.plugins.uploadSection.step1.desc'),
    ref: t('about.plugins.uploadSection.step1.ref')
  },
  {
    n: 2,
    title: t('about.plugins.uploadSection.step2.title'),
    desc: t('about.plugins.uploadSection.step2.desc'),
    ref: t('about.plugins.uploadSection.step2.ref')
  },
  {
    n: 3,
    title: t('about.plugins.uploadSection.step3.title'),
    desc: t('about.plugins.uploadSection.step3.desc'),
    ref: t('about.plugins.uploadSection.step3.ref')
  },
  {
    n: 4,
    title: t('about.plugins.uploadSection.step4.title'),
    desc: t('about.plugins.uploadSection.step4.desc'),
    ref: t('about.plugins.uploadSection.step4.ref')
  },
  {
    n: 5,
    title: t('about.plugins.uploadSection.step5.title'),
    desc: t('about.plugins.uploadSection.step5.desc'),
    ref: t('about.plugins.uploadSection.step5.ref')
  },
  {
    n: 6,
    title: t('about.plugins.uploadSection.step6.title'),
    desc: t('about.plugins.uploadSection.step6.desc'),
    ref: t('about.plugins.uploadSection.step6.ref')
  },
  {
    n: 7,
    title: t('about.plugins.uploadSection.step7.title'),
    desc: t('about.plugins.uploadSection.step7.desc'),
    ref: t('about.plugins.uploadSection.step7.ref')
  },
  {
    n: 8,
    title: t('about.plugins.uploadSection.step8.title'),
    desc: t('about.plugins.uploadSection.step8.desc'),
    ref: t('about.plugins.uploadSection.step8.ref')
  }
])

const faqItems = computed(() => [
  { label: t('about.plugins.faq1.question'), content: t('about.plugins.faq1.answer') },
  { label: t('about.plugins.faq2.question'), content: t('about.plugins.faq2.answer') },
  { label: t('about.plugins.faq3.question'), content: t('about.plugins.faq3.answer') }
])
</script>

<template>
  <section class="space-y-8">
    <!-- 1. Overview -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-puzzle" class="text-primary size-5" />
        <h2 class="text-lg font-semibold">{{ t('about.plugins.title') }}</h2>
      </div>
      <p class="text-xs text-dimmed">{{ t('about.plugins.subtitle') }}</p>
      <p class="text-sm">{{ t('about.plugins.intro') }}</p>
      <ul class="text-sm list-disc list-inside space-y-1">
        <li>{{ t('about.plugins.bullet1') }}</li>
        <li>{{ t('about.plugins.bullet2') }}</li>
        <li>{{ t('about.plugins.bullet3') }}</li>
        <li>{{ t('about.plugins.bullet4') }}</li>
        <li>{{ t('about.plugins.bullet5') }}</li>
      </ul>
    </div>

    <!-- 2. Plugin Anatomy -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-code-2" class="text-primary size-5" />
        <h3 class="text-base font-semibold">{{ t('about.plugins.anatomySection.title') }}</h3>
      </div>
      <p class="text-sm">{{ t('about.plugins.anatomySection.intro') }}</p>
      <div class="space-y-3">
        <div v-for="c in pluginComponents" :key="c.id" class="rounded-lg border p-4 space-y-2">
          <UBadge :color="c.color" variant="subtle">{{ c.name }}</UBadge>
          <p class="text-sm">{{ c.desc }}</p>
          <ul class="space-y-1">
            <li v-for="(m, i) in c.methods" :key="i" class="text-xs text-dimmed font-mono">{{ m }}</li>
          </ul>
          <code class="text-xs font-mono text-dimmed">{{ c.ref }}</code>
        </div>
      </div>
    </div>

    <!-- 3. Defining Tools -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-wrench" class="text-primary size-5" />
        <h3 class="text-base font-semibold">{{ t('about.plugins.toolsSection.title') }}</h3>
      </div>
      <p class="text-sm">{{ t('about.plugins.toolsSection.intro') }}</p>
      <ul class="space-y-2">
        <li v-for="f in toolFields" :key="f.key" class="flex gap-3">
          <code class="text-xs font-mono text-primary shrink-0 mt-0.5 w-36">{{ f.key }}</code>
          <p class="text-xs text-dimmed">{{ f.desc }}</p>
        </li>
      </ul>
    </div>

    <!-- 4. Plugin Settings -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-sliders-horizontal" class="text-primary size-5" />
        <h3 class="text-base font-semibold">{{ t('about.plugins.settingsSection.title') }}</h3>
      </div>
      <p class="text-sm">{{ t('about.plugins.settingsSection.intro') }}</p>
      <ul class="space-y-2">
        <li v-for="f in settingFields" :key="f.key" class="flex gap-3">
          <code class="text-xs font-mono text-primary shrink-0 mt-0.5 w-20">{{ f.key }}</code>
          <p class="text-xs text-dimmed">{{ f.desc }}</p>
        </li>
      </ul>
    </div>

    <!-- 5. Upload & Validation Pipeline -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-upload" class="text-primary size-5" />
        <h3 class="text-base font-semibold">{{ t('about.plugins.uploadSection.title') }}</h3>
      </div>
      <p class="text-sm">{{ t('about.plugins.uploadSection.intro') }}</p>
      <ol class="space-y-3">
        <li v-for="step in uploadSteps" :key="step.n" class="flex gap-3">
          <UBadge color="primary" variant="subtle" class="shrink-0 mt-0.5">{{ step.n }}</UBadge>
          <div class="space-y-0.5">
            <p class="text-sm font-medium">{{ step.title }}</p>
            <p class="text-xs text-dimmed">{{ step.desc }}</p>
            <code class="text-xs text-dimmed font-mono">{{ step.ref }}</code>
          </div>
        </li>
      </ol>
    </div>

    <!-- 6. FAQ -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-help-circle" class="text-primary size-5" />
        <h3 class="text-base font-semibold">{{ t('about.plugins.faqSection.title') }}</h3>
      </div>
      <UAccordion :items="faqItems" />
    </div>
  </section>
</template>
