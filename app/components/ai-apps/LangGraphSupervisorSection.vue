<script lang="ts" setup>
import { SUPERVISOR_NODE_KEYS } from '~/composables/langgraphOrchestratorConfig/nodeKeys'

const { t } = useI18n()

function featureToggleFor(key: (typeof SUPERVISOR_NODE_KEYS)[number]): 'llm_validation' | 'clarification_intent' | undefined {
  if (key === 'validation_node') return 'llm_validation'
  if (key === 'clarifier_node') return 'clarification_intent'
  return undefined
}
</script>

<template>
  <div class="flex flex-col gap-8 w-full min-w-0">
    <div class="flex flex-col gap-2 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="font-semibold">{{ t('aiApps.create.supervisorSettings') }}</span>
        <InfoPopover title-key="info.aiAppSections.supervisorLlmConfig.title" description-key="info.aiAppSections.supervisorLlmConfig.description" />
      </div>
      <USeparator />
    </div>

    <LangGraphSupervisorParallelToolsCard class="w-full min-w-0" />

    <USeparator :label="t('aiApps.supervisor.nodeOverrides')" />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
      <LangGraphSupervisorNodeOverrideCard v-for="key in SUPERVISOR_NODE_KEYS" :key="key" :node-key="key" :feature-toggle="featureToggleFor(key)" />
    </div>
  </div>
</template>
