/**
 * Returns the UI color variant for an orchestrator tier.
 */
export function tierColor(tier: string): 'error' | 'warning' | 'neutral' {
  if (tier === 'hot') return 'error'
  if (tier === 'warm') return 'warning'
  return 'neutral'
}

/**
 * Returns the UI color variant for an orchestrator status.
 */
export function statusColor(status: string): 'success' | 'warning' | 'neutral' {
  if (status === 'active') return 'success'
  if (status === 'suspended') return 'warning'
  return 'neutral'
}

/**
 * Returns the UI color variant for a user role.
 */
export function roleColor(role: string): 'error' | 'warning' | 'neutral' {
  if (role === 'sys_admin') return 'error'
  if (role === 'org_admin') return 'warning'
  return 'neutral'
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
