import type { LLMConfigResponse, ProviderModelResponse } from '~/types'
import { providerLabel } from '~/utils'

export const NODE_KEYS = [
  'classifier_node',
  'planner_node',
  'synthesizer_node',
  'validation_node',
  'clarifier_node',
  'responder_node',
  'error_handler_node'
] as const

export type NodeKey = (typeof NODE_KEYS)[number]

export const GROUNDED_NODE_KEYS = ['agent_node', 'synthesizer_node', 'error_handler_node'] as const

export type GroundedNodeKey = (typeof GROUNDED_NODE_KEYS)[number]

export const NODE_LABELS: Record<NodeKey, string> = {
  classifier_node: 'Router',
  planner_node: 'Planner',
  synthesizer_node: 'Synthesizer',
  validation_node: 'Validation',
  clarifier_node: 'Clarifier',
  responder_node: 'Responder',
  error_handler_node: 'Error Handler'
}

export const GROUNDED_NODE_LABELS: Record<GroundedNodeKey, string> = {
  agent_node: 'Agent',
  synthesizer_node: 'Synthesizer',
  error_handler_node: 'Error Handler'
}

export type NodeState = {
  llm_config_id: string
  model_name: string
  prompt_override: string
  temperature: number | null
  max_tokens: number | null
  timeout: number | null
}

