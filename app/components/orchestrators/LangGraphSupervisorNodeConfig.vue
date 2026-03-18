<script lang="ts" setup>
import type { NodeKey } from '~/composables/useLangGraphSupervisor'
import { NODE_KEYS } from '~/composables/useLangGraphSupervisor'

const supervisor = inject<ReturnType<typeof useLangGraphSupervisor>>('langGraphSupervisor')
if (!supervisor) throw new Error('LangGraphSupervisorNodeConfig must be used inside LangGraphSupervisorProvider')

const { t } = useI18n()
const { disabled } = defineProps<{ disabled?: boolean }>()

function nodeLabel(key: NodeKey): string {
  return t(`langGraphSupervisor.nodeLabels.${key}`)
}

function modelDescription(key: NodeKey): string {
  return supervisor.nodeConfigs[key].llm_config_id ? t('langGraphSupervisor.modelNodeConfigDescription') : t('langGraphSupervisor.modelOverrideDescription')
}

function toggleNodeModelManual(key: NodeKey) {
  supervisor.nodeModelManual[key] = !supervisor.nodeModelManual[key]
  supervisor.nodeConfigs[key].model_name = ''
}

function handleToggleNode(key: NodeKey) {
  supervisor.toggleNode(key)
}

function handleToggleShowDefault(key: NodeKey) {
  supervisor.toggleShowDefault(key)
}
</script>

<template>
  <div v-if="supervisor" class="flex flex-col gap-4 min-w-0">
    <div v-for="key in NODE_KEYS" :key="key" class="border border-default rounded-lg overflow-hidden">
      <button
        class="w-full px-4 py-2.5 flex items-center justify-between text-sm bg-elevated/30 hover:bg-elevated/60 transition-colors"
        type="button"
        @click="handleToggleNode(key)"
      >
        <span class="font-medium">{{ nodeLabel(key) }}</span>
        <div class="flex items-center gap-2">
          <span v-if="supervisor.hasNodeOverride(key)" class="text-xs text-primary">{{ t('langGraphSupervisor.overrideSet') }}</span>
          <UIcon :name="supervisor.expandedNodes[key] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4 text-dimmed" />
        </div>
      </button>

      <div v-show="supervisor.expandedNodes[key]" class="p-4 border-t border-default">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField :description="t('langGraphSupervisor.llmConfigOverrideDescription')" :label="t('langGraphSupervisor.llmConfig')">
            <USelect
              v-model="supervisor.nodeConfigs[key].llm_config_id"
              :disabled="disabled"
              :items="supervisor.llmConfigOptions"
              class="w-full"
              :placeholder="t('langGraphSupervisor.placeholderUseDefault')"
            />
          </UFormField>

          <UFormField :description="modelDescription(key)" :label="t('langGraphSupervisor.model')">
            <div class="flex gap-2 items-center w-full">
              <UInput
                v-if="supervisor.nodeModelManual[key]"
                v-model="supervisor.nodeConfigs[key].model_name"
                :disabled="disabled"
                class="flex-1"
                :placeholder="t('settings.modelPlaceholder')"
              />
              <USelect
                v-else
                v-model="supervisor.nodeConfigs[key].model_name"
                :disabled="disabled"
                :items="supervisor.modelOptionsFor(supervisor.nodeConfigs[key].llm_config_id || supervisor.defaultLlmConfigId)"
                class="flex-1"
                :placeholder="t('langGraphSupervisor.placeholderUseDefaultModel')"
              />
              <UButton
                :icon="supervisor.nodeModelManual[key] ? 'i-lucide-list' : 'i-lucide-pencil'"
                :title="supervisor.nodeModelManual[key] ? t('settings.selectFromList') : t('settings.enterManually')"
                color="neutral"
                @click="toggleNodeModelManual(key)"
              />
            </div>
          </UFormField>

          <UFormField :description="t('langGraphSupervisor.temperatureDescription')" :label="t('langGraphSupervisor.temperature')">
            <UInput
              v-model.number="supervisor.nodeConfigs[key].temperature"
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
              v-model.number="supervisor.nodeConfigs[key].max_tokens"
              :disabled="disabled"
              :min="256"
              class="w-full"
              :placeholder="t('langGraphSupervisor.placeholderDefaultFromInstance')"
              type="number"
            />
          </UFormField>
          <UFormField :description="t('langGraphSupervisor.timeoutDescription')" :label="t('langGraphSupervisor.timeout')">
            <UInput
              v-model.number="supervisor.nodeConfigs[key].timeout"
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
                v-model="supervisor.nodeConfigs[key].prompt_override"
                :disabled="disabled"
                :rows="4"
                class="w-full font-mono text-xs"
                :placeholder="t('langGraphSupervisor.placeholderEmptyPrompt')"
              />
              <div class="mt-2">
                <button class="text-xs text-dimmed underline" type="button" @click="handleToggleShowDefault(key)">
                  {{ supervisor.showDefault[key] ? t('langGraphSupervisor.hideDefaultPrompt') : t('langGraphSupervisor.viewDefaultPrompt') }}
                </button>
                <pre v-if="supervisor.showDefault[key]" class="text-xs font-mono bg-elevated/40 rounded p-3 mt-1 whitespace-pre-wrap">{{
                  supervisor.defaultPrompts?.[key]
                }}</pre>
              </div>
            </UFormField>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
