export function orgDisplayName(
  org:
    | {
        display_name?: string | null
        org_name?: string
        name?: string
        domain?: string | null
      }
    | null
    | undefined
): string {
  if (!org) return ''
  return org.display_name ?? org.org_name ?? org.name ?? org.domain ?? ''
}

export const LLM_PROVIDERS = ['openai', 'anthropic', 'google', 'groq', 'azure', 'litellm', 'tensorzero', 'bifrost']

export const SUBSCRIPTION_TIERS = ['free', 'plus', 'pro', 'premium', 'business', 'enterprise'] as const

export function subscriptionTierSelectItems(tiers: readonly string[]): { label: string; value: string }[] {
  return tiers.map((tier) => ({ label: tier.charAt(0).toUpperCase() + tier.slice(1), value: tier }))
}

/** Tiers that allow central points (pro and above). Free, plus, and unknown tiers are excluded. */
export const CENTRAL_POINTS_TIERS = ['pro', 'premium', 'business', 'enterprise'] as const

export function subscriptionTierColor(tier: string): 'success' | 'primary' | 'warning' | 'error' | 'neutral' {
  if (tier === 'free') return 'neutral'
  if (tier === 'plus') return 'success'
  if (tier === 'pro') return 'primary'
  if (tier === 'premium') return 'warning'
  if (tier === 'business') return 'error'
  if (tier === 'enterprise') return 'error'
  return 'neutral'
}

export const PROVIDER_DISPLAY_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google (Gemini)',
  groq: 'Groq',
  azure: 'Azure OpenAI',
  litellm: 'LiteLLM',
  tensorzero: 'Tensorzero',
  bifrost: 'Bifrost'
}

export function providerLabel(provider: string): string {
  return PROVIDER_DISPLAY_LABELS[provider] ?? provider
}

export const TIER_HOT = 'hot'
export const TIER_COLD = 'cold'

/** Maps API tier to hot or cold. Legacy `warm` rows are treated as cold for display. */
export function normalizeOrchestratorPoolTier(tier: string): 'hot' | 'cold' {
  return tier === TIER_HOT ? TIER_HOT : TIER_COLD
}

export const STATUS_ACTIVE = 'active'
export const STATUS_INACTIVE = 'inactive'
export const STATUS_SUSPENDED = 'suspended'

export const ROLE_SYS_ADMIN = 'sys_admin'
export const ROLE_ORG_ADMIN = 'org_admin'
export const ROLE_MEMBER = 'member'

export const POOL_STATS_REFRESH_MS = 30_000

export function tierColor(tier: string): 'error' | 'warning' | 'neutral' {
  if (tier === TIER_HOT) return 'error'
  return 'neutral'
}

export function statusColor(status: string): 'success' | 'warning' | 'neutral' | 'error' {
  if (status === STATUS_ACTIVE) return 'success'
  if (status === STATUS_INACTIVE) return 'neutral'
  if (status === STATUS_SUSPENDED) return 'warning'
  return 'neutral'
}

export function roleColor(role: string): 'error' | 'warning' | 'neutral' {
  if (role === ROLE_SYS_ADMIN) return 'error'
  if (role === ROLE_ORG_ADMIN) return 'warning'
  return 'neutral'
}

export function roleLabel(role: string): string {
  if (role === ROLE_SYS_ADMIN) return ROLE_SYS_ADMIN
  if (role === ROLE_ORG_ADMIN) return ROLE_ORG_ADMIN
  return ROLE_MEMBER
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getDetail(err: unknown): string | null {
  if (typeof err !== 'object' || err === null) return null
  const data = (err as Record<string, unknown>).data
  if (typeof data === 'object' && data !== null) {
    const detail = (data as Record<string, unknown>).detail
    if (typeof detail === 'string') return detail
  }
  return null
}

function hasStatusMessage(err: unknown): err is { statusMessage: string } {
  return typeof err === 'object' && err !== null && 'statusMessage' in err
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  return getDetail(err) ?? (hasStatusMessage(err) ? err.statusMessage : fallback)
}

export function getFetchErrorStatus(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null) return undefined
  const o = err as Record<string, unknown>
  if (typeof o.status === 'number') return o.status
  if (typeof o.statusCode === 'number') return o.statusCode
  return undefined
}

export function toPluginRefKey(source: string, pid: string, version: string): string {
  return `${source}:${pid}@${version}`
}

export function toPluginUniquenessKey(source: string, pid: string): string {
  return `${source}::${pid}`
}
