<script setup lang="ts">
import type { LLMConfigResponse, ProviderModelResponse } from '~/types'

const props = defineProps<{
  orgId: string
  initialValue?: Record<string, unknown>
  disabled?: boolean
}>()

const { data: llmConfigs } = useFetch<LLMConfigResponse[]>(
  () => `/api/orgs/${props.orgId}/llm-configs`
)

const llmConfigOptions = computed(() =>
  (llmConfigs.value ?? []).map((c) => ({
    label: `${c.name} (${c.provider})`,
    value: c.id
  }))
)

// ── Model loading per provider ─────────────────────────────────────────────

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
        label: m.aliases.length
          ? `${m.display_name} — ${m.model_id} (${m.aliases.join(', ')})`
          : `${m.display_name} — ${m.model_id}`,
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

// ── Default config + model ─────────────────────────────────────────────────

const NODE_KEYS = [
  'supervisor_node',
  'synthesizer_node',
  'validation_node',
  'facilitator_node',
  'conversational_node',
  'error_handler_node'
] as const

type NodeKey = (typeof NODE_KEYS)[number]

const NODE_LABELS: Record<NodeKey, string> = {
  supervisor_node: 'Supervisor',
  synthesizer_node: 'Synthesizer',
  validation_node: 'Validation',
  facilitator_node: 'Facilitator',
  conversational_node: 'Conversational',
  error_handler_node: 'Error Handler'
}

const modeConfigSource = (props.initialValue?.mode_config ?? {}) as Record<string, unknown>

const defaultLlmConfigId = ref<string | undefined>(
  props.initialValue?.default_llm_config_id != null
    ? String(props.initialValue.default_llm_config_id)
    : undefined
)

const defaultModelName = ref<string | undefined>(
  props.initialValue?.default_model_name != null
    ? String(props.initialValue.default_model_name)
    : undefined
)

watch(
  defaultLlmConfigId,
  async (id) => {
    defaultModelName.value = undefined
    await ensureModels(providerOf(id))
  },
  { immediate: true }
)

// ── Scalar settings ────────────────────────────────────────────────────────

const modeConfig = reactive({
  max_agent_hops: Number(modeConfigSource.max_agent_hops ?? 10),
  invoke_timeout: Number(modeConfigSource.invoke_timeout ?? 60),
  supervisor_timeout: Number(modeConfigSource.supervisor_timeout ?? 60),
  parallel_tool_calls:
    modeConfigSource.parallel_tool_calls !== undefined
      ? Boolean(modeConfigSource.parallel_tool_calls)
      : true,
  use_llm_validation:
    modeConfigSource.use_llm_validation !== undefined
      ? Boolean(modeConfigSource.use_llm_validation)
      : false
})

// ── Per-node config ────────────────────────────────────────────────────────

type NodeState = { llm_config_id: string; model_name: string; prompt_override: string }

const nodeConfigs = reactive(
  Object.fromEntries(
    NODE_KEYS.map((key) => {
      const src = (modeConfigSource[key] ?? {}) as {
        llm_config_id?: number | null
        model_name?: string | null
        prompt_override?: string | null
      }
      return [
        key,
        {
          llm_config_id: src.llm_config_id != null ? String(src.llm_config_id) : '',
          model_name: src.model_name ?? '',
          prompt_override: src.prompt_override ?? ''
        }
      ]
    })
  ) as Record<NodeKey, NodeState>
)

// Load models when a node's config id changes
for (const key of NODE_KEYS) {
  watch(
    () => nodeConfigs[key].llm_config_id,
    async (id) => {
      nodeConfigs[key].model_name = ''
      await ensureModels(providerOf(id) ?? providerOf(defaultLlmConfigId.value))
    }
  )
}

// ── Accordion state ────────────────────────────────────────────────────────

const expandedNodes = ref<Record<string, boolean>>(
  Object.fromEntries(NODE_KEYS.map((k) => [k, false]))
)

const showDefault = ref<Record<string, boolean>>(
  Object.fromEntries(NODE_KEYS.map((k) => [k, false]))
)

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
  } catch {
    // optional display — ignore failures silently
  }
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
    nodeConfigs[key].prompt_override
  )
}

// ── Expose ─────────────────────────────────────────────────────────────────

