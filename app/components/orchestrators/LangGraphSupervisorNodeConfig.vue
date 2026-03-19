<script lang="ts" setup>
import type { GroundedNodeKey, NodeKey } from '~/composables/useLangGraphSupervisor'
import { NODE_KEYS } from '~/composables/useLangGraphSupervisor'

const supervisor = inject<ReturnType<typeof useLangGraphSupervisor>>('langGraphSupervisor')
if (!supervisor) throw new Error('LangGraphSupervisorNodeConfig must be used inside LangGraphSupervisorProvider')

const { t } = useI18n()
const props = withDefaults(defineProps<{ disabled?: boolean; nodeKeys?: readonly string[] }>(), { nodeKeys: () => NODE_KEYS })

const displayNodeKeys = computed(() =>
  props.nodeKeys.filter((key) => {
    if (key === 'validation_node' && !supervisor.modeConfig.enabled_llm_validation) return false
    if (key === 'clarifier_node' && !supervisor.modeConfig.enabled_clarification_intent) return false
    return true
  })
)

function nodeLabel(key: NodeKey | GroundedNodeKey): string {
  return t(`langGraphSupervisor.nodeLabels.${key}`)
}

function modelDescription(key: NodeKey | GroundedNodeKey): string {
  return supervisor.nodeConfigs[key]?.llm_config_id ? t('langGraphSupervisor.modelNodeConfigDescription') : t('langGraphSupervisor.modelOverrideDescription')
}

function toggleNodeModelManual(key: NodeKey | GroundedNodeKey) {
  supervisor.nodeModelManual[key] = !supervisor.nodeModelManual[key]
  supervisor.nodeConfigs[key].model_name = ''
}

function handleToggleNode(key: NodeKey | GroundedNodeKey) {
  supervisor.toggleNode(key)
}

function handleToggleShowDefault(key: NodeKey | GroundedNodeKey) {
  supervisor.toggleShowDefault(key)
}
</script>

<template>
  <div v-if="supervisor" class="flex flex-col gap-4 min-w-0">
    <div v-for="key in displayNodeKeys" :key="key" class="border border-default rounded-lg overflow-hidden">
      <UButton
        class="w-full justify-between px-4 py-2.5 text-sm bg-elevated/30 hover:bg-elevated/60 transition-colors rounded-none"
        color="neutral"
        variant="ghost"
        @click="handleToggleNode(key)"
      >
        <span class="font-medium">{{ nodeLabel(key) }}</span>
        <div class="flex items-center gap-2">
          <span v-if="supervisor.hasNodeOverride(key)" class="text-xs text-primary">{{ t('langGraphSupervisor.overrideSet') }}</span>
          <UIcon :name="supervisor.expandedNodes[key] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4 text-dimmed" />
        </div>
      </UButton>

      <div v-show="supervisor.expandedNodes[key]" class="p-4 border-t border-default">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField :description="t('langGraphSupervisor.llmConfigOverrideDescription')" :label="t('langGraphSupervisor.llmConfig')">
            <USelect
              v-model="supervisor.nodeConfigs[key].llm_config_id"
              :disabled="props.disabled"
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
                :disabled="props.disabled"
                class="flex-1"
                :placeholder="t('settings.modelPlaceholder')"
              />
              <USelect
                v-else
                v-model="supervisor.nodeConfigs[key].model_name"
                :disabled="props.disabled"
                :items="supervisor.modelOptionsFor(supervisor.nodeConfigs[key].llm_config_id || supervisor.defaultLlmConfigId)"
                class="flex-1"
                :placeholder="t('langGraphSupervisor.placeholderUseDefaultModel')"
              />
              <UButton
                :icon="supervisor.nodeModelManual[key] ? 'i-lucide-list' : 'i-lucide-pencil'"
                :title="supervisor.nodeModelManual[key] ? t('settings.selectFromList') : t('settings.enterManually')"
                @click="toggleNodeModelManual(key)"
              />
            </div>
          </UFormField>

          <UFormField :description="t('langGraphSupervisor.temperatureDescription')" :label="t('langGraphSupervisor.temperature')">
            <UInput
              v-model.number="supervisor.nodeConfigs[key].temperature"
              :disabled="props.disabled"
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
              :disabled="props.disabled"
              :min="256"
              class="w-full"
              :placeholder="t('langGraphSupervisor.placeholderDefaultFromInstance')"
              type="number"
            />
          </UFormField>
          <UFormField :description="t('langGraphSupervisor.timeoutDescription')" :label="t('langGraphSupervisor.timeout')">
            <UInput
              v-model.number="supervisor.nodeConfigs[key].timeout"
              :disabled="props.disabled"
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
                :disabled="props.disabled"
                :rows="4"
                class="w-full font-mono text-xs"
                :placeholder="t('langGraphSupervisor.placeholderEmptyPrompt')"
              />
              <div class="mt-2">
                <UButton class="text-dimmed underline p-0 h-auto" color="neutral" size="xs" variant="link" @click="handleToggleShowDefault(key)">
                  {{ supervisor.showDefault[key] ? t('langGraphSupervisor.hideDefaultPrompt') : t('langGraphSupervisor.viewDefaultPrompt') }}
                </UButton>
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
