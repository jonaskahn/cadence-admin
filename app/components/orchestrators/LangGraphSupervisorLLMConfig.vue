<script lang="ts" setup>
const supervisor = inject<ReturnType<typeof useLangGraphSupervisor>>('langGraphSupervisor')
if (!supervisor) throw new Error('LangGraphSupervisorLLMConfig must be used inside LangGraphSupervisorProvider')

const { t } = useI18n()
const { disabled } = defineProps<{ disabled?: boolean }>()

const llmConfigPlaceholder = computed(() => {
  if (unref(supervisor.llmConfigsLoading)) return t('langGraphSupervisor.placeholderLoading')
  const opts = unref(supervisor.llmConfigOptions)
  if (!opts?.length) return t('langGraphSupervisor.placeholderNoConfigs')
  return t('langGraphSupervisor.placeholderSelectConfig')
})
</script>

<template>
  <div v-if="supervisor" class="flex flex-col gap-4 min-w-0">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UFormField :description="t('langGraphSupervisor.defaultLlmConfigDescription')" :label="t('langGraphSupervisor.defaultLlmConfig')" required>
        <USelect
          v-model="supervisor.defaultLlmConfigId"
          :disabled="disabled || supervisor.llmConfigsLoading || supervisor.llmConfigOptions.length === 0"
          :items="supervisor.llmConfigOptions"
          :loading="supervisor.llmConfigsLoading"
          :placeholder="llmConfigPlaceholder"
          class="w-full"
          label-key="label"
          value-key="value"
        />
      </UFormField>

      <UFormField :description="t('langGraphSupervisor.defaultModelDescription')" :label="t('langGraphSupervisor.defaultModel')" required>
        <div class="flex gap-2 items-center w-full">
          <UInput
            v-if="supervisor.defaultModelManual"
            v-model="supervisor.defaultModelName"
            :disabled="disabled"
            class="flex-1"
            :placeholder="t('settings.modelPlaceholder')"
          />
          <USelect
            v-else
            v-model="supervisor.defaultModelName"
            :disabled="disabled"
            :items="supervisor.defaultModelOptions"
            class="flex-1"
            label-key="label"
            :placeholder="t('langGraphSupervisor.placeholderSelectModel')"
            value-key="value"
          />
          <UButton
            :icon="supervisor.defaultModelManual ? 'i-lucide-list' : 'i-lucide-pencil'"
            :title="supervisor.defaultModelManual ? t('settings.selectFromList') : t('settings.enterManually')"
            color="neutral"
            size="sm"
            variant="outline"
            @click="supervisor.defaultModelManual = !supervisor.defaultModelManual; supervisor.defaultModelName = undefined"
          />
        </div>
      </UFormField>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
      <UFormField :description="t('langGraphSupervisor.defaultTemperatureDescription')" :label="t('langGraphSupervisor.defaultTemperature')" required>
        <UInput
          v-model.number="supervisor.defaultTemperature"
          :disabled="disabled"
          :max="2"
          :min="0"
          :step="0.1"
          class="w-full"
          :placeholder="t('langGraphSupervisor.placeholderSystemDefault')"
          type="number"
        />
      </UFormField>
      <UFormField :description="t('langGraphSupervisor.defaultMaxTokensDescription')" :label="t('langGraphSupervisor.defaultMaxTokens')" required>
        <UInput
          v-model.number="supervisor.defaultMaxTokens"
          :disabled="disabled"
          :max="4096"
          :min="1024"
          class="w-full"
          :placeholder="t('langGraphSupervisor.placeholderSystemDefault')"
          type="number"
        />
      </UFormField>
      <UFormField :description="t('langGraphSupervisor.nodeExecutionTimeoutDescription')" :label="t('langGraphSupervisor.nodeExecutionTimeout')">
        <UInput v-model.number="supervisor.modeConfig.node_execution_timeout" :disabled="disabled" :min="5" class="w-full" type="number" />
      </UFormField>
      <UFormField :description="t('langGraphSupervisor.maxAgentHopsDescription')" :label="t('langGraphSupervisor.maxAgentHops')">
        <UInput v-model.number="supervisor.modeConfig.max_agent_hops" :disabled="disabled" :max="50" :min="5" class="w-full" type="number" />
      </UFormField>
      <UFormField :description="t('langGraphSupervisor.maxMessageContextWindowDescription')" :label="t('langGraphSupervisor.maxMessageContextWindow')">
        <UInput v-model.number="supervisor.modeConfig.message_context_window" :disabled="disabled" :max="50" :min="5" class="w-full" type="number" />
      </UFormField>
      <UFormField :description="t('langGraphSupervisor.maxTokenContextWindowDescription')" :label="t('langGraphSupervisor.maxTokenContextWindow')">
        <UInput v-model.number="supervisor.modeConfig.max_context_window" :disabled="disabled" :max="32000" :min="4096" class="w-full" type="number" />
      </UFormField>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
      <UCheckbox v-model="supervisor.modeConfig.enabled_parallel_tool_calls" :disabled="disabled" :label="t('langGraphSupervisor.parallelToolCalls')" />
      <UCheckbox v-model="supervisor.modeConfig.enabled_llm_validation" :disabled="disabled" :label="t('langGraphSupervisor.useLlmValidation')" />
      <UCheckbox v-model="supervisor.modeConfig.enabled_auto_compact" :disabled="disabled" :label="t('langGraphSupervisor.autoCompactMessages')" />
    </div>

    <div v-if="supervisor.modeConfig.enabled_auto_compact" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UFormField :description="t('langGraphSupervisor.autocompactLlmConfigDescription')" :label="t('langGraphSupervisor.autocompactLlmConfig')">
        <USelect
          v-model="supervisor.autocompactNode.llm_config_id"
          :disabled="disabled"
          :items="supervisor.llmConfigOptions"
          :loading="supervisor.llmConfigsLoading"
          class="w-full"
          :placeholder="t('langGraphSupervisor.placeholderUseDefault')"
        />
      </UFormField>
      <UFormField :description="t('langGraphSupervisor.autocompactModelDescription')" :label="t('langGraphSupervisor.autocompactModel')">
        <div class="flex gap-2 items-center w-full">
          <UInput
            v-if="supervisor.nodeModelManual['autocompact']"
            v-model="supervisor.autocompactNode.model_name"
            :disabled="disabled"
            class="flex-1"
            :placeholder="t('settings.modelPlaceholder')"
          />
          <USelect
            v-else
            v-model="supervisor.autocompactNode.model_name"
            :disabled="disabled"
            :items="supervisor.modelOptionsFor(supervisor.autocompactNode.llm_config_id || supervisor.defaultLlmConfigId)"
            class="flex-1"
            :placeholder="t('langGraphSupervisor.placeholderUseDefaultModel')"
          />
          <UButton
            :icon="supervisor.nodeModelManual['autocompact'] ? 'i-lucide-list' : 'i-lucide-pencil'"
            :title="supervisor.nodeModelManual['autocompact'] ? t('settings.selectFromList') : t('settings.enterManually')"
            color="neutral"
            size="sm"
            variant="outline"
            @click="supervisor.nodeModelManual['autocompact'] = !supervisor.nodeModelManual['autocompact']; supervisor.autocompactNode.model_name = ''"
          />
        </div>
      </UFormField>
    </div>
  </div>
</template>
