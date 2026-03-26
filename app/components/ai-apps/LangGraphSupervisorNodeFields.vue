<script lang="ts" setup>
import { unref } from 'vue'
import { INHERIT_TOP_LLM_SELECT_VALUE, type NodeKey } from '~/composables/useLangGraphOrchestratorConfig'

const props = defineProps<{
  nodeKey: NodeKey
  /** When true, all inputs are disabled (e.g. feature off for validation/clarifier). */
  fieldsDisabled?: boolean
}>()

const { t } = useI18n()

const orchestratorConfig = inject<ReturnType<typeof useLangGraphOrchestratorConfig>>('langGraphOrchestratorConfig')
if (!orchestratorConfig) {
  throw new Error('LangGraphSupervisorNodeFields must be used inside LangGraphAiAppConfigProvider')
}

const disabled = computed(() => props.fieldsDisabled ?? false)

const node = computed(() => orchestratorConfig.nodeConfigs[props.nodeKey])

const nodeLlmItems = computed(() => [
  { label: t('langGraphSupervisor.nodeUseAppDefaultLlm'), value: INHERIT_TOP_LLM_SELECT_VALUE },
  ...orchestratorConfig.llmConfigOptions.value
])

const nodeLlmSelectModel = computed({
  get: () => node.value?.llm_config_id || INHERIT_TOP_LLM_SELECT_VALUE,
  set: (v: string) => {
    const n = node.value
    if (!n) return
    n.llm_config_id = v === INHERIT_TOP_LLM_SELECT_VALUE ? '' : v
  }
})

const effectiveConfigId = computed(() => {
  const n = node.value
  if (!n) return undefined
  const id = n.llm_config_id || orchestratorConfig.resolvedDefaultLlmConfigId.value
  return id || undefined
})

const modelOptionsForNode = computed(() => orchestratorConfig.modelOptionsFor(effectiveConfigId.value))

const manualForNode = computed({
  get: () => orchestratorConfig.nodeModelManual[props.nodeKey],
  set: (v: boolean) => {
    orchestratorConfig.nodeModelManual[props.nodeKey] = v
  }
})

const modelPlaceholder = computed(() => {
  const n = node.value
  if (!n) return undefined
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
  <div v-if="node" class="grid grid-cols-1 gap-3">
    <UFormField :label="t('settings.defaultLlmConfig')">
      <USelect
        v-model="nodeLlmSelectModel"
        :items="nodeLlmItems"
        :disabled="disabled"
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
            v-model:manual="manualForNode"
            :options="modelOptionsForNode"
            :disabled="disabled"
            :model-name="node.model_name"
          />
        </div>
      </template>
      <LlmModelNameField
        v-model="node.model_name"
        v-model:manual="manualForNode"
        :options="modelOptionsForNode"
        :loading="llmConfigsLoadingBool"
        :disabled="disabled"
        :placeholder="modelPlaceholder"
        :select-placeholder="t('langGraphSupervisor.placeholderSelectModel')"
      />
    </UFormField>
    <LangGraphPromptOverrideField v-model="node.prompt_override" :prompt-key="nodeKey" :disabled="disabled" />
    <UFormField
      :label="t('settings.defaultTemperature')"
      :description="node.temperature === null ? inheritDescription : undefined"
    >
      <LlmTemperatureField
        v-model="node.temperature"
        nullable
        :null-option-label="t('langGraphSupervisor.inheritsFromLlmDefaultShort')"
        :disabled="disabled"
      />
    </UFormField>
    <UFormField
      :label="t('settings.defaultMaxTokens')"
      :description="node.max_tokens === null ? inheritDescription : undefined"
    >
      <UInputNumber
        v-model="node.max_tokens"
        :placeholder="
          node.max_tokens === null ? numericPlaceholder(unref(orchestratorConfig.defaultMaxTokens)) : undefined
        "
        :disabled="disabled"
        orientation="vertical"
        :min="512"
        :max="4096"
        :step="512"
        class="w-full"
      />
    </UFormField>
    <UFormField
      :label="t('aiApps.supervisor.nodeExecutionTimeout')"
      :description="node.timeout === null ? inheritDescription : undefined"
    >
      <UInput
        v-model.number="node.timeout"
        type="number"
        :disabled="disabled"
        class="w-full"
        :placeholder="
          node.timeout === null ? numericPlaceholder(unref(orchestratorConfig.orgDefaultTimeout)) : undefined
        "
      />
    </UFormField>
  </div>
</template>
