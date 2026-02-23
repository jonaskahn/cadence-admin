export const SETTINGS_GROUPS: Record<string, string[]> = {
  LLM: [
    'default_llm_provider',
    'default_model_name',
    'default_llm_temperature',
    'default_llm_max_tokens',
    'llm_request_timeout',
    'llm_max_retries',
    'llm_retry_delay'
  ],
  Pool: [
    'max_hot_pool_size',
    'prewarm_strategy',
    'prewarm_count',
    'warm_tier_ttl',
    'pool_refresh_interval',
    'health_check_interval'
  ],
  Caching: [
    'enable_semantic_cache',
    'semantic_cache_similarity_threshold',
    'semantic_cache_provider',
    'semantic_cache_ttl',
    'embedding_provider',
    'embedding_model'
  ],
  'Rate Limiting': [
    'rate_limit_requests_per_minute',
    'enable_rate_limiting',
    'rate_limit_window',
    'rate_limit_burst'
  ],
  Conversation: [
    'max_conversation_history',
    'enable_message_compaction',
    'message_compaction_threshold',
    'message_compaction_mode',
    'conversation_retention_days'
  ],
  Orchestration: [
    'max_agent_hops',
    'max_tool_execution_time',
    'consecutive_agent_route_limit',
    'default_invoke_timeout',
    'default_parallel_tool_calls',
    'enable_llm_validation'
  ],
  Streaming: ['default_enable_streaming', 'sse_heartbeat_interval', 'sse_timeout'],
  Checkpointing: ['enable_checkpointing', 'checkpoint_storage', 'checkpoint_retention'],
  'Feature Flags': [
    'enable_multi_tier_pool',
    'enable_shared_resources',
    'enable_hot_reload',
    'enable_tenant_isolation'
  ]
}
