/** Orchestrator tier values. */
export const TIER_HOT = 'hot'
export const TIER_WARM = 'warm'
export const TIER_COLD = 'cold'

/** Orchestrator status values. */
export const STATUS_ACTIVE = 'active'
export const STATUS_SUSPENDED = 'suspended'

/** User role values. */
export const ROLE_SYS_ADMIN = 'sys_admin'
export const ROLE_ORG_ADMIN = 'org_admin'
export const ROLE_MEMBER = 'member'

/** Pool stats refresh interval in milliseconds. */
export const POOL_STATS_REFRESH_MS = 30_000

/**
 * Returns the UI color variant for an orchestrator tier.
 */
export function tierColor(tier: string): 'error' | 'warning' | 'neutral' {
  if (tier === TIER_HOT) return 'error'
  if (tier === TIER_WARM) return 'warning'
  return 'neutral'
}

/**
 * Returns the UI color variant for an orchestrator status.
 */
export function statusColor(status: string): 'success' | 'warning' | 'neutral' {
  if (status === STATUS_ACTIVE) return 'success'
  if (status === STATUS_SUSPENDED) return 'warning'
  return 'neutral'
}

/**
 * Returns the UI color variant for a user role.
 */
export function roleColor(role: string): 'error' | 'warning' | 'neutral' {
  if (role === ROLE_SYS_ADMIN) return 'error'
  if (role === ROLE_ORG_ADMIN) return 'warning'
  return 'neutral'
}

/**
 * Returns the display label for a user role.
 */
export function roleLabel(role: string): string {
  if (role === ROLE_SYS_ADMIN) return ROLE_SYS_ADMIN
  if (role === ROLE_ORG_ADMIN) return ROLE_ORG_ADMIN
  return ROLE_MEMBER
}

/**
 * Formats an ISO date string for display.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Extracts a human-readable error message from an API error.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const obj = err as { statusMessage?: string; status?: number }
  return obj?.statusMessage ?? fallback
}
