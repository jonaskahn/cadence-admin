<script lang="ts" setup>
const { t } = useI18n()

const orchestratorConfig = inject<ReturnType<typeof useLangGraphOrchestratorConfig>>('langGraphOrchestratorConfig')
if (!orchestratorConfig) {
  throw new Error('LangGraphSupervisorParallelToolsCard must be used inside LangGraphAiAppConfigProvider')
}

const { modeConfig } = orchestratorConfig

const switchAriaLabel = computed(() => `${t('aiApps.supervisor.parallelToolCalls')}. ${t('aiApps.featureCards.toggleFeature')}`)
</script>

<template>
  <UCard variant="soft" class="min-w-0 h-full">
    <template #header>
      <div class="flex w-full items-center justify-between gap-2 min-w-0">
        <span class="font-semibold">{{ t('aiApps.supervisor.parallelToolCalls') }}</span>
        <USwitch v-model="modeConfig.enabled_parallel_tool_calls" :aria-label="switchAriaLabel" class="shrink-0" />
      </div>
    </template>
  </UCard>
</template>
