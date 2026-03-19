<script setup lang="ts">
const supervisor = inject<ReturnType<typeof useLangGraphSupervisor>>('langGraphSupervisor')
if (!supervisor) throw new Error('LLMContextSettings must be used inside LangGraphSupervisorProvider')

const { t } = useI18n()
const { disabled } = defineProps<{ disabled?: boolean }>()

function toggleAutocompactModelManual() {
  supervisor.nodeModelManual['autocompact'] = !supervisor.nodeModelManual['autocompact']
  supervisor.autocompactNode.model_name = ''
}

function toggleSuggestionModelManual() {
  supervisor.nodeModelManual['suggestion'] = !supervisor.nodeModelManual['suggestion']
  supervisor.suggestionNode.model_name = ''
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
    <div class="flex items-center gap-2">
      <USwitch v-model="supervisor.modeConfig.enabled_suggestion" :disabled="disabled" />
      <span class="text-sm">{{ t('langGraphSupervisor.enabledSuggestion') }}</span>
    </div>
    <div v-if="supervisor.modeConfig.enabled_suggestion" class="flex flex-col flex-col-1 gap-4">
      <div>
        <UFormField :description="t('langGraphSupervisor.suggestionLlmConfigDescription')" :label="t('langGraphSupervisor.suggestionLlmConfig')">
          <USelect
            v-model="supervisor.suggestionNode.llm_config_id"
            :disabled="disabled"
            :items="supervisor.llmConfigOptions"
            :loading="supervisor.llmConfigsLoading"
            class="w-full"
            :placeholder="t('langGraphSupervisor.placeholderUseDefault')"
          />
        </UFormField>
      </div>
      <div>
        <UFormField :description="t('langGraphSupervisor.suggestionModelDescription')" :label="t('langGraphSupervisor.suggestionModel')">
          <div class="flex gap-2 items-center w-full">
            <UInput
              v-if="supervisor.nodeModelManual['suggestion']"
              v-model="supervisor.suggestionNode.model_name"
              :disabled="disabled"
              class="flex-1"
              :placeholder="t('settings.modelPlaceholder')"
            />
            <USelect
              v-else
              v-model="supervisor.suggestionNode.model_name"
              :disabled="disabled"
              :items="supervisor.modelOptionsFor(supervisor.suggestionNode.llm_config_id || supervisor.defaultLlmConfigId)"
              class="flex-1"
              :placeholder="t('langGraphSupervisor.placeholderUseDefaultModel')"
            />
            <UButton
              :icon="supervisor.nodeModelManual['suggestion'] ? 'i-lucide-list' : 'i-lucide-pencil'"
              :title="supervisor.nodeModelManual['suggestion'] ? t('settings.selectFromList') : t('settings.enterManually')"
              @click="toggleSuggestionModelManual"
            />
          </div>
        </UFormField>
      </div>
      <div>
        <UFormField :description="t('langGraphSupervisor.temperatureDescription')" :label="t('langGraphSupervisor.temperature')">
          <UInput
            v-model.number="supervisor.suggestionNode.temperature"
            :disabled="disabled"
            :max="2"
            :min="0"
            :step="0.1"
            class="w-full"
            :placeholder="t('langGraphSupervisor.placeholderDefaultFromInstance')"
            type="number"
          />
        </UFormField>
      </div>
      <div>
        <UFormField :description="t('langGraphSupervisor.maxTokensDescription')" :label="t('langGraphSupervisor.maxTokens')">
          <UInput
            v-model.number="supervisor.suggestionNode.max_tokens"
            :disabled="disabled"
            :min="256"
            class="w-full"
            :placeholder="t('langGraphSupervisor.placeholderDefaultFromInstance')"
            type="number"
          />
        </UFormField>
      </div>
      <div>
        <UFormField :description="t('langGraphSupervisor.timeoutDescription')" :label="t('langGraphSupervisor.timeout')">
          <UInput
            v-model.number="supervisor.suggestionNode.timeout"
            :disabled="disabled"
            :min="1"
            class="w-full"
            :placeholder="t('langGraphSupervisor.placeholderUseGlobalTimeout')"
            type="number"
          />
        </UFormField>
      </div>
      <div class="sm:col-span-2">
        <UFormField :description="t('langGraphSupervisor.promptOverrideDescription')" :label="t('langGraphSupervisor.promptOverride')">
          <UTextarea
            v-model="supervisor.suggestionNode.prompt_override"
            :disabled="disabled"
            :rows="4"
            class="w-full font-mono text-xs"
            :placeholder="t('langGraphSupervisor.placeholderEmptyPrompt')"
          />
        </UFormField>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <USwitch v-model="supervisor.modeConfig.enabled_auto_compact" :disabled="disabled" />
      <span class="text-sm">{{ t('langGraphSupervisor.autoCompactMessages') }}</span>
    </div>
    <div v-if="supervisor.modeConfig.enabled_auto_compact" class="flex flex-col flex-col-1 gap-4">
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
      <UFormField :description="t('langGraphSupervisor.temperatureDescription')" :label="t('langGraphSupervisor.temperature')">
        <UInput
          v-model.number="supervisor.autocompactNode.temperature"
          :disabled="disabled"
          :max="2"
          :min="0"
          :step="0.1"
          class="w-full"
          :placeholder="t('langGraphSupervisor.placeholderDefaultFromInstance')"
          type="number"
        />
      </UFormField>
      <UFormField :description="t('langGraphSupervisor.maxTokensDescription')" :label="t('langGraphSupervisor.maxTokens')">
        <UInput
          v-model.number="supervisor.autocompactNode.max_tokens"
          :disabled="disabled"
          :min="256"
          class="w-full"
          :placeholder="t('langGraphSupervisor.placeholderDefaultFromInstance')"
          type="number"
        />
      </UFormField>
      <UFormField :description="t('langGraphSupervisor.timeoutDescription')" :label="t('langGraphSupervisor.timeout')">
        <UInput
          v-model.number="supervisor.autocompactNode.timeout"
          :disabled="disabled"
          :min="1"
          class="w-full"
          :placeholder="t('langGraphSupervisor.placeholderUseGlobalTimeout')"
          type="number"
        />
      </UFormField>
      <div class="sm:col-span-2">
        <UFormField :description="t('langGraphSupervisor.promptOverrideDescription')" :label="t('langGraphSupervisor.promptOverride')">
          <UTextarea
            v-model="supervisor.autocompactNode.prompt_override"
            :disabled="disabled"
            :rows="4"
            class="w-full font-mono text-xs"
            :placeholder="t('langGraphSupervisor.placeholderEmptyPrompt')"
          />
        </UFormField>
      </div>
    </div>
  </div>
</template>
