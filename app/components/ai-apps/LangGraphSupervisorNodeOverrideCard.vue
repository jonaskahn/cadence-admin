<script lang="ts" setup>
import type { SupervisorNodeKey } from '~/composables/langgraphOrchestratorConfig/nodeKeys'

const props = defineProps<{
  nodeKey: SupervisorNodeKey
  /** When set, header shows a switch bound to the matching mode flag; fields are disabled when off. */
  featureToggle?: 'llm_validation' | 'clarification_intent'
}>()

const { t } = useI18n()

const orchestratorConfig = inject<ReturnType<typeof useLangGraphOrchestratorConfig>>('langGraphOrchestratorConfig')
if (!orchestratorConfig) {
  throw new Error('LangGraphSupervisorNodeOverrideCard must be used inside LangGraphAiAppConfigProvider')
}

const { modeConfig, NODE_LABELS } = orchestratorConfig

const fieldsDisabled = computed(() => {
  if (props.featureToggle === 'llm_validation') return !modeConfig.enabled_llm_validation
  if (props.featureToggle === 'clarification_intent') return !modeConfig.enabled_clarification_intent
  return false
})

const switchAriaLabel = computed(() => {
  const title = NODE_LABELS[props.nodeKey]
  if (props.featureToggle === 'llm_validation') {
    return `${title}: ${t('aiApps.supervisor.llmValidation')}. ${t('aiApps.featureCards.toggleFeature')}`
  }
  if (props.featureToggle === 'clarification_intent') {
    return `${title}: ${t('aiApps.supervisor.clarificationIntent')}. ${t('aiApps.featureCards.toggleFeature')}`
  }
  return title
})
</script>

<template>
  <UCard variant="soft" class="h-full min-w-0">
    <template #header>
      <div class="flex w-full min-w-0 items-center justify-between gap-2">
        <span class="truncate font-semibold">{{ NODE_LABELS[nodeKey] }}</span>
        <USwitch
          v-if="featureToggle === 'llm_validation'"
          v-model="modeConfig.enabled_llm_validation"
          :aria-label="switchAriaLabel"
          class="shrink-0"
        />
        <USwitch
          v-else-if="featureToggle === 'clarification_intent'"
          v-model="modeConfig.enabled_clarification_intent"
          :aria-label="switchAriaLabel"
          class="shrink-0"
        />
      </div>
    </template>
    <LangGraphSupervisorNodeFields :node-key="nodeKey" :fields-disabled="fieldsDisabled" />
  </UCard>
</template>
