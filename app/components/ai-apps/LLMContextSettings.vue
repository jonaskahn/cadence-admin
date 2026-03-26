<script lang="ts" setup>
const { t } = useI18n()
const orchestratorConfig = inject<ReturnType<typeof useLangGraphOrchestratorConfig>>('langGraphOrchestratorConfig')
if (!orchestratorConfig) {
  throw new Error('LLMContextSettings must be used inside LangGraphAiAppConfigProvider')
}

const modeConfig = orchestratorConfig.modeConfig
</script>

<template>
  <div class="flex flex-col gap-4">
    <UFormField :label="t('aiApps.supervisor.nodeExecutionTimeout')" name="node_execution_timeout">
      <UInput v-model.number="modeConfig.node_execution_timeout" type="number" min="1" class="w-full" />
    </UFormField>
    <UFormField :label="t('aiApps.supervisor.messageContextWindow')" name="message_context_window">
      <UInput v-model.number="modeConfig.message_context_window" type="number" min="1" class="w-full" />
    </UFormField>
    <UFormField :label="t('aiApps.supervisor.maxContextWindow')" name="max_context_window">
      <UInput v-model.number="modeConfig.max_context_window" type="number" min="1" class="w-full" />
    </UFormField>
    <UFormField
      :label="t('aiApps.supervisor.maxAgentHops')"
      :description="t('aiApps.supervisor.maxAgentHopsHelp')"
      name="max_agent_hops"
    >
      <UInput v-model.number="modeConfig.max_agent_hops" type="number" min="1" class="w-full" />
    </UFormField>
    <UFormField
      :label="t('aiApps.supervisor.maxToolRounds')"
      :description="t('aiApps.supervisor.maxToolRoundsHelp')"
      name="max_tool_rounds"
    >
      <UInput v-model.number="modeConfig.max_tool_rounds" type="number" min="1" class="w-full" />
    </UFormField>
  </div>
</template>
