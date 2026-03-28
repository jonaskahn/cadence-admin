// API types: most align with the Cadence OpenAPI schema; BFF-only shapes are documented below.

/** Flat JSON error from Cadence API or Nuxt BFF (`flat_error_response` / `respondWithBackendError`). */
export interface FlatApiError {
  statusCode: number
  code: string
  message: string
  request_id: string
  /** Present on wire; not shown in UI. */
  timestamp?: string
  stack?: string[]
  field?: string
  details?: Record<string, unknown>
  errors?: Array<{
    code: string
    message: string
    field?: string | null
    details?: Record<string, unknown> | null
  }>
}

/** Body for POST `/api/auth/login` — Nuxt BFF forwards to `POST /oauth2/token` (password grant) and sets HttpOnly cookies. */
export interface BffLoginRequest {
  username: string
  password: string
}

/**
 * JSON returned by the BFF after successful login or refresh. The real JWT is only in HttpOnly cookies (`ca_at` / `ca_rt`).
 */
export type BffAuthSetCookieResponse = { token: '[set]' }

/** GET /api/admin/oauth2/clients */
export interface OAuth2ClientResponse {
  id: string
  client_id: string
  name: string
  client_type: 'public' | 'confidential'
  is_first_party: boolean
  redirect_uris: string[]
  allowed_grant_types: string[]
  allowed_scopes: string[]
  is_active: boolean
}

/** POST /api/admin/oauth2/clients */
export interface OAuth2ClientCreateRequest {
  client_id: string
  name: string
  client_type: 'public' | 'confidential'
  is_first_party: boolean
  redirect_uris: string[]
  allowed_grant_types: string[]
  allowed_scopes: string[]
  client_secret?: string | null
}

/** GET /api/admin/roles */
export interface AdminRoleResponse {
  id: string
  name: string
  description: string | null
  scope: string
  is_built_in: boolean
  permissions: string[]
}

/** POST /api/admin/roles */
export interface RoleCreateRequest {
  name: string
  description?: string | null
  scope: 'system' | 'org'
  permissions: string[]
}

export interface AboutMeResponse {
  user_id: string
  is_sys_admin: boolean
  username?: string | null
  email?: string | null
  display_name?: string | null
  avatar_url?: string | null
  locale?: string | null
  timezone?: string | null
  bio?: string | null
}

/** POST /api/admin/users/api-keys (sys_admin + cadence:system:api_keys:write) */
export interface CreateApiKeyRequest {
  name: string
  scopes: string[]
  org_id?: string | null
  /** ISO 8601 datetime; omit for no expiry */
  expires_at?: string | null
}

/** Response right after creating an API key (includes one-time raw key). */
export interface ApiKeyCreatedResponse {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  raw_key: string
  org_id?: string | null
  expires_at?: string | null
}

/** GET /api/admin/users/api-keys item (sys_admin + cadence:system:api_keys:read) */
export interface ApiKeyListItem {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  created_at?: string | null
  org_id?: string | null
  expires_at?: string | null
  last_used_at?: string | null
  is_active: boolean
}

export interface OrgAccessResponse {
  org_id: string
  org_name: string
  role: 'org_admin' | 'user' | 'sys_admin'
  display_name?: string | null
  domain?: string | null
  tier?: string | null
}

export interface OrgWithRoleResponse {
  org_id: string
  name: string
  status: string
  created_at: string
  role: string
  display_name?: string | null
  domain?: string | null
  tier?: string | null
}

export interface CentralPointResponse {
  id: string
  org_id: string
  orchestrator_id: string
  name: string
  description: string | null
  visibility: 'public' | 'private'
  status: string
  created_at: string
  updated_at: string
  is_deleted?: boolean
}

export interface CreateCentralPointRequest {
  name: string
  description?: string | null
  orchestrator_id: string
  visibility: 'public' | 'private'
}

export interface UpdateCentralPointRequest {
  name?: string | null
  description?: string | null
  orchestrator_id?: string | null
  visibility?: 'public' | 'private' | null
}

export interface TierQuota {
  max_orchestrators: number
  max_central_points: number
  max_members: number
  max_messages_per_month: number
  max_messages_per_day: number
  rate_limit_rpm: number
  rate_chat_limit_rpm: number
  rate_limit_burst: number
  max_llm_configs: number
  description: string
}

