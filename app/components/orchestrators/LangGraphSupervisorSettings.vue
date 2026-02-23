<script lang="ts" setup>
import type { LLMConfigResponse, ProviderModelResponse } from '~/types'
import { providerLabel } from '~/utils'

const props = defineProps<{
  orgId: string
  initialValue?: Record<string, unknown>
  disabled?: boolean
  supportedProviders?: string[] | null // null/undefined = all providers allowed
}>()

const { data: llmConfigs, pending: llmConfigsLoading } = useFetch<LLMConfigResponse[]>(() => `/api/orgs/${props.orgId}/llm-configs`)

const llmConfigOptions = computed(() =>
  (llmConfigs.value ?? [])
    .filter((c) => !props.supportedProviders || props.supportedProviders.includes(c.provider))
    .map((c) => ({
      label: `${c.name} (${providerLabel(c.provider)})`,
      value: c.id
    }))
)

const modelsByProvider = ref<Record<string, { label: string; value: string }[]>>({})

function providerOf(configId: string | undefined): string | null {
  if (!configId) return null
  return llmConfigs.value?.find((c) => c.id === configId)?.provider ?? null
}

async function ensureModels(provider: string | null) {
  if (!provider || modelsByProvider.value[provider]) return
  try {
    const models = await $fetch<ProviderModelResponse[]>(`/api/providers/${provider}/models`)
    modelsByProvider.value = {
      ...modelsByProvider.value,
      [provider]: models.map((m) => ({
        label: m.aliases.length ? `${m.display_name} — ${m.model_id} (${m.aliases.join(', ')})` : `${m.display_name} — ${m.model_id}`,
        value: m.model_id
      }))
    }
  } catch {
    modelsByProvider.value = { ...modelsByProvider.value, [provider]: [] }
  }
}

function modelOptionsFor(configId: string | undefined): { label: string; value: string }[] {
  const provider = providerOf(configId) ?? providerOf(defaultLlmConfigId.value)
  return provider ? (modelsByProvider.value[provider] ?? []) : []
}

const defaultModelManual = ref(false)
const nodeModelManual = reactive(
  Object.fromEntries(
    ['classifier_node', 'planner_node', 'synthesizer_node', 'validation_node', 'clarifier_node', 'responder_node', 'error_handler_node', 'autocompact'].map(
      (k) => [k, false]
    )
  ) as Record<string, boolean>
)

const NODE_KEYS = ['classifier_node', 'planner_node', 'synthesizer_node', 'validation_node', 'clarifier_node', 'responder_node', 'error_handler_node'] as const

type NodeKey = (typeof NODE_KEYS)[number]

const NODE_LABELS: Record<NodeKey, string> = {
  classifier_node: 'Router',
  planner_node: 'Planner',
  synthesizer_node: 'Synthesizer',
  validation_node: 'Validation',
  clarifier_node: 'Clarifier',
  responder_node: 'Responder',
  error_handler_node: 'Error Handler'
}

const modeConfigSource = (props.initialValue?.mode_config ?? {}) as Record<string, unknown>

function resolveBoolean(config: Record<string, unknown>, newKey: string, oldKey: string, defaultVal: boolean): boolean {
  if (config[newKey] !== undefined) return Boolean(config[newKey])
  if (config[oldKey] !== undefined) return Boolean(config[oldKey])
  return defaultVal
}

const defaultLlmConfigId = ref<string | undefined>(
  props.initialValue?.default_llm_config_id != null ? String(props.initialValue.default_llm_config_id) : undefined
)

const defaultModelName = ref<string | undefined>(props.initialValue?.default_model_name != null ? String(props.initialValue.default_model_name) : undefined)

watch(defaultLlmConfigId, () => {
  defaultModelName.value = undefined
  defaultModelManual.value = false
})

watch(
  () => props.supportedProviders,
  (allowed) => {
    if (!allowed) return
    if (defaultLlmConfigId.value) {
      const p = providerOf(defaultLlmConfigId.value)
      if (p && !allowed.includes(p)) {
        defaultLlmConfigId.value = undefined
        defaultModelName.value = undefined
      }
    }
    for (const key of NODE_KEYS) {
      const p = providerOf(nodeConfigs[key].llm_config_id)
      if (p && !allowed.includes(p)) nodeConfigs[key].llm_config_id = ''
    }
  }
)

