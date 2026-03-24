/** Setting keys that cannot be overridden by orgs (platform-level only) */
export const NON_OVERRIDABLE_SETTING_KEYS = new Set([
  'access_token_ttl_seconds',
  'refresh_token_ttl_seconds',
  'oauth.google.enabled',
  'oauth.github.enabled',
  'oauth.oauth2.enabled',
  'oauth.google.client_id',
  'oauth.google.client_secret',
  'oauth.github.client_id',
  'oauth.github.client_secret',
  'oauth.oauth2.client_id',
  'oauth.oauth2.client_secret',
  'oauth.oauth2.authorization_url',
  'oauth.oauth2.token_url',
  'oauth.oauth2.userinfo_url',
  'oauth.oauth2.scopes'
])

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
  Pool: ['max_hot_pool_size', 'prewarm_strategy', 'prewarm_count', 'warm_tier_ttl', 'pool_refresh_interval', 'health_check_interval'],
  Caching: [
    'enable_semantic_cache',
    'semantic_cache_similarity_threshold',
    'semantic_cache_provider',
    'semantic_cache_ttl',
    'embedding_provider',
    'embedding_model'
  ],
  'Rate Limiting': ['rate_limit_requests_per_minute', 'enable_rate_limiting', 'rate_limit_window', 'rate_limit_burst'],
  Conversation: [
    'max_conversation_history',
    'enable_message_compaction',
    'message_compaction_threshold',
    'message_compaction_mode',
    'conversation_retention_days'
  ],
  Orchestration: [
    'max_agent_hops',
    'max_tool_rounds',
    'node_execution_timeout',
    'consecutive_agent_route_limit',
    'default_invoke_timeout',
    'default_parallel_tool_calls',
    'enable_llm_validation'
  ],
  Streaming: ['default_enable_streaming', 'sse_heartbeat_interval', 'sse_timeout'],
  Checkpointing: ['enable_checkpointing', 'checkpoint_storage', 'checkpoint_retention'],
  'Feature Flags': ['enable_multi_tier_pool', 'enable_shared_resources', 'enable_hot_reload', 'enable_tenant_isolation']
}