export interface TierDefinitionResponse {
  key: string
  tier_name: string
  quota: TierQuota
}

export interface OrganizationResponse {
  org_id: string
  name: string
  status: string
  created_at: string
  display_name?: string | null
  domain?: string | null
  tier: string
  description?: string | null
  contact_email?: string | null
  website?: string | null
  logo_url?: string | null
  country?: string | null
  timezone?: string | null
  is_deleted?: boolean
}

export interface CreateOrganizationRequest {
  name: string
  display_name?: string | null
  domain?: string | null
  tier?: string | null
  description?: string | null
  contact_email?: string | null
  website?: string | null
  logo_url?: string | null
  country?: string | null
  timezone?: string | null
}

export interface OrgProfileUpdateRequest {
  display_name?: string | null
  description?: string | null
  contact_email?: string | null
  website?: string | null
  logo_url?: string | null
  country?: string | null
  timezone?: string | null
}

export interface UpdateOrganizationRequest {
  name?: string | null
  display_name?: string | null
  domain?: string | null
  tier?: string | null
  status?: string | null
  description?: string | null
  contact_email?: string | null
  website?: string | null
  logo_url?: string | null
  country?: string | null
  timezone?: string | null
}

export interface PluginSetting {
  key: string
  value: unknown
}

export interface PluginSettingsEntry {
  id: string
  version: string
  name: string
  active: boolean
  source?: 'system' | 'org'
  logo_image?: string | null
  settings: PluginSetting[]
  /** Schema from plugin metadata; used for correct labels, types, and validation */
  settings_schema?: PluginSettingSchema[]
}

export interface ActivatePluginVersionRequest {
  pid: string
  version: string
  source: 'system' | 'org'
}

