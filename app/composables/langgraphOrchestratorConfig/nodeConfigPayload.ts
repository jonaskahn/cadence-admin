import type { ApiNodeSource, NodeState } from './types'

export type SerializedNodeConfig = {
  llm_config_id: string | null
  model_name: string | null
  prompt_override: string | null
  temperature: number | null
  max_tokens: number | null
  timeout: number | null
}

export function emptyNodeState(): NodeState {
  return {
    llm_config_id: '',
    model_name: '',
    prompt_override: '',
    temperature: null,
    max_tokens: null,
    timeout: null
  }
}

export function serializeNodeConfig(state: NodeState): SerializedNodeConfig {
  return {
    llm_config_id: state.llm_config_id ? String(state.llm_config_id) : null,
    model_name: state.model_name || null,
    prompt_override: state.prompt_override || null,
    temperature: state.temperature,
    max_tokens: state.max_tokens,
    timeout: state.timeout
  }
}

export function nodeStateHasUserOverride(state: NodeState): boolean {
  return !!(
    state.llm_config_id ||
    state.model_name ||
    state.prompt_override ||
    state.temperature !== null ||
    state.max_tokens !== null ||
    state.timeout !== null
  )
}

export function copyApiSourceIntoNodeState(target: NodeState, src: ApiNodeSource): void {
  target.llm_config_id = src.llm_config_id != null ? String(src.llm_config_id) : ''
  target.model_name = src.model_name ?? ''
  target.prompt_override = src.prompt_override ?? ''
  target.temperature = src.temperature ?? null
  target.max_tokens = src.max_tokens ?? null
  target.timeout = src.timeout ?? null
}

export function readPlannerNodeSource(modeConfig: Record<string, unknown>): unknown {
  return modeConfig.planner_node ?? modeConfig.agent_node
}
