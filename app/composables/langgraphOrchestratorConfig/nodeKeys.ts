/**
 * Per-node LLM config USelect: Radix Select disallows `value=""` on items (empty is reserved for clear).
 * Persisted `llm_config_id` still uses '' to mean inherit top default.
 */
export const INHERIT_TOP_LLM_SELECT_VALUE = '__cadence_inherit_top_llm__' as const

export const SUPERVISOR_NODE_KEYS = [
  'router_node',
  'planner_node',
  'synthesizer_node',
  'validation_node',
  'clarifier_node',
  'responder_node',
  'error_handler_node'
] as const

export type SupervisorNodeKey = (typeof SUPERVISOR_NODE_KEYS)[number]

export const GROUNDED_NODE_KEYS = ['router_node', 'planner_node', 'synthesizer_node', 'validation_node', 'error_handler_node'] as const

export type GroundedNodeKey = (typeof GROUNDED_NODE_KEYS)[number]

export const SUPERVISOR_NODE_LABELS: Record<SupervisorNodeKey, string> = {
  router_node: 'Router',
  planner_node: 'Planner',
  synthesizer_node: 'Synthesizer',
  validation_node: 'Validation',
  clarifier_node: 'Clarifier',
  responder_node: 'Responder',
  error_handler_node: 'Error Handler'
}

export const GROUNDED_NODE_LABELS: Record<GroundedNodeKey, string> = {
  router_node: SUPERVISOR_NODE_LABELS.router_node,
  planner_node: SUPERVISOR_NODE_LABELS.planner_node,
  synthesizer_node: SUPERVISOR_NODE_LABELS.synthesizer_node,
  validation_node: SUPERVISOR_NODE_LABELS.validation_node,
  error_handler_node: SUPERVISOR_NODE_LABELS.error_handler_node
}

export const NODE_KEYS = SUPERVISOR_NODE_KEYS
export type NodeKey = SupervisorNodeKey
export const NODE_LABELS = SUPERVISOR_NODE_LABELS