async function syncDefaultModel(id: string | undefined) {
  if (!llmConfigs.value) return
  await ensureModels(providerOf(id))
  defaultModelManual.value = !!(id && !modelOptionsFor(id).length)
}

watch([llmConfigs, defaultLlmConfigId], ([, id]) => syncDefaultModel(id), { immediate: true })

const defaultTemperature = ref<number | null>(props.initialValue?.temperature != null ? Number(props.initialValue.temperature) : 0.2)

const defaultMaxTokens = ref<number | null>(props.initialValue?.max_tokens != null ? Number(props.initialValue.max_tokens) : 2048)

const modeConfig = reactive({
  max_agent_hops: Number(modeConfigSource.max_agent_hops ?? 5),
  node_execution_timeout: Number(modeConfigSource.node_execution_timeout ?? modeConfigSource.supervisor_timeout ?? modeConfigSource.invoke_timeout ?? 60),
  message_context_window: Number(modeConfigSource.message_context_window ?? modeConfigSource.classifier_context_window ?? 5),
  max_context_window: Number(modeConfigSource.max_context_window ?? 16000),
  enabled_parallel_tool_calls: resolveBoolean(modeConfigSource, 'enabled_parallel_tool_calls', 'parallel_tool_calls', true),
  enabled_llm_validation: resolveBoolean(modeConfigSource, 'enabled_llm_validation', 'use_llm_validation', false),
  enabled_auto_compact: resolveBoolean(modeConfigSource, 'enabled_auto_compact', 'autocompact_enabled', false)
})

type NodeState = {
  llm_config_id: string
  model_name: string
  prompt_override: string
  temperature: number | null
  max_tokens: number | null
  timeout: number | null
}

const nodeConfigs = reactive(
  Object.fromEntries(
    NODE_KEYS.map((key) => {
      const src = (modeConfigSource[key] ?? {}) as {
        llm_config_id?: number | null
        model_name?: string | null
        prompt_override?: string | null
        temperature?: number | null
        max_tokens?: number | null
        timeout?: number | null
      }
      return [
        key,
        {
          llm_config_id: src.llm_config_id != null ? String(src.llm_config_id) : '',
          model_name: src.model_name ?? '',
          prompt_override: src.prompt_override ?? '',
          temperature: src.temperature ?? null,
          max_tokens: src.max_tokens ?? null,
          timeout: src.timeout ?? null
        }
      ]
    })
  ) as Record<NodeKey, NodeState>
)

const autocompactSrc = (modeConfigSource.autocompact ?? modeConfigSource.autocompact_node ?? {}) as {
  llm_config_id?: number | null
  model_name?: string | null
}

const autocompactNode = reactive({
  llm_config_id: autocompactSrc.llm_config_id != null ? String(autocompactSrc.llm_config_id) : '',
  model_name: autocompactSrc.model_name ?? ''
})

watch(
  () => autocompactNode.llm_config_id,
  () => {
    autocompactNode.model_name = ''
    nodeModelManual['autocompact'] = false
  }
)

watch(
  [llmConfigs, () => autocompactNode.llm_config_id],
  async () => {
    if (!llmConfigs.value) return
    const p = providerOf(autocompactNode.llm_config_id) ?? providerOf(defaultLlmConfigId.value)
    await ensureModels(p)
    const effectiveId = autocompactNode.llm_config_id || defaultLlmConfigId.value
    if (effectiveId && !modelOptionsFor(effectiveId).length) nodeModelManual['autocompact'] = true
    else nodeModelManual['autocompact'] = false
  },
  { immediate: true }
)

for (const key of NODE_KEYS) {
  watch(
    () => nodeConfigs[key].llm_config_id,
    () => {
      nodeConfigs[key].model_name = ''
      nodeModelManual[key] = false
    }
  )
}

async function syncNodeModels() {
  if (!llmConfigs.value) return
  const providers = new Set<string>()
  for (const key of NODE_KEYS) {
    const p = providerOf(nodeConfigs[key].llm_config_id) ?? providerOf(defaultLlmConfigId.value)
    if (p) providers.add(p)
  }
  await Promise.all([...providers].map((p) => ensureModels(p)))
  for (const key of NODE_KEYS) {
    const effectiveConfigId = nodeConfigs[key].llm_config_id || defaultLlmConfigId.value
    nodeModelManual[key] = !!(effectiveConfigId && !modelOptionsFor(effectiveConfigId).length)
  }
}

