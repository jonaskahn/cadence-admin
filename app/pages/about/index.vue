<script lang="ts" setup>
const { t } = useI18n()
const localePath = useLocalePath()

const sections = [
  { key: 'orchestrator', path: '/about/orchestrator', icon: 'i-lucide-cpu' },
  { key: 'chat', path: '/about/chat', icon: 'i-lucide-message-square' },
  { key: 'plugins', path: '/about/plugins', icon: 'i-lucide-puzzle' },
  { key: 'llmConfigs', path: '/about/llm-configs', icon: 'i-lucide-cable' },
  { key: 'centralPoints', path: '/about/central-points', icon: 'i-lucide-radio' },
  { key: 'orgs', path: '/about/orgs', icon: 'i-lucide-building' },
  { key: 'roles', path: '/about/roles', icon: 'i-lucide-shield-check' },
  { key: 'frameworks', path: '/about/frameworks', icon: 'i-lucide-layers' },
  { key: 'modes', path: '/about/modes', icon: 'i-lucide-git-branch' },
  { key: 'admin', path: '/about/admin', icon: 'i-lucide-sliders' }
]
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center gap-2 mb-1">
      <UIcon name="i-lucide-layout-panel-top" class="text-primary size-5" />
      <h2 class="text-lg font-semibold">{{ t('about.overview.title') }}</h2>
    </div>
    <p class="text-sm text-muted">{{ t('about.overview.subtitle') }}</p>
    <p class="text-sm">{{ t('about.overview.intro') }}</p>

    <div class="space-y-2">
      <h3 class="text-sm font-medium text-muted">{{ t('about.overview.featuresTitle') }}</h3>
      <ul class="text-sm list-disc list-inside space-y-1 text-muted">
        <li>{{ t('about.overview.feature1') }}</li>
        <li>{{ t('about.overview.feature2') }}</li>
        <li>{{ t('about.overview.feature3') }}</li>
        <li>{{ t('about.overview.feature4') }}</li>
        <li>{{ t('about.overview.feature5') }}</li>
        <li>{{ t('about.overview.feature6') }}</li>
        <li>{{ t('about.overview.feature7') }}</li>
      </ul>
    </div>

    <div class="space-y-3 pt-2">
      <h3 class="text-sm font-medium text-muted">{{ t('about.overview.learnMore') }}</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <NuxtLink
          v-for="s in sections"
          :key="s.key"
          :to="localePath(s.path)"
          class="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors text-left"
        >
          <UIcon :name="s.icon" class="text-primary size-5 shrink-0 mt-0.5" />
          <div class="min-w-0">
            <p class="text-sm font-medium">{{ t(`about.tabs.${s.key}`) }}</p>
            <p class="text-xs text-muted mt-0.5">{{ t(`about.overview.sections.${s.key}`) }}</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
