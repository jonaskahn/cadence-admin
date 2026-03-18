<script setup lang="ts">
const supervisor = inject<ReturnType<typeof useLangGraphSupervisor>>('langGraphSupervisor')
if (!supervisor) throw new Error('LLMContextSettings must be used inside LangGraphSupervisorProvider')

const { t } = useI18n()
const { disabled } = defineProps<{ disabled?: boolean }>()

function toggleAutocompactModelManual() {
  supervisor.nodeModelManual['autocompact'] = !supervisor.nodeModelManual['autocompact']
  supervisor.autocompactNode.model_name = ''
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-1 gap-4">
      <div>
        <UFormField :description="t('langGraphSupervisor.maxMessageContextWindowDescription')" :label="t('langGraphSupervisor.maxMessageContextWindow')">
          <UInput v-model.number="supervisor.modeConfig.message_context_window" :disabled="disabled" :max="50" :min="5" class="w-full" type="number" />
        </UFormField>
      </div>
      <div>
        <UFormField :description="t('langGraphSupervisor.maxTokenContextWindowDescription')" :label="t('langGraphSupervisor.maxTokenContextWindow')">
          <UInput v-model.number="supervisor.modeConfig.max_context_window" :disabled="disabled" :max="32000" :min="4096" class="w-full" type="number" />
        </UFormField>
      </div>
      <div>
        <UFormField :description="t('langGraphSupervisor.nodeExecutionTimeoutDescription')" :label="t('langGraphSupervisor.nodeExecutionTimeout')">
          <UInput v-model.number="supervisor.modeConfig.node_execution_timeout" :disabled="disabled" :min="5" class="w-full" type="number" />
        </UFormField>
      </div>
    </div>
    <UCheckbox v-model="supervisor.modeConfig.enabled_suggestion" :disabled="disabled" :label="t('langGraphSupervisor.enabledSuggestion')" />
    <UCheckbox v-model="supervisor.modeConfig.enabled_auto_compact" :disabled="disabled" :label="t('langGraphSupervisor.autoCompactMessages')" />
    <div v-if="supervisor.modeConfig.enabled_auto_compact" class="grid grid-cols-1 gap-4">
      <div>
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
      </div>
      <div>
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
              @click="toggleAutocompactModelManual"
            />
          </div>
        </UFormField>
      </div>
    </div>
  </div>
</template>
