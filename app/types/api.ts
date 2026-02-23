// API types generated from OpenAPI schema

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
}

export interface AboutMeResponse {
  user_id: string
  is_sys_admin: boolean
}

export interface OrgAccessResponse {
  org_id: string
  org_name: string
  role: string // 'org_admin' | 'user' | 'sys_admin'
}

export interface OrgWithRoleResponse {
  org_id: string
  name: string
  status: string
  created_at: string
  role: string
}

export interface OrganizationResponse {
  org_id: string
  name: string
  status: string
  created_at: string
}

export interface CreateOrganizationRequest {
  name: string
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
  settings: PluginSetting[]
}

export interface ActivatePluginVersionRequest {
  pid: string
  version: string
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
  plugin_settings: Record<string, PluginSettingsEntry>
  config_hash: string | null
  created_at: string
  updated_at: string
}

export interface CreateOrchestratorRequest {
  name: string
  framework_type: 'langgraph' | 'openai_agents' | 'google_adk'
  mode: 'supervisor' | 'coordinator' | 'handoff'
  active_plugins: string[]
  tier?: 'hot' | 'warm' | 'cold'
  config?: Record<string, unknown> | null
}

export interface UpdateOrchestratorConfigRequest {
  config: Record<string, unknown>
}

export interface UpdateOrchestratorStatusRequest {
  status: 'active' | 'suspended'
}

export interface LoadOrchestratorRequest {
  tier?: 'hot' | 'warm' | 'cold'
}

export interface UpdatePluginSettingsRequest {
  plugin_settings: Record<string, PluginSettingsEntry>
}

export interface SyncPluginSettingsRequest {
  // no body required
}

export interface PluginMetadataResponse {
  id: number
  pid: string
  name: string
  version: string
  description: string
  tag: string | null
  is_latest: boolean
  capabilities: string[]
  agent_type: string
  stateless: boolean
  source: string
  default_settings: Record<string, unknown>
}

export interface SystemPluginResponse {
  id: number
  pid: string
  version: string
  name: string
  description: string | null
  tag: string | null
  is_latest: boolean
  s3_path: string | null
  default_settings: Record<string, unknown>
  capabilities: unknown[]
  agent_type: string
  stateless: boolean
  is_active: boolean
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
  deleted: boolean
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
  created_at: string
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
  aliases: string[]
}

export interface TenantSettingResponse {
  key: string
  value: unknown
  value_type: string
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
  warm_tier_count: number
  cold_tier_count: number
  shared_model_count: number
  shared_bundle_count: number
  memory_estimate_mb: number
}
