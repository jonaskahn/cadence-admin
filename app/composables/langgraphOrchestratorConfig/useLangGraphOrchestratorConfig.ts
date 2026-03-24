import type { LLMConfigResponse, OrchestratorDefaults, ProviderModelResponse } from '~/types'
import { providerLabel } from '~/utils'
import { buildGroundedModeConfigPayload, buildSupervisorModeConfigPayload } from './modeConfigPayload'
import { copyApiSourceIntoNodeState, emptyNodeState, nodeStateHasUserOverride, readPlannerNodeSource } from './nodeConfigPayload'
import { GROUNDED_NODE_KEYS, GROUNDED_NODE_LABELS, NODE_KEYS, NODE_LABELS } from './nodeKeys'
import type { ApiNodeSource, NodeState } from './types'

function coalesceBoolean(config: Record<string, unknown>, newKey: string, oldKey: string, defaultVal: boolean): boolean {
  if (config[newKey] !== undefined) return Boolean(config[newKey])
  if (config[oldKey] !== undefined) return Boolean(config[oldKey])
  return defaultVal
}

function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[-_\s.]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

export function useLangGraphOrchestratorConfig(
  orgId: Ref<string>,
  initialValue: Ref<Record<string, unknown> | undefined>,
  supportedProviders: Ref<string[] | null | undefined>,
  _disabled: Ref<boolean> = ref(false),
  orchestratorDefaults: Ref<OrchestratorDefaults | null | undefined> = ref(null),
  isGroundedMode: Ref<boolean> = ref(false)
) {
  const orgDefaults = orchestratorDefaults
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

  const defaultLlmConfigId = ref<string | undefined>(undefined)
  const defaultModelName = ref<string | undefined>(undefined)
  const defaultModelManual = ref(false)
  const defaultTemperature = ref<number | null>(0.2)
  const defaultMaxTokens = ref<number | null>(2048)

  const resolvedDefaultLlmConfigId = computed(() => {
    const picked = defaultLlmConfigId.value
    if (picked) return picked
    const oid = orgDefaults.value?.default_llm_config_id
    return oid != null ? String(oid) : undefined
  })

  const resolvedDefaultModelName = computed(() => {
    const typed = defaultModelName.value?.trim()
    if (typed) return typed
    const o = orgDefaults.value?.default_model_name
    return o != null && String(o).length > 0 ? String(o) : undefined
  })

  const orgDefaultTimeout = computed(() => {
    const v = orgDefaults.value?.default_timeout
    return v != null ? Number(v) : null
  })

  let isLoadingFromInitial = false

  const supervisorNodeKeys = [...NODE_KEYS]
  const nodeModelManual = reactive(Object.fromEntries([...supervisorNodeKeys, 'autocompact', 'suggestion'].map((k) => [k, false])) as Record<string, boolean>)

  const modeConfigSource = computed(() => (initialValue.value?.mode_config ?? {}) as Record<string, unknown>)

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

  watch(defaultLlmConfigId, (newId) => {
    if (isLoadingFromInitial) return
    // Clearing selection (use org defaults) keeps typed model; picking a concrete config resets model
    if (!newId) return
    defaultModelName.value = undefined
    defaultModelManual.value = false
  })

  function pickDefaultTemperature(instance: Record<string, unknown> | undefined, org: OrchestratorDefaults | null | undefined): number {
    const v = instance?.default_temperature
    if (v != null) {
      const n = Number(v)
      if (!Number.isNaN(n)) return n
    }
    const o = org?.default_temperature
    if (o != null) {
      const n = Number(o)
      if (!Number.isNaN(n)) return n
    }
    return 0.2
  }

  function pickDefaultMaxTokens(instance: Record<string, unknown> | undefined, org: OrchestratorDefaults | null | undefined): number {
    const v = instance?.default_max_tokens
    if (v != null) {
      const n = Number(v)
      if (!Number.isNaN(n)) return n
    }
    const o = org?.default_max_tokens
    if (o != null) {
      const n = Number(o)
      if (!Number.isNaN(n)) return n
    }
    return 2048
  }

  watch(
    () => [initialValue.value, orgDefaults.value] as const,
    ([val, org]) => {
      defaultTemperature.value = pickDefaultTemperature(val, org)
      defaultMaxTokens.value = pickDefaultMaxTokens(val, org)
    },
    { immediate: true, deep: true }
  )

  const modeConfig = reactive({
    node_execution_timeout: 60,
    message_context_window: 5,
    max_context_window: 16000,
    max_agent_hops: 25,
    max_tool_rounds: 3,
    enabled_parallel_tool_calls: true,
    enabled_llm_validation: false,
    enabled_clarification_intent: true,
    enabled_auto_compact: false,
    enabled_suggestion: false
  })

  watch(
    [modeConfigSource, isGroundedMode],
    () => {
      const src = modeConfigSource.value
      modeConfig.node_execution_timeout = Number(src.node_execution_timeout ?? src.supervisor_timeout ?? src.invoke_timeout ?? 60)
      modeConfig.message_context_window = Number(src.message_context_window ?? src.classifier_context_window ?? 5)
      modeConfig.max_context_window = Number(src.max_context_window ?? 16000)
      modeConfig.max_agent_hops = Number(src.max_agent_hops ?? 25)
      modeConfig.max_tool_rounds = Number(src.max_tool_rounds ?? 3)
      modeConfig.enabled_parallel_tool_calls = coalesceBoolean(src, 'enabled_parallel_tool_calls', 'parallel_tool_calls', true)
      if (src.enabled_validator !== undefined) {
        modeConfig.enabled_llm_validation = Boolean(src.enabled_validator)
      } else {
        const fallback = isGroundedMode.value
        modeConfig.enabled_llm_validation = coalesceBoolean(src, 'enabled_llm_validation', 'use_llm_validation', fallback)
      }
      modeConfig.enabled_clarification_intent = coalesceBoolean(src, 'enabled_clarification_intent', 'use_clarification_intent', true)
      modeConfig.enabled_auto_compact = coalesceBoolean(src, 'enabled_auto_compact', 'autocompact_enabled', false)
      modeConfig.enabled_suggestion = coalesceBoolean(src, 'enabled_suggestion', 'enabled_suggestion', false)
    },
    { immediate: true }
  )

  const nodeConfigs = reactive(Object.fromEntries(supervisorNodeKeys.map((key) => [key, emptyNodeState()])) as Record<string, NodeState>)

  watch(
    modeConfigSource,
    (src) => {
      for (const key of supervisorNodeKeys) {
        const raw = key === 'planner_node' ? readPlannerNodeSource(src) : src[key]
        copyApiSourceIntoNodeState(nodeConfigs[key]!, (raw ?? {}) as ApiNodeSource)
      }
    },
    { immediate: true }
  )

  const autocompactSrc = computed(() => (modeConfigSource.value.autocompact ?? modeConfigSource.value.autocompact_node ?? {}) as ApiNodeSource)

  const autocompactNode = reactive<NodeState>(emptyNodeState())

  watch(
    autocompactSrc,
    (src) => {
      copyApiSourceIntoNodeState(autocompactNode, src)
    },
    { immediate: true }
  )

  const suggestionSrc = computed(() => (modeConfigSource.value.suggestion_node ?? {}) as ApiNodeSource)

  const suggestionNode = reactive<NodeState>(emptyNodeState())

  watch(
    suggestionSrc,
    (src) => {
      copyApiSourceIntoNodeState(suggestionNode, src)
    },
    { immediate: true }
  )

  function modelOptionsFor(configId: string | undefined): { label: string; value: string }[] {
    const provider = providerOf(configId) ?? providerOf(resolvedDefaultLlmConfigId.value)
    return provider ? (modelsByProvider.value[provider] ?? []) : []
  }

  const defaultModelOptions = computed(() => modelOptionsFor(resolvedDefaultLlmConfigId.value))

  watch(supportedProviders, (allowed) => {
    if (!allowed) return
    const topId = defaultLlmConfigId.value ?? orgDefaults.value?.default_llm_config_id
    if (topId) {
      const p = providerOf(String(topId))
      if (p && !allowed.includes(p)) {
        defaultLlmConfigId.value = undefined
        defaultModelName.value = undefined
      }
    }
    for (const key of supervisorNodeKeys) {
      const p = providerOf(nodeConfigs[key]!.llm_config_id)
      if (p && !allowed.includes(p)) nodeConfigs[key]!.llm_config_id = ''
    }
  })

  async function syncDefaultModel(id: string | undefined) {
    if (!llmConfigs.value) return
    await ensureModels(providerOf(id))
    if (id && !modelOptionsFor(id).length) {
      defaultModelManual.value = true
    }
  }

  watch([llmConfigs, resolvedDefaultLlmConfigId], ([, id]) => syncDefaultModel(id as string | undefined), { immediate: true })

  watch(
    () => autocompactNode.llm_config_id,
    () => {
      autocompactNode.model_name = ''
      nodeModelManual.autocompact = false
    }
  )

  watch(
    [llmConfigs, () => autocompactNode.llm_config_id],
    async () => {
      if (!llmConfigs.value) return
      const p = providerOf(autocompactNode.llm_config_id) ?? providerOf(resolvedDefaultLlmConfigId.value)
      await ensureModels(p)
      const effectiveId = autocompactNode.llm_config_id || resolvedDefaultLlmConfigId.value
      if (effectiveId && !modelOptionsFor(effectiveId).length) {
        nodeModelManual.autocompact = true
      }
    },
    { immediate: true }
  )

  watch(
    () => suggestionNode.llm_config_id,
    () => {
      suggestionNode.model_name = ''
      nodeModelManual.suggestion = false
    }
  )

  watch(
    [llmConfigs, () => suggestionNode.llm_config_id],
    async () => {
      if (!llmConfigs.value) return
      const p = providerOf(suggestionNode.llm_config_id) ?? providerOf(resolvedDefaultLlmConfigId.value)
      await ensureModels(p)
      const effectiveId = suggestionNode.llm_config_id || resolvedDefaultLlmConfigId.value
      if (effectiveId && !modelOptionsFor(effectiveId).length) {
        nodeModelManual.suggestion = true
      }
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

  for (const key of supervisorNodeKeys) {
    watch(
      () => nodeConfigs[key]!.llm_config_id,
      () => {
        nodeConfigs[key]!.model_name = ''
        nodeModelManual[key] = false
      }
    )
  }

  async function syncNodeModels() {
    if (!llmConfigs.value) return
    const providers = new Set<string>()
    for (const key of supervisorNodeKeys) {
      const p = providerOf(nodeConfigs[key]!.llm_config_id) ?? providerOf(resolvedDefaultLlmConfigId.value)
      if (p) providers.add(p)
    }
    await Promise.all([...providers].map((p) => ensureModels(p)))
    for (const key of supervisorNodeKeys) {
      const effectiveConfigId = nodeConfigs[key]!.llm_config_id || resolvedDefaultLlmConfigId.value
      if (effectiveConfigId && !modelOptionsFor(effectiveConfigId).length) {
        nodeModelManual[key] = true
      }
    }
  }

  watch([llmConfigs, ...supervisorNodeKeys.map((key) => () => nodeConfigs[key]!.llm_config_id)], syncNodeModels, { immediate: true })

  const expandedNodes = ref<Record<string, boolean>>(Object.fromEntries(supervisorNodeKeys.map((k) => [k, false])))

  const showDefault = ref<Record<string, boolean>>(Object.fromEntries(supervisorNodeKeys.map((k) => [k, false])))

  const defaultPrompts = ref<Record<string, string> | null>(null)

  function hasNodeOverride(key: (typeof NODE_KEYS)[number] | (typeof GROUNDED_NODE_KEYS)[number]): boolean {
    const cfg = nodeConfigs[key]
    if (!cfg) return false
    return nodeStateHasUserOverride(cfg)
  }

  onMounted(async () => {
    const updates: Record<string, boolean> = {}
    for (const key of supervisorNodeKeys) {
      if (hasNodeOverride(key)) updates[key] = true
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

  function toggleNode(key: (typeof NODE_KEYS)[number]) {
    expandedNodes.value = { ...expandedNodes.value, [key]: !expandedNodes.value[key] }
  }

  function toggleShowDefault(key: (typeof NODE_KEYS)[number]) {
    showDefault.value = { ...showDefault.value, [key]: !showDefault.value[key] }
  }

  function isValid(): boolean {
    return !!(resolvedDefaultLlmConfigId.value && resolvedDefaultModelName.value)
  }

  function getGroundedValue(groundedExtra: Record<string, unknown>): Record<string, unknown> {
    return {
      default_llm_config_id: resolvedDefaultLlmConfigId.value ? String(resolvedDefaultLlmConfigId.value) : undefined,
      default_model_name: resolvedDefaultModelName.value || undefined,
      default_temperature: defaultTemperature.value,
      default_max_tokens: defaultMaxTokens.value,
      mode_config: buildGroundedModeConfigPayload(
        {
          node_execution_timeout: modeConfig.node_execution_timeout,
          message_context_window: modeConfig.message_context_window,
          max_context_window: modeConfig.max_context_window,
          enabled_auto_compact: modeConfig.enabled_auto_compact,
          enabled_suggestion: modeConfig.enabled_suggestion,
          max_agent_hops: modeConfig.max_agent_hops,
          max_tool_rounds: modeConfig.max_tool_rounds,
          enabled_validator: modeConfig.enabled_llm_validation
        },
        autocompactNode,
        suggestionNode,
        groundedExtra,
        nodeConfigs
      )
    }
  }

  function getValue(): Record<string, unknown> {
    return {
      default_llm_config_id: resolvedDefaultLlmConfigId.value ? String(resolvedDefaultLlmConfigId.value) : undefined,
      default_model_name: resolvedDefaultModelName.value || undefined,
      default_temperature: defaultTemperature.value,
      default_max_tokens: defaultMaxTokens.value,
      mode_config: buildSupervisorModeConfigPayload(
        {
          node_execution_timeout: modeConfig.node_execution_timeout,
          message_context_window: modeConfig.message_context_window,
          max_context_window: modeConfig.max_context_window,
          enabled_auto_compact: modeConfig.enabled_auto_compact,
          enabled_suggestion: modeConfig.enabled_suggestion,
          enabled_parallel_tool_calls: modeConfig.enabled_parallel_tool_calls,
          enabled_llm_validation: modeConfig.enabled_llm_validation,
          enabled_clarification_intent: modeConfig.enabled_clarification_intent,
          max_agent_hops: modeConfig.max_agent_hops,
          max_tool_rounds: modeConfig.max_tool_rounds
        },
        autocompactNode,
        suggestionNode,
        nodeConfigs
      )
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
    resolvedDefaultLlmConfigId,
    resolvedDefaultModelName,
    orgDefaultTimeout,
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
    getGroundedValue,
    NODE_KEYS,
    NODE_LABELS,
    GROUNDED_NODE_KEYS,
    GROUNDED_NODE_LABELS
  }
}
