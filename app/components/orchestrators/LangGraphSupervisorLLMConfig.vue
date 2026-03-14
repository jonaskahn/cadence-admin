<script lang="ts" setup>
const supervisor = inject<ReturnType<typeof useLangGraphSupervisor>>('langGraphSupervisor')
if (!supervisor) throw new Error('LangGraphSupervisorLLMConfig must be used inside LangGraphSupervisorProvider')

const { t } = useI18n()
const { disabled } = defineProps<{ disabled?: boolean }>()
</script>

<template>
  <div v-if="supervisor" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <UCheckbox v-model="supervisor.modeConfig.enabled_parallel_tool_calls" :disabled="disabled" :label="t('langGraphSupervisor.parallelToolCalls')" />
    <UCheckbox v-model="supervisor.modeConfig.enabled_llm_validation" :disabled="disabled" :label="t('langGraphSupervisor.useLlmValidation')" />
  </div>
</template>
