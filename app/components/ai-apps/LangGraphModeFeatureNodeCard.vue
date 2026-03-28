<script lang="ts" setup>
import { unref } from 'vue'

import { INHERIT_TOP_LLM_SELECT_VALUE } from '~/composables/useLangGraphOrchestratorConfig'

const props = withDefaults(
  defineProps<{
    feature: 'suggestion' | 'autocompact'
    /** When true, the enable switch is not shown (controlled by parent card header). */
    hideHeaderSwitch?: boolean
  }>(),
  {
    hideHeaderSwitch: false
  }
)

const { t } = useI18n()

const orchestratorConfig = inject<ReturnType<typeof useLangGraphOrchestratorConfig>>('langGraphOrchestratorConfig')
if (!orchestratorConfig) {
  throw new Error('LangGraphModeFeatureNodeCard must be used inside LangGraphAiAppConfigProvider')
}

const { modeConfig, suggestionNode, autocompactNode } = orchestratorConfig

const node = computed(() => (props.feature === 'suggestion' ? suggestionNode : autocompactNode))

const manualKey = computed(() => (props.feature === 'suggestion' ? 'suggestion' : 'autocompact'))

const manualForFeature = computed({
  get: () => orchestratorConfig.nodeModelManual[manualKey.value],
  set: (v: boolean) => {
    orchestratorConfig.nodeModelManual[manualKey.value] = v
  }
})

const featureEnabled = computed({
  get: () => (props.feature === 'suggestion' ? modeConfig.enabled_suggestion : modeConfig.enabled_auto_compact),
  set: (v: boolean) => {
    if (props.feature === 'suggestion') {
      modeConfig.enabled_suggestion = v
    } else {
      modeConfig.enabled_auto_compact = v
    }
  }
})

const fieldsDisabled = computed(() => !featureEnabled.value)

const promptKey = computed(() => (props.feature === 'suggestion' ? 'suggestion_node' : 'autocompact'))

const nodeLlmItems = computed(() => [
  { label: t('langGraphSupervisor.nodeUseAppDefaultLlm'), value: INHERIT_TOP_LLM_SELECT_VALUE },
  ...orchestratorConfig.llmConfigOptions.value
])

const nodeLlmSelectModel = computed({
  get: () => node.value.llm_config_id || INHERIT_TOP_LLM_SELECT_VALUE,
  set: (v: string) => {
    node.value.llm_config_id = v === INHERIT_TOP_LLM_SELECT_VALUE ? '' : v
  }
})

const effectiveConfigId = computed(() => {
  const n = node.value
  const id = n.llm_config_id || orchestratorConfig.resolvedDefaultLlmConfigId.value
  return id || undefined
})

const modelOptionsForFeature = computed(() => orchestratorConfig.modelOptionsFor(effectiveConfigId.value))

const modelPlaceholder = computed(() => {
  const n = node.value
  if (n.llm_config_id || n.model_name?.trim()) return undefined
  return orchestratorConfig.resolvedDefaultModelName.value || t('langGraphSupervisor.inheritsFromLlmDefaultShort')
})

const inheritDescription = t('langGraphSupervisor.nodeFieldInheritsFromLlmSection')

const llmConfigsLoadingBool = computed(() => unref(orchestratorConfig.llmConfigsLoading))

function numericPlaceholder(val: number | null | undefined): string | undefined {
  if (val != null && !Number.isNaN(Number(val)))
    return t('langGraphSupervisor.nodeNumericPlaceholder', { value: String(val) })
  return undefined
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="!hideHeaderSwitch" class="flex items-center gap-2">
      <USwitch
        v-model="featureEnabled"
        :aria-label="
          feature === 'suggestion'
            ? t('aiApps.featureCards.followUpSuggestions')
            : t('aiApps.featureCards.autoCompactMessage')
        "
      />
      <span class="text-dimmed text-sm">{{ t('aiApps.featureCards.enable') }}</span>
    </div>

    <div class="grid grid-cols-1 gap-3">
      <UFormField :label="t('settings.defaultLlmConfig')">
        <USelect
          v-model="nodeLlmSelectModel"
          :items="nodeLlmItems"
          :disabled="fieldsDisabled"
          class="w-full"
          label-key="label"
          value-key="value"
        />
      </UFormField>
      <UFormField :description="inheritDescription">
        <template #label>
          <div class="flex w-full min-w-0 items-center justify-between gap-2">
            <span class="truncate">{{ t('settings.defaultModelName') }}</span>
            <LlmModelNameLabelActions
              v-model:manual="manualForFeature"
              :options="modelOptionsForFeature"
              :disabled="fieldsDisabled"
              :model-name="node.model_name"
            />
          </div>
        </template>
        <LlmModelNameField
          v-model="node.model_name"
          v-model:manual="manualForFeature"
          :options="modelOptionsForFeature"
          :loading="llmConfigsLoadingBool"
          :disabled="fieldsDisabled"
          :placeholder="modelPlaceholder"
          :select-placeholder="t('langGraphSupervisor.placeholderSelectModel')"
        />
      </UFormField>
      <LangGraphPromptOverrideField v-model="node.prompt_override" :prompt-key="promptKey" :disabled="fieldsDisabled" />
      <UFormField
        :label="t('settings.defaultTemperature')"
        :description="node.temperature === null ? inheritDescription : undefined"
      >
        <LlmTemperatureField
          v-model="node.temperature"
          nullable
          :null-option-label="t('langGraphSupervisor.inheritsFromLlmDefaultShort')"
          :disabled="fieldsDisabled"
        />
      </UFormField>
      <UFormField
        :label="t('settings.defaultMaxTokens')"
        :description="node.max_tokens === null ? inheritDescription : undefined"
      >
        <UInput
          v-model.number="node.max_tokens"
          type="number"
          :disabled="fieldsDisabled"
          class="w-full"
          :placeholder="
            node.max_tokens === null ? numericPlaceholder(unref(orchestratorConfig.defaultMaxTokens)) : undefined
          "
        />
      </UFormField>
      <UFormField
        :label="t('aiApps.supervisor.nodeExecutionTimeout')"
        :description="node.timeout === null ? inheritDescription : undefined"
      >
        <UInput
          v-model.number="node.timeout"
          type="number"
          :disabled="fieldsDisabled"
          class="w-full"
          :placeholder="
            node.timeout === null ? numericPlaceholder(orchestratorConfig.modeConfig.node_execution_timeout) : undefined
          "
        />
      </UFormField>
    </div>
  </div>
</template>
