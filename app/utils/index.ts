export const LLM_PROVIDERS = ['openai', 'anthropic', 'google', 'groq', 'azure', 'openai_compatible']

export const TIER_HOT = 'hot'
export const TIER_WARM = 'warm'
export const TIER_COLD = 'cold'

export const STATUS_ACTIVE = 'active'
export const STATUS_SUSPENDED = 'suspended'

export const ROLE_SYS_ADMIN = 'sys_admin'
export const ROLE_ORG_ADMIN = 'org_admin'
export const ROLE_MEMBER = 'member'

export const POOL_STATS_REFRESH_MS = 30_000

export function tierColor(tier: string): 'error' | 'warning' | 'neutral' {
  if (tier === TIER_HOT) return 'error'
  if (tier === TIER_WARM) return 'warning'
  return 'neutral'
}

export function statusColor(status: string): 'success' | 'warning' | 'neutral' {
  if (status === STATUS_ACTIVE) return 'success'
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