export interface OrchestratorResponse {
  instance_id: string
  org_id: string
  name: string
  framework_type: string
  mode: string
  status: string
  config: Record<string, unknown>
  tier: string
  whoami?: string | null
  plugin_settings: Record<string, PluginSettingsEntry>
  config_hash: string | null
  is_ready: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface CreateOrchestratorRequest {
  name: string
  framework_type: string
  mode: string
  active_plugin_ids: string[]
  tier?: 'hot' | 'demand'
  whoami?: string | null
  config?: Record<string, unknown> | null
}

export interface UpdateOrchestratorConfigRequest {
  config: Record<string, unknown>
}

export interface UpdateOrchestratorMetadataRequest {
  name?: string | null
  tier?: 'hot' | 'demand' | null
  whoami?: string | null
  default_llm_config_id?: string | null
}

export interface UpdateOrchestratorStatusRequest {
  status: 'active' | 'suspended'
}

export interface GraphDefinitionResponse {
  mermaid: string | null
  is_ready: boolean
}

export interface UpdatePluginSettingsRequest {
  plugin_settings: Record<string, PluginSettingsEntry>
}

export interface PluginMetadataResponse {
  id: string
  pid: string
  name: string
  version: string
  description: string
  tag: string | null
  is_latest: boolean
  logo_image?: string | null
  settings_schema?: PluginSettingSchema[]
  capabilities: string[]
  is_specialized: boolean
  is_scoped: boolean
  stateless: boolean
  source: string
  default_settings: Record<string, unknown>
  /** Whether this plugin version is enabled (system plugins only; org list may omit) */
  enabled?: boolean
}

export interface SystemPluginResponse {
  id: string
  pid: string
  version: string
  name: string
  description: string | null
  tag: string | null
  is_latest: boolean
  logo_image?: string | null
  settings_schema?: PluginSettingSchema[]
  default_settings: Record<string, unknown>
  capabilities: unknown[]
  is_specialized: boolean
  is_scoped: boolean
  stateless: boolean
  enabled: boolean
}

export interface PluginSettingSchema {
  key: string
  name: string
  type: string
  default: unknown
  description: string
  required: boolean
  sensitive: boolean
}

export interface ConversationSummary {
  id: string
  title: string | null
  created_at: string
  instance_id: string | null
}

/** GET `/api/chat/starters` — localized conversation starters for an orchestrator instance. */
export interface ChatStartersResponse {
  language?: string | null
  questions: string[]
}

/** GET `/api/chat/conversations/{id}/messages` — human-sourced transcript (includes `source`). */
export interface ChatConversationMessageResponse {
  role: 'user' | 'assistant'
  content: string
  source: 'human' | 'compact'
}

export interface ChatRequest {
  instance_id: string
  message: string
  conversation_id?: string | null
}

export interface ChatResponse {
  session_id: string
  response: string
  agent_hops: number
  current_agent: string
}

export interface UserMembershipResponse {
  user_id: string
  username: string
  email: string | null
  is_sys_admin: boolean
  is_admin: boolean
  is_deleted: boolean
  created_at?: string
}

export interface CreateUserRequest {
  username: string
  email?: string | null
  password?: string | null
}

export interface AddOrgMemberRequest {
  user_id: string
  is_admin?: boolean
}

export interface UpdateMembershipRequest {
  is_admin: boolean
}

export interface LLMConfigResponse {
  id: string
  name: string
  provider: string
  base_url: string | null
  additional_config: Record<string, unknown> | null
  is_enabled?: boolean
  created_at: string
  is_deleted?: boolean
}

export interface AddLLMConfigRequest {
  name: string
  provider: string
  api_key: string
  base_url?: string | null
  additional_config?: Record<string, unknown> | null
}

export interface ProviderModelResponse {
  model_id: string
  display_name: string
  model_category: string
  aliases: string[]
}

export interface ProviderModelCatalogEntry {
  id: number
  provider: string
  model_id: string
  display_name: string
  aliases: string[]
  enabled: boolean
  model_category: string
  input_billing_unit: string
  output_billing_unit: string
  input_price_per_unit: string | null
  output_price_per_unit: string | null
  currency: string
}

export interface AddProviderModelRequest {
  model_id: string
  display_name: string
  aliases: string[]
  model_category?: string
  input_billing_unit?: string | null
  output_billing_unit?: string | null
  input_price_per_unit?: string | number | null
  output_price_per_unit?: string | number | null
  currency?: string
}

export interface UpdateProviderModelRequest {
  display_name?: string
  aliases?: string[]
  enabled?: boolean
  model_category?: string
  input_billing_unit?: string | null
  output_billing_unit?: string | null
  input_price_per_unit?: string | number | null
  output_price_per_unit?: string | number | null
  currency?: string
}

export interface TenantSettingResponse {
  key: string
  value: unknown
  value_type: string
  overridable: boolean
}

export interface SetTenantSettingRequest {
  key: string
  value: unknown
}

export interface GlobalSettingResponse {
  key: string
  value: unknown
  value_type: string
  description: string
  overridable: boolean
  category?: string | null
}

export interface UpdateGlobalSettingRequest {
  value: unknown
}

export interface HealthResponse {
  status: string
  postgres?: string | null
  redis?: string | null
  mongodb?: string | null
  error?: string | null
}

export interface HealthCheckResponse {
  instance_id: string
  framework_type: string
  mode: string
  is_ready: boolean
  plugin_count: number
  plugins: string[]
}

export interface PoolStatsResponse {
  total_instances: number
  hot_tier_count: number
  demand_pool_count: number
  shared_model_count: number
  shared_bundle_count: number
  memory_estimate_mb: number
}

export interface FrameworkSupportedProvidersResponse {
  framework_type: string
  supported_providers: string[] | null
  supports_all: boolean
  supported_modes: string[]
}

export interface OrchestratorDefaults {
  default_llm_config_id: string | null
  default_model_name: string | null
  default_max_tokens: number | null
  default_temperature: number | null
  default_timeout: number | null
}

export interface TelemetryConfigResponse {
  enabled: boolean
  service_name: string
  service_version: string
  environment: string
  exporter: string
  endpoint: string
  endpoint_insecure: boolean
  headers: string
  traces_enabled: boolean
  metrics_enabled: boolean
  logs_enabled: boolean
  trace_sampler: string
  trace_sample_rate: number
  metrics_export_interval_ms: number
  instrument_langchain: boolean
  instrument_openai_agents: boolean
  propagation: string
}

export type UpdateTelemetryConfigRequest = TelemetryConfigResponse