defineExpose({
  isValid: () => !!defaultLlmConfigId.value && !!defaultModelName.value,
  getValue: (): Record<string, unknown> => ({
    default_llm_config_id: defaultLlmConfigId.value
      ? parseInt(defaultLlmConfigId.value, 10)
      : undefined,
    default_model_name: defaultModelName.value || undefined,
    mode_config: {
      max_agent_hops: modeConfig.max_agent_hops,
      invoke_timeout: modeConfig.invoke_timeout,
      supervisor_timeout: modeConfig.supervisor_timeout,
      parallel_tool_calls: modeConfig.parallel_tool_calls,
      use_llm_validation: modeConfig.use_llm_validation,
      ...Object.fromEntries(
        NODE_KEYS.map((key) => [
          key,
          {
            llm_config_id: nodeConfigs[key].llm_config_id
              ? parseInt(nodeConfigs[key].llm_config_id, 10)
              : null,
            model_name: nodeConfigs[key].model_name || null,
            prompt_override: nodeConfigs[key].prompt_override || null
          }
        ])
      )
    }
  })
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Default LLM config -->
    <UFormField
      label="Default LLM Config"
      required
      description="LLM config used by all nodes unless overridden per-node"
    >
      <USelect
        v-model="defaultLlmConfigId"
        :items="llmConfigOptions"
        placeholder="Select LLM config…"
        :disabled="disabled"
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-if="defaultLlmConfigId"
      label="Default Model"
      required
      description="Model used by all nodes unless overridden per-node"
    >
      <USelect
        v-model="defaultModelName"
        :items="modelOptionsFor(defaultLlmConfigId)"
        placeholder="Select model…"
        :disabled="disabled"
        class="w-full"
      />
    </UFormField>

    <!-- Scalar settings -->
    <div class="grid grid-cols-3 gap-4">
      <UFormField label="Max Agent Hops" description="Max supervisor iterations">
        <UInput
          v-model.number="modeConfig.max_agent_hops"
          type="number"
          :min="1"
          :disabled="disabled"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Invoke Timeout (s)" description="Tool execution timeout">
        <UInput
          v-model.number="modeConfig.invoke_timeout"
          type="number"
          :min="1"
          :disabled="disabled"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Supervisor Timeout (s)" description="LLM call timeout">
        <UInput
          v-model.number="modeConfig.supervisor_timeout"
          type="number"
          :min="1"
          :disabled="disabled"
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="flex flex-col gap-3 pt-1">
      <UCheckbox
        v-model="modeConfig.parallel_tool_calls"
        label="Parallel Tool Calls"
        :disabled="disabled"
      />
      <UCheckbox
        v-model="modeConfig.use_llm_validation"
        label="Use LLM Validation"
        :disabled="disabled"
      />
    </div>

    <!-- Per-node overrides -->
    <USeparator label="Per-Node Overrides" />

    <div
      v-for="key in NODE_KEYS"
      :key="key"
      class="border border-default rounded-lg overflow-hidden"
    >
      <button
        type="button"
        class="w-full px-4 py-2.5 flex items-center justify-between text-sm bg-elevated/30 hover:bg-elevated/60 transition-colors"
        @click="toggleNode(key)"
      >
        <span class="font-medium">{{ NODE_LABELS[key] }}</span>
        <div class="flex items-center gap-2">
          <span v-if="hasNodeOverride(key)" class="text-xs text-primary">Override set</span>
          <UIcon
            :name="expandedNodes[key] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="size-4 text-dimmed"
          />
        </div>
      </button>

      <div v-show="expandedNodes[key]" class="p-4 flex flex-col gap-3 border-t border-default">
        <UFormField label="LLM Config" description="Overrides default LLM config for this node">
          <USelect
            v-model="nodeConfigs[key].llm_config_id"
            :items="llmConfigOptions"
            placeholder="Use default"
            :disabled="disabled"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Model"
          :description="
            nodeConfigs[key].llm_config_id
              ? 'Model for this node\'s LLM config'
              : 'Overrides default model for this node'
          "
        >
          <USelect
            v-model="nodeConfigs[key].model_name"
            :items="modelOptionsFor(nodeConfigs[key].llm_config_id || defaultLlmConfigId)"
            placeholder="Use default model"
            :disabled="
              disabled ||
              !modelOptionsFor(nodeConfigs[key].llm_config_id || defaultLlmConfigId).length
            "
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Prompt Override"
          description="Must contain the same {placeholders} as the default prompt"
        >
          <UTextarea
            v-model="nodeConfigs[key].prompt_override"
            :rows="4"
            :disabled="disabled"
            placeholder="Leave empty to use the default prompt"
            class="w-full font-mono text-xs"
          />
          <div class="mt-2">
            <button
              type="button"
              class="text-xs text-dimmed underline"
              @click="toggleShowDefault(key)"
            >
              {{ showDefault[key] ? 'Hide default prompt' : 'View default prompt' }}
            </button>
            <pre
              v-if="showDefault[key]"
              class="text-xs font-mono bg-elevated/40 rounded p-3 mt-1 whitespace-pre-wrap"
              >{{ defaultPrompts?.[key] }}</pre
            >
          </div>
        </UFormField>
      </div>
    </div>
  </div>
</template>
