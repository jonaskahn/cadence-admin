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

const steps = [
  {
    label: 'Create or join an Organization',
    description: 'Set up your workspace before anything else. Organizations group your team and define access boundaries.',
    cta: 'System > Organizations',
    path: '/admin/orgs'
  },
  {
    label: 'Assign Roles to Members',
    description: 'Control who can access what. Assign admin or member roles to each person in your organization.',
    cta: 'Settings > Members',
    path: '/settings/members'
  },
  {
    label: 'Connect LLM Configs',
    description: 'Add API keys for your AI providers. Each config maps to a model and is used by your orchestrators.',
    cta: 'Settings > LLM Configs',
    path: '/settings/llm-configs'
  },
  {
    label: 'Install Plugins',
    description: 'Extend your orchestrators with tools — web search, code execution, custom actions, and more.',
    cta: 'Plugins',
    path: '/plugins'
  },
  {
    label: 'Create an Orchestrator',
    description: 'Configure your first AI workflow. Choose a framework, attach plugins, and set your LLM config.',
    cta: 'Orchestrators > New',
    path: '/orchestrators/create'
  },
  {
    label: 'Start Chatting',
    description: "You're ready. Talk to your agents, run tasks, and monitor everything in real time.",
    cta: 'Chat',
    path: '/chat',
    isGoal: true
  }
]
</script>

<template>
  <section class="space-y-8">
    <div class="flex items-center gap-2 mb-1">
      <UIcon name="i-lucide-layout-panel-top" class="text-primary size-5" />
      <h2 class="text-lg font-semibold">{{ t('about.overview.title') }}</h2>
    </div>
    <p class="text-xs text-dimmed">{{ t('about.overview.subtitle') }}</p>
    <p class="text-sm">{{ t('about.overview.intro') }}</p>

    <!-- Setup Timeline -->
    <div class="pt-2">
      <h3 class="text-xs font-medium text-dimmed uppercase tracking-widest mb-6">Getting Started</h3>
      <div class="relative">
        <!-- Vertical line -->
        <div class="absolute left-[9px] top-2 bottom-2 w-0.5 bg-primary/20" />

        <div class="flex flex-col gap-0">
          <div v-for="(step, index) in steps" :key="step.path" class="relative flex gap-5 pb-8 last:pb-0">
            <!-- Dot -->
            <div class="relative z-10 mt-0.5 shrink-0">
              <div
                class="size-[18px] rounded-full border-2 flex items-center justify-center"
                :class="step.isGoal ? 'bg-primary border-primary' : 'bg-background border-primary/50'"
              >
                <div v-if="step.isGoal" class="size-1.5 rounded-full bg-white" />
                <div v-else class="size-1 rounded-full bg-primary/60" />
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-baseline gap-2 mb-1">
                <span class="text-xs font-medium text-dimmed tabular-nums">{{ String(index + 1).padStart(2, '0') }}</span>
                <p class="text-sm font-semibold text-foreground">{{ step.label }}</p>
              </div>
              <p class="text-xs text-dimmed leading-relaxed mb-2">{{ step.description }}</p>
              <NuxtLink
                :to="localePath(step.path)"
                class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-600 transition-colors"
              >
                <UIcon name="i-lucide-arrow-right" class="size-3" />
                {{ step.cta }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Explore Concepts -->
    <div class="space-y-3 pt-2">
      <h3 class="text-xs font-medium text-dimmed uppercase tracking-widest">{{ t('about.overview.learnMore') }}</h3>
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
            <p class="text-xs text-dimmed mt-0.5">{{ t(`about.overview.sections.${s.key}`) }}</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
