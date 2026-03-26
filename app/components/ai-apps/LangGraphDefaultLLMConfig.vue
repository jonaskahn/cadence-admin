<script lang="ts" setup>
const { t } = useI18n()
const orchestratorConfig = inject<ReturnType<typeof useLangGraphOrchestratorConfig>>('langGraphOrchestratorConfig')
if (!orchestratorConfig) {
  throw new Error('LangGraphDefaultLLMConfig must be used inside LangGraphAiAppConfigProvider')
}

const {
  defaultLlmConfigId,
  llmConfigOptions,
  llmConfigsLoading,
  defaultModelName,
  defaultTemperature,
  defaultMaxTokens,
  resolvedDefaultModelName,
  defaultModelManual,
  defaultModelOptions,
  requireDefaultLlm
} = toRefs(orchestratorConfig)

const defaultModelStr = computed({
  get: () => defaultModelName.value ?? '',
  set: (v: string) => {
    defaultModelName.value = v || undefined
  }
})

const modelPlaceholder = computed(() => {
  if (defaultModelName.value?.trim()) return undefined
  return resolvedDefaultModelName.value || t('langGraphSupervisor.defaultModelPlaceholderInherit')
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <UFormField
      :label="t('aiApps.supervisor.defaultLlmConfig')"
      name="default_llm_config_id"
      :required="requireDefaultLlm"
    >
      <USelect
        v-model="defaultLlmConfigId"
        :items="llmConfigOptions"
        :loading="llmConfigsLoading"
        class="w-full"
        clearable
        :placeholder="t('langGraphSupervisor.defaultLlmSelectPlaceholderOrg')"
        label-key="label"
        value-key="value"
      />
    </UFormField>
    <UFormField
      name="default_model_name"
      :description="t('langGraphSupervisor.nodeFieldInheritsFromLlmSection')"
      :required="false"
    >
      <template #label>
        <div class="flex w-full min-w-0 flex-nowrap items-center justify-between gap-2">
          <div class="flex min-w-0 flex-nowrap items-center gap-1">
            <span class="truncate">{{ t('aiApps.supervisor.defaultModelName') }}</span>
            <span v-if="requireDefaultLlm" class="text-error shrink-0 text-sm leading-none" aria-hidden="true">
              *
            </span>
          </div>
          <LlmModelNameLabelActions
            v-model:manual="defaultModelManual"
            class="shrink-0"
            :options="defaultModelOptions"
            :model-name="defaultModelStr"
          />
        </div>
      </template>
      <LlmModelNameField
        v-model="defaultModelStr"
        v-model:manual="defaultModelManual"
        :required="requireDefaultLlm"
        :options="defaultModelOptions"
        :loading="llmConfigsLoading"
        :placeholder="modelPlaceholder"
        :select-placeholder="t('langGraphSupervisor.placeholderSelectModel')"
      />
    </UFormField>
    <UFormField
      :description="t('langGraphSupervisor.defaultTemperatureDescription')"
      :label="t('aiApps.supervisor.defaultTemperature')"
      name="default_temperature"
    >
      <LlmTemperatureField v-model="defaultTemperature" />
    </UFormField>
    <UFormField :label="t('aiApps.supervisor.defaultMaxTokens')" name="default_max_tokens">
      <UInputNumber
        v-model="defaultMaxTokens"
        orientation="vertical"
        :min="512"
        :max="4096"
        :step="512"
        class="w-full"
      />
    </UFormField>
  </div>
</template>
