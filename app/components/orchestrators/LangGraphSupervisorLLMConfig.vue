<script setup lang="ts">
const supervisor = inject<ReturnType<typeof useLangGraphSupervisor>>('langGraphSupervisor')
if (!supervisor) throw new Error('LangGraphSupervisorLLMConfig must be used inside LangGraphSupervisorProvider')

const { t } = useI18n()
const { disabled } = defineProps<{ disabled?: boolean }>()
</script>

<template>
  <div class="flex flex-col gap-4">
    <UFormField :description="t('langGraphSupervisor.maxAgentHopsDescription')" :label="t('langGraphSupervisor.maxAgentHops')">
      <UInput v-model.number="supervisor.modeConfig.max_agent_hops" :disabled="disabled" :max="50" :min="5" class="w-full" type="number" />
    </UFormField>

    <div class="flex items-center gap-2">
      <USwitch v-model="supervisor.modeConfig.enabled_parallel_tool_calls" :disabled="disabled" />
      <span class="text-sm">{{ t('langGraphSupervisor.parallelToolCalls') }}</span>
    </div>

    <div class="flex items-center gap-2">
      <USwitch v-model="supervisor.modeConfig.enabled_llm_validation" :disabled="disabled" />
      <span class="text-sm">{{ t('langGraphSupervisor.useLlmValidation') }}</span>
    </div>

    <div class="flex items-center gap-2">
      <USwitch v-model="supervisor.modeConfig.enabled_clarification_intent" :disabled="disabled" />
      <span class="text-sm">{{ t('langGraphSupervisor.useClarificationIntent') }}</span>
    </div>
  </div>
</template>