export function useLangGraphSupervisor(
  orgId: Ref<string>,
  initialValue: Ref<Record<string, unknown> | undefined>,
  supportedProviders: Ref<string[] | null | undefined>,
  _disabled: Ref<boolean> = ref(false)
) {
  const { data: llmConfigs, pending: llmConfigsLoading } = useApiFetch<LLMConfigResponse[]>(() => `/api/orgs/${orgId.value}/llm-configs`, { watch: [orgId] })

  const llmConfigOptions = computed(() =>
    (llmConfigs.value ?? [])
      .filter((c) => !c.is_deleted && c?.is_enabled !== false)
      .filter((c) => !supportedProviders.value || supportedProviders.value.includes(c.provider))
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

  function toTitleCase(text: string) {
    return text
      .toLowerCase()
      .replace(/[-_\s.]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim()
  }

  async function ensureModels(provider: string | null) {
    if (!provider || modelsByProvider.value[provider]) return
    try {
      const models = await $fetch<ProviderModelResponse[]>(`/api/providers/${provider}/models`)
      modelsByProvider.value = {
        ...modelsByProvider.value,
        [provider]: models.map((m) => ({
          label: `${toTitleCase(m.model_category)} | ${m.display_name}`,
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

  const defaultModelOptions = computed(() => modelOptionsFor(defaultLlmConfigId.value))

  const defaultModelManual = ref(false)
  const allNodeKeys = [...NODE_KEYS, ...GROUNDED_NODE_KEYS]
  const nodeModelManual = reactive(Object.fromEntries([...allNodeKeys, 'autocompact', 'suggestion'].map((k) => [k, false])) as Record<string, boolean>)

  const modeConfigSource = computed(() => (initialValue.value?.mode_config ?? {}) as Record<string, unknown>)

  function resolveBoolean(config: Record<string, unknown>, newKey: string, oldKey: string, defaultVal: boolean): boolean {
    if (config[newKey] !== undefined) return Boolean(config[newKey])
    if (config[oldKey] !== undefined) return Boolean(config[oldKey])
    return defaultVal
  }

  const defaultLlmConfigId = ref<string | undefined>(undefined)
  const defaultModelName = ref<string | undefined>(undefined)

  let isLoadingFromInitial = false

  watch(
    initialValue,
    (val) => {
      if (!val) return
      isLoadingFromInitial = true
      defaultLlmConfigId.value = val.default_llm_config_id != null ? String(val.default_llm_config_id) : undefined
      defaultModelName.value = val.default_model_name != null ? String(val.default_model_name) : undefined
      isLoadingFromInitial = false
    },
    { immediate: true }
  )

  watch(defaultLlmConfigId, () => {
    if (isLoadingFromInitial) return
    defaultModelName.value = undefined
    defaultModelManual.value = false
  })

  watch(supportedProviders, (allowed) => {
    if (!allowed) return
    if (defaultLlmConfigId.value) {
      const p = providerOf(defaultLlmConfigId.value)
      if (p && !allowed.includes(p)) {
        defaultLlmConfigId.value = undefined
        defaultModelName.value = undefined
      }
    }
    for (const key of allNodeKeys) {
      const p = providerOf(nodeConfigs[key].llm_config_id)
      if (p && !allowed.includes(p)) nodeConfigs[key].llm_config_id = ''
    }
  })

  async function syncDefaultModel(id: string | undefined) {
    if (!llmConfigs.value) return
    await ensureModels(providerOf(id))
    defaultModelManual.value = !!(id && !modelOptionsFor(id).length)
  }

  watch([llmConfigs, defaultLlmConfigId], ([, id]) => syncDefaultModel(id as string | undefined), { immediate: true })

  const defaultTemperature = ref<number | null>(0.2)
  const defaultMaxTokens = ref<number | null>(2048)

  watch(
    initialValue,
    (val) => {
      if (!val) return
      defaultTemperature.value = val.temperature != null ? Number(val.temperature) : 0.2
      defaultMaxTokens.value = val.max_tokens != null ? Number(val.max_tokens) : 2048
    },
    { immediate: true }
  )

  const modeConfig = reactive({
    node_execution_timeout: 60,
    message_context_window: 5,
    max_context_window: 16000,
    max_agent_hops: 10,
    enabled_parallel_tool_calls: true,
    enabled_llm_validation: false,
    enabled_clarification_intent: true,
    enabled_auto_compact: false,
    enabled_suggestion: true
  })

  watch(
    modeConfigSource,
    (src) => {
      modeConfig.node_execution_timeout = Number(src.node_execution_timeout ?? src.supervisor_timeout ?? src.invoke_timeout ?? 60)
      modeConfig.message_context_window = Number(src.message_context_window ?? src.classifier_context_window ?? 5)
      modeConfig.max_context_window = Number(src.max_context_window ?? 16000)
      modeConfig.max_agent_hops = Number(src.max_agent_hops ?? 10)
      modeConfig.enabled_parallel_tool_calls = resolveBoolean(src, 'enabled_parallel_tool_calls', 'parallel_tool_calls', true)
      modeConfig.enabled_llm_validation = resolveBoolean(src, 'enabled_llm_validation', 'use_llm_validation', false)
      modeConfig.enabled_clarification_intent = resolveBoolean(src, 'enabled_clarification_intent', 'use_clarification_intent', true)
      modeConfig.enabled_auto_compact = resolveBoolean(src, 'enabled_auto_compact', 'autocompact_enabled', false)
      modeConfig.enabled_suggestion = resolveBoolean(src, 'enabled_suggestion', 'enabled_suggestion', true)
    },
    { immediate: true }
  )

  const nodeConfigs = reactive(
    Object.fromEntries(
      allNodeKeys.map((key) => [
        key,
        {
          llm_config_id: '',
          model_name: '',
          prompt_override: '',
          temperature: null as number | null,
          max_tokens: null as number | null,
          timeout: null as number | null
        }
      ])
    ) as Record<string, NodeState>
  )

  watch(
    modeConfigSource,
    (src) => {
      for (const key of allNodeKeys) {
        const nodeSrc = (src[key] ?? {}) as {
          llm_config_id?: number | null
          model_name?: string | null
          prompt_override?: string | null
          temperature?: number | null
          max_tokens?: number | null
          timeout?: number | null
        }
        nodeConfigs[key].llm_config_id = nodeSrc.llm_config_id != null ? String(nodeSrc.llm_config_id) : ''
        nodeConfigs[key].model_name = nodeSrc.model_name ?? ''
        nodeConfigs[key].prompt_override = nodeSrc.prompt_override ?? ''
        nodeConfigs[key].temperature = nodeSrc.temperature ?? null
        nodeConfigs[key].max_tokens = nodeSrc.max_tokens ?? null
        nodeConfigs[key].timeout = nodeSrc.timeout ?? null
      }
    },
    { immediate: true }
  )

  type NodeConfigFromMode = {
    llm_config_id?: number | null | string
    model_name?: string | null
    prompt_override?: string | null
    temperature?: number | null
    max_tokens?: number | null
    timeout?: number | null
  }

  const autocompactSrc = computed(() => (modeConfigSource.value.autocompact ?? modeConfigSource.value.autocompact_node ?? {}) as NodeConfigFromMode)

  const autocompactNode = reactive<NodeState>({
    llm_config_id: '',
    model_name: '',
    prompt_override: '',
    temperature: null,
    max_tokens: null,
    timeout: null
  })

  watch(
    autocompactSrc,
    (src) => {
      autocompactNode.llm_config_id = src.llm_config_id != null ? String(src.llm_config_id) : ''
      autocompactNode.model_name = src.model_name ?? ''
      autocompactNode.prompt_override = src.prompt_override ?? ''
      autocompactNode.temperature = src.temperature ?? null
      autocompactNode.max_tokens = src.max_tokens ?? null
      autocompactNode.timeout = src.timeout ?? null
    },
    { immediate: true }
  )

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

  const suggestionSrc = computed(() => (modeConfigSource.value.suggestion_node ?? {}) as NodeConfigFromMode)

  const suggestionNode = reactive<NodeState>({
    llm_config_id: '',
    model_name: '',
    prompt_override: '',
    temperature: null,
    max_tokens: null,
    timeout: null
  })

  watch(
    suggestionSrc,
    (src) => {
      suggestionNode.llm_config_id = src.llm_config_id != null ? String(src.llm_config_id) : ''
      suggestionNode.model_name = src.model_name ?? ''
      suggestionNode.prompt_override = src.prompt_override ?? ''
      suggestionNode.temperature = src.temperature ?? null
      suggestionNode.max_tokens = src.max_tokens ?? null
      suggestionNode.timeout = src.timeout ?? null
    },
    { immediate: true }
  )

  watch(
    () => suggestionNode.llm_config_id,
    () => {
      suggestionNode.model_name = ''
      nodeModelManual['suggestion'] = false
    }
  )

  watch(
    [llmConfigs, () => suggestionNode.llm_config_id],
    async () => {
      if (!llmConfigs.value) return
      const p = providerOf(suggestionNode.llm_config_id) ?? providerOf(defaultLlmConfigId.value)
      await ensureModels(p)
      const effectiveId = suggestionNode.llm_config_id || defaultLlmConfigId.value
      if (effectiveId && !modelOptionsFor(effectiveId).length) nodeModelManual['suggestion'] = true
      else nodeModelManual['suggestion'] = false
    },
    { immediate: true }
  )

  watch(supportedProviders, (allowed) => {
    if (!allowed) return
    const acp = providerOf(autocompactNode.llm_config_id)
    if (acp && !allowed.includes(acp)) autocompactNode.llm_config_id = ''
    const sug = providerOf(suggestionNode.llm_config_id)
    if (sug && !allowed.includes(sug)) suggestionNode.llm_config_id = ''
  })

  for (const key of allNodeKeys) {
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
    for (const key of allNodeKeys) {
      const p = providerOf(nodeConfigs[key].llm_config_id) ?? providerOf(defaultLlmConfigId.value)
      if (p) providers.add(p)
    }
    await Promise.all([...providers].map((p) => ensureModels(p)))
    for (const key of allNodeKeys) {
      const effectiveConfigId = nodeConfigs[key].llm_config_id || defaultLlmConfigId.value
      nodeModelManual[key] = !!(effectiveConfigId && !modelOptionsFor(effectiveConfigId).length)
    }
  }

  watch([llmConfigs, ...allNodeKeys.map((key) => () => nodeConfigs[key].llm_config_id)], syncNodeModels, { immediate: true })

  const expandedNodes = ref<Record<string, boolean>>(Object.fromEntries(allNodeKeys.map((k) => [k, false])))

  const showDefault = ref<Record<string, boolean>>(Object.fromEntries(allNodeKeys.map((k) => [k, false])))

  const defaultPrompts = ref<Record<string, string> | null>(null)

  onMounted(async () => {
    const updates: Record<string, boolean> = {}
    for (const key of allNodeKeys) {
      if (hasNodeOverride(key as NodeKey)) updates[key] = true
    }
    if (Object.keys(updates).length > 0) {
      expandedNodes.value = { ...expandedNodes.value, ...updates }
    }

    const [supervisorRes, groundedRes] = await Promise.allSettled([
      $fetch<Record<string, string>>('/api/engine/supervisor/prompts'),
      $fetch<Record<string, string>>('/api/engine/grounded/prompts')
    ])
    defaultPrompts.value = {
      ...(supervisorRes.status === 'fulfilled' ? supervisorRes.value : {}),
      ...(groundedRes.status === 'fulfilled' ? groundedRes.value : {})
    }
  })

  function toggleNode(key: NodeKey) {
    expandedNodes.value = { ...expandedNodes.value, [key]: !expandedNodes.value[key] }
  }

  function toggleShowDefault(key: NodeKey) {
    showDefault.value = { ...showDefault.value, [key]: !showDefault.value[key] }
  }

  function hasNodeOverride(key: NodeKey | GroundedNodeKey): boolean {
    const cfg = nodeConfigs[key]
    if (!cfg) return false
    return !!(cfg.llm_config_id || cfg.model_name || cfg.prompt_override || cfg.temperature !== null || cfg.max_tokens !== null || cfg.timeout !== null)
  }

  function getGroundedNodeOverrides(): Record<string, unknown> {
    return Object.fromEntries(
      GROUNDED_NODE_KEYS.map((key) => [
        key,
        {
          llm_config_id: nodeConfigs[key].llm_config_id ? String(nodeConfigs[key].llm_config_id) : null,
          model_name: nodeConfigs[key].model_name || null,
          prompt_override: nodeConfigs[key].prompt_override || null,
          temperature: nodeConfigs[key].temperature,
          max_tokens: nodeConfigs[key].max_tokens,
          timeout: nodeConfigs[key].timeout
        }
      ])
    )
  }

  function isValid(): boolean {
    if (!defaultLlmConfigId.value) return true
    return !!defaultModelName.value
  }

  function getValue(): Record<string, unknown> {
    return {
      default_llm_config_id: defaultLlmConfigId.value ? String(defaultLlmConfigId.value) : undefined,
      default_model_name: defaultModelName.value || undefined,
      default_temperature: defaultTemperature.value,
      default_max_tokens: defaultMaxTokens.value,
      mode_config: {
        node_execution_timeout: modeConfig.node_execution_timeout,
        message_context_window: modeConfig.message_context_window,
        max_context_window: modeConfig.max_context_window,
        enabled_parallel_tool_calls: modeConfig.enabled_parallel_tool_calls,
        enabled_llm_validation: modeConfig.enabled_llm_validation,
        enabled_clarification_intent: modeConfig.enabled_clarification_intent,
        enabled_auto_compact: modeConfig.enabled_auto_compact,
        enabled_suggestion: modeConfig.enabled_suggestion,
        max_agent_hops: modeConfig.max_agent_hops,
        autocompact: modeConfig.enabled_auto_compact
          ? {
              llm_config_id: autocompactNode.llm_config_id ? String(autocompactNode.llm_config_id) : null,
              model_name: autocompactNode.model_name || null,
              prompt_override: autocompactNode.prompt_override || null,
              temperature: autocompactNode.temperature,
              max_tokens: autocompactNode.max_tokens,
              timeout: autocompactNode.timeout
            }
          : {},
        suggestion_node: modeConfig.enabled_suggestion
          ? {
              llm_config_id: suggestionNode.llm_config_id ? String(suggestionNode.llm_config_id) : null,
              model_name: suggestionNode.model_name || null,
              prompt_override: suggestionNode.prompt_override || null,
              temperature: suggestionNode.temperature,
              max_tokens: suggestionNode.max_tokens,
              timeout: suggestionNode.timeout
            }
          : {},
        // Always serialize every NODE_KEYS entry (including validation_node, clarifier_node) even when
        // LLM Validation / Clarification intent are off. Omitting keys breaks config_hash on the server
        // and hot-tier reload dedup when toggling features back on; the edit flow replaces mode_config wholesale.
        ...Object.fromEntries(
          NODE_KEYS.map((key) => [
            key,
            {
              llm_config_id: nodeConfigs[key].llm_config_id ? String(nodeConfigs[key].llm_config_id) : null,
              model_name: nodeConfigs[key].model_name || null,
              prompt_override: nodeConfigs[key].prompt_override || null,
              temperature: nodeConfigs[key].temperature,
              max_tokens: nodeConfigs[key].max_tokens,
              timeout: nodeConfigs[key].timeout
            }
          ])
        )
      }
    }
  }

  return {
    llmConfigs,
    llmConfigsLoading,
    llmConfigOptions,
    modelsByProvider,
    providerOf,
    ensureModels,
    modelOptionsFor,
    defaultModelOptions,
    defaultModelManual,
    nodeModelManual,
    defaultLlmConfigId,
    defaultModelName,
    defaultTemperature,
    defaultMaxTokens,
    modeConfig,
    nodeConfigs,
    autocompactNode,
    suggestionNode,
    expandedNodes,
    showDefault,
    defaultPrompts,
    toggleNode,
    toggleShowDefault,
    hasNodeOverride,
    isValid,
    getValue,
    getGroundedNodeOverrides,
    NODE_KEYS,
    NODE_LABELS,
    GROUNDED_NODE_KEYS,
    GROUNDED_NODE_LABELS
  }
}
