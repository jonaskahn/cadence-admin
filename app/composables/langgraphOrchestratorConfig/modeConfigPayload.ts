/**
 * Supervisor mode_config serialization always includes every supervisor node key so the server
 * config_hash and hot-tier reload deduplication stay stable when toggling validation or clarification.
 */
import { serializeNodeConfig } from './nodeConfigPayload'
import { GROUNDED_NODE_KEYS, NODE_KEYS } from './nodeKeys'
import type { NodeState } from './types'

type ModeConfigScalars = {
  node_execution_timeout: number
  message_context_window: number
  max_context_window: number
  enabled_auto_compact: boolean
  enabled_suggestion: boolean
}

type SupervisorOnlyScalars = {
  enabled_parallel_tool_calls: boolean
  enabled_llm_validation: boolean
  enabled_clarification_intent: boolean
  max_agent_hops: number
  max_tool_rounds: number
}

export function buildAutocompactPayload(_enabled: boolean, node: NodeState): Record<string, unknown> {
  return serializeNodeConfig(node)
}

export function buildSuggestionNodePayload(_enabled: boolean, node: NodeState): Record<string, unknown> {
  return serializeNodeConfig(node)
}

export function buildSupervisorModeConfigPayload(
  scalars: ModeConfigScalars & SupervisorOnlyScalars,
  autocompactNode: NodeState,
  suggestionNode: NodeState,
  nodeStates: Record<string, NodeState>
): Record<string, unknown> {
  return {
    node_execution_timeout: scalars.node_execution_timeout,
    message_context_window: scalars.message_context_window,
    max_context_window: scalars.max_context_window,
    enabled_parallel_tool_calls: scalars.enabled_parallel_tool_calls,
    enabled_llm_validation: scalars.enabled_llm_validation,
    enabled_clarification_intent: scalars.enabled_clarification_intent,
    enabled_auto_compact: scalars.enabled_auto_compact,
    enabled_suggestion: scalars.enabled_suggestion,
    max_agent_hops: scalars.max_agent_hops,
    max_tool_rounds: scalars.max_tool_rounds,
    autocompact: buildAutocompactPayload(scalars.enabled_auto_compact, autocompactNode),
    suggestion_node: buildSuggestionNodePayload(scalars.enabled_suggestion, suggestionNode),
    ...Object.fromEntries(NODE_KEYS.map((key) => [key, serializeNodeConfig(nodeStates[key]!)]))
  }
}

type GroundedScalars = ModeConfigScalars &
  Pick<SupervisorOnlyScalars, 'max_agent_hops' | 'max_tool_rounds'> & {
    enabled_validator: boolean
  }

/** Strip flags owned by orchestrator scalars so parent scope-only models cannot override them. */
function sanitizeGroundedExtra(extra: Record<string, unknown>): Record<string, unknown> {
  const { enabled_validator: _a, enabled_llm_validation: _b, use_llm_validation: _c, ...rest } = extra
  return rest
}

export function buildGroundedModeConfigPayload(
  scalars: GroundedScalars,
  autocompactNode: NodeState,
  suggestionNode: NodeState,
  groundedExtra: Record<string, unknown>,
  nodeStates: Record<string, NodeState>
): Record<string, unknown> {
  return {
    node_execution_timeout: scalars.node_execution_timeout,
    message_context_window: scalars.message_context_window,
    max_context_window: scalars.max_context_window,
    enabled_auto_compact: scalars.enabled_auto_compact,
    enabled_suggestion: scalars.enabled_suggestion,
    max_agent_hops: scalars.max_agent_hops,
    max_tool_rounds: scalars.max_tool_rounds,
    autocompact: buildAutocompactPayload(scalars.enabled_auto_compact, autocompactNode),
    suggestion_node: buildSuggestionNodePayload(scalars.enabled_suggestion, suggestionNode),
    ...sanitizeGroundedExtra(groundedExtra),
    enabled_validator: scalars.enabled_validator,
    ...Object.fromEntries(GROUNDED_NODE_KEYS.map((key) => [key, serializeNodeConfig(nodeStates[key]!)]))
  }
}