watch([llmConfigs, ...NODE_KEYS.map((key) => () => nodeConfigs[key].llm_config_id)], syncNodeModels, { immediate: true })

const expandedNodes = ref<Record<string, boolean>>(Object.fromEntries(NODE_KEYS.map((k) => [k, false])))

const showDefault = ref<Record<string, boolean>>(Object.fromEntries(NODE_KEYS.map((k) => [k, false])))

const defaultPrompts = ref<Record<string, string> | null>(null)

onMounted(async () => {
  const updates: Record<string, boolean> = {}
  for (const key of NODE_KEYS) {
    if (hasNodeOverride(key)) updates[key] = true
  }
  if (Object.keys(updates).length > 0) {
    expandedNodes.value = { ...expandedNodes.value, ...updates }
  }

  try {
    defaultPrompts.value = await $fetch<Record<string, string>>('/api/engine/supervisor/prompts')
  } catch {}
})

function toggleNode(key: NodeKey) {
  expandedNodes.value = { ...expandedNodes.value, [key]: !expandedNodes.value[key] }
}

function toggleShowDefault(key: NodeKey) {
  showDefault.value = { ...showDefault.value, [key]: !showDefault.value[key] }
}

function hasNodeOverride(key: NodeKey): boolean {
  return !!(
    nodeConfigs[key].llm_config_id ||
    nodeConfigs[key].model_name ||
    nodeConfigs[key].prompt_override ||
    nodeConfigs[key].temperature !== null ||
    nodeConfigs[key].max_tokens !== null ||
    nodeConfigs[key].timeout !== null
  )
}

defineExpose({
  isValid: () => !!defaultLlmConfigId.value && !!defaultModelName.value,
  getValue: (): Record<string, unknown> => ({
    default_llm_config_id: defaultLlmConfigId.value ? parseInt(defaultLlmConfigId.value, 10) : undefined,
    default_model_name: defaultModelName.value || undefined,
    default_temperature: defaultTemperature.value,
    default_max_tokens: defaultMaxTokens.value,
    mode_config: {
      max_agent_hops: modeConfig.max_agent_hops,
      node_execution_timeout: modeConfig.node_execution_timeout,
      message_context_window: modeConfig.message_context_window,
      max_context_window: modeConfig.max_context_window,
      enabled_parallel_tool_calls: modeConfig.enabled_parallel_tool_calls,
      enabled_llm_validation: modeConfig.enabled_llm_validation,
      enabled_auto_compact: modeConfig.enabled_auto_compact,
      autocompact: modeConfig.enabled_auto_compact
        ? {
            llm_config_id: autocompactNode.llm_config_id ? parseInt(autocompactNode.llm_config_id, 10) : null,
            model_name: autocompactNode.model_name || null
          }
        : {},
      ...Object.fromEntries(
        NODE_KEYS.map((key) => [
          key,
          {
            llm_config_id: nodeConfigs[key].llm_config_id ? parseInt(nodeConfigs[key].llm_config_id, 10) : null,
            model_name: nodeConfigs[key].model_name || null,
            prompt_override: nodeConfigs[key].prompt_override || null,
            temperature: nodeConfigs[key].temperature,
            max_tokens: nodeConfigs[key].max_tokens,
            timeout: nodeConfigs[key].timeout
          }
        ])
      )
    }
  })
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <UFormField description="LLM config used by all nodes unless overridden per-node" label="Default LLM Config" required>
      <USelect
        v-model="defaultLlmConfigId"
        :disabled="disabled || llmConfigsLoading || llmConfigOptions.length === 0"
        :items="llmConfigOptions"
        :loading="llmConfigsLoading"
        :placeholder="llmConfigsLoading ? 'Loading…' : llmConfigOptions.length === 0 ? 'No LLM configs — add one in Settings first' : 'Select LLM config…'"
        class="w-full"
      />
    </UFormField>

    <UFormField v-if="defaultLlmConfigId" description="Model used by all nodes unless overridden per-node" label="Default Model" required>
      <div class="flex gap-2 items-center w-full">
        <UInput v-if="defaultModelManual" v-model="defaultModelName" :disabled="disabled" class="flex-1" placeholder="e.g. gpt-4o, gemini-2.0-flash" />
        <USelect
          v-else
          v-model="defaultModelName"
          :disabled="disabled"
          :items="modelOptionsFor(defaultLlmConfigId)"
          class="flex-1"
          placeholder="Select model…"
        />
        <UButton
          :icon="defaultModelManual ? 'i-lucide-list' : 'i-lucide-pencil'"
          :title="defaultModelManual ? 'Select from list' : 'Enter manually'"
          color="neutral"
          size="sm"
          variant="ghost"
          @click="defaultModelManual = !defaultModelManual; defaultModelName = undefined"
        />
      </div>
    </UFormField>

    <div class="grid grid-cols-1 gap-4">
      <UFormField description="Default for all nodes (0.0–2.0)" label="Default Temperature" required>
        <UInput
          v-model.number="defaultTemperature"
          :disabled="disabled"
          :max="2"
          :min="0"
          :step="0.1"
          class="w-full"
          placeholder="System default"
          type="number"
        />
      </UFormField>
      <UFormField description="Default max output tokens for all nodes (Min/Max: 1k/4k)" label="Default Max Tokens" required>
        <UInput v-model.number="defaultMaxTokens" :disabled="disabled" :max="4096" :min="1024" class="w-full" placeholder="System default" type="number" />
      </UFormField>
      <UFormField description="Default timeout in seconds for all node LLM/tool calls (answer nodes use 2×)" label="Node Execution Timeout (s)">
        <UInput v-model.number="modeConfig.node_execution_timeout" :disabled="disabled" :min="5" class="w-full" type="number" />
      </UFormField>
      <UFormField description="Max planner iterations before synthesizing (Min/Max: 5/50)" label="Max Agent Hops">
        <UInput v-model.number="modeConfig.max_agent_hops" :disabled="disabled" :max="50" :min="5" class="w-full" type="number" />
      </UFormField>
      <UFormField description="Last N messages sent to orchestrator (Min/Max: 5/50)" label="Max Message Context Window">
        <UInput v-model.number="modeConfig.message_context_window" :disabled="disabled" :max="50" :min="5" class="w-full" type="number" />
      </UFormField>
      <UFormField description="Max tokens in conversation (Min/Max: 4k/32k)" label="Max Token Context Window">
        <UInput v-model.number="modeConfig.max_context_window" :disabled="disabled" :max="32000" :min="4096" class="w-full" type="number" />
      </UFormField>
    </div>

    <div class="flex flex-col gap-3 pt-1">
      <UCheckbox v-model="modeConfig.enabled_parallel_tool_calls" :disabled="disabled" label="Parallel Tool Calls" />
      <UCheckbox v-model="modeConfig.enabled_llm_validation" :disabled="disabled" label="Use LLM Validation" />
      <UCheckbox v-model="modeConfig.enabled_auto_compact" :disabled="disabled" label="Auto Compact Messages" />
    </div>

    <template v-if="modeConfig.enabled_auto_compact">
      <UFormField description="Model used for message compaction" label="LLM Config">
        <USelect
          v-model="autocompactNode.llm_config_id"
          :disabled="disabled"
          :items="llmConfigOptions"
          :loading="llmConfigsLoading"
          class="w-full"
          placeholder="Use default"
        />
      </UFormField>
      <UFormField label="Model">
        <div class="flex gap-2 items-center w-full">
          <UInput
            v-if="nodeModelManual['autocompact']"
            v-model="autocompactNode.model_name"
            :disabled="disabled"
            class="flex-1"
            placeholder="e.g. gpt-4o, gemini-2.0-flash"
          />
          <USelect
            v-else
            v-model="autocompactNode.model_name"
            :disabled="disabled"
            :items="modelOptionsFor(autocompactNode.llm_config_id || defaultLlmConfigId)"
            class="flex-1"
            placeholder="Use default model"
          />
          <UButton
            :icon="nodeModelManual['autocompact'] ? 'i-lucide-list' : 'i-lucide-pencil'"
            :title="nodeModelManual['autocompact'] ? 'Select from list' : 'Enter manually'"
            color="neutral"
            size="sm"
            variant="ghost"
            @click="nodeModelManual['autocompact'] = !nodeModelManual['autocompact']; autocompactNode.model_name = ''"
          />
        </div>
      </UFormField>
    </template>

    <USeparator label="Node Settings" />

    <div v-for="key in NODE_KEYS" :key="key" class="border border-default rounded-lg overflow-hidden">
      <button
        class="w-full px-4 py-2.5 flex items-center justify-between text-sm bg-elevated/30 hover:bg-elevated/60 transition-colors"
        type="button"
        @click="toggleNode(key)"
      >
        <span class="font-medium">{{ NODE_LABELS[key] }}</span>
        <div class="flex items-center gap-2">
          <span v-if="hasNodeOverride(key)" class="text-xs text-primary">Override set</span>
          <UIcon :name="expandedNodes[key] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4 text-dimmed" />
        </div>
      </button>

      <div v-show="expandedNodes[key]" class="p-4 flex flex-col gap-3 border-t border-default">
        <UFormField description="Overrides default LLM config for this node" label="LLM Config">
          <USelect v-model="nodeConfigs[key].llm_config_id" :disabled="disabled" :items="llmConfigOptions" class="w-full" placeholder="Use default" />
        </UFormField>

        <UFormField :description="nodeConfigs[key].llm_config_id ? 'Model for this node\'s LLM config' : 'Overrides default model for this node'" label="Model">
          <div class="flex gap-2 items-center w-full">
            <UInput
              v-if="nodeModelManual[key]"
              v-model="nodeConfigs[key].model_name"
              :disabled="disabled"
              class="flex-1"
              placeholder="e.g. gpt-4o, gemini-2.0-flash"
            />
            <USelect
              v-else
              v-model="nodeConfigs[key].model_name"
              :disabled="disabled"
              :items="modelOptionsFor(nodeConfigs[key].llm_config_id || defaultLlmConfigId)"
              class="flex-1"
              placeholder="Use default model"
            />
            <UButton
              :icon="nodeModelManual[key] ? 'i-lucide-list' : 'i-lucide-pencil'"
              :title="nodeModelManual[key] ? 'Select from list' : 'Enter manually'"
              color="neutral"
              size="sm"
              variant="ghost"
              @click="nodeModelManual[key] = !nodeModelManual[key]; nodeConfigs[key].model_name = ''"
            />
          </div>
        </UFormField>

        <UFormField description="Override node temperature (0.0–2.0)" label="Temperature">
          <UInput
            v-model.number="nodeConfigs[key].temperature"
            :disabled="disabled"
            :max="2"
            :min="0"
            :step="0.1"
            class="w-full"
            placeholder="Default (from instance)"
            type="number"
          />
        </UFormField>
        <UFormField description="Override node max output tokens" label="Max Tokens">
          <UInput
            v-model.number="nodeConfigs[key].max_tokens"
            :disabled="disabled"
            :min="256"
            class="w-full"
            placeholder="Default (from instance)"
            type="number"
          />
        </UFormField>
        <UFormField description="Override timeout for this node in seconds" label="Timeout (s)">
          <UInput
            v-model.number="nodeConfigs[key].timeout"
            :disabled="disabled"
            :min="1"
            class="w-full"
            placeholder="Use global node_execution_timeout"
            type="number"
          />
        </UFormField>
        <UFormField description="Must contain the same {placeholders} as the default prompt" label="Prompt Override">
          <UTextarea
            v-model="nodeConfigs[key].prompt_override"
            :disabled="disabled"
            :rows="4"
            class="w-full font-mono text-xs"
            placeholder="Leave empty to use the default prompt"
          />
          <div class="mt-2">
            <button class="text-xs text-dimmed underline" type="button" @click="toggleShowDefault(key)">
              {{ showDefault[key] ? 'Hide default prompt' : 'View default prompt' }}
            </button>
            <pre v-if="showDefault[key]" class="text-xs font-mono bg-elevated/40 rounded p-3 mt-1 whitespace-pre-wrap">{{ defaultPrompts?.[key] }}</pre>
          </div>
        </UFormField>
      </div>
    </div>
  </div>
</template>
