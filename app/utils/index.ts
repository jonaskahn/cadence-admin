import type { FlatApiError } from '~/types'

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
export const TIER_DEMAND = 'demand'

/** Normalizes pool tier for display: only `hot` is distinct; everything else is shown as demand. */
export function normalizeOrchestratorPoolTier(tier: string): 'hot' | 'demand' {
  return tier === TIER_HOT ? TIER_HOT : TIER_DEMAND
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
  if (tier === TIER_DEMAND) return 'warning'
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

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isFlatErrorShape(o: Record<string, unknown>): boolean {
  return typeof o.code === 'string' && typeof o.message === 'string'
}

/** Raw flat error object from `$fetch` / FetchError (`data`, `response._data`) or top-level. */
function getFlatErrorPayload(err: unknown): Record<string, unknown> | null {
  if (!isRecord(err)) return null
  if (isFlatErrorShape(err)) {
    return err
  }
  const data = err.data
  if (isRecord(data) && isFlatErrorShape(data)) {
    return data
  }
  const response = err.response
  if (isRecord(response)) {
    const rd = (response as { _data?: unknown })._data
    if (isRecord(rd) && isFlatErrorShape(rd)) {
      return rd
    }
  }
  return null
}

/** Parse Nuxt / BFF flat API error body; returns null if shape is not a flat Cadence error. */
export function getApiError(err: unknown): FlatApiError | null {
  const raw = getFlatErrorPayload(err)
  if (!raw) return null

  const statusCode =
    typeof raw.statusCode === 'number'
      ? raw.statusCode
      : isRecord(err) && typeof err.statusCode === 'number'
        ? err.statusCode
        : isRecord(err) && typeof err.status === 'number'
          ? err.status
          : 500

  const code = typeof raw.code === 'string' ? raw.code : 'SY-9000'
  const message = typeof raw.message === 'string' ? raw.message : 'Request failed'
  const request_id = typeof raw.request_id === 'string' ? raw.request_id : ''
  const out: FlatApiError = {
    statusCode,
    code,
    message,
    request_id
  }
  if (typeof raw.timestamp === 'string') {
    out.timestamp = raw.timestamp
  }

  if (Array.isArray(raw.stack)) {
    out.stack = raw.stack.filter((l): l is string => typeof l === 'string')
  }
  if (typeof raw.field === 'string') {
    out.field = raw.field
  }
  if (raw.details !== undefined && isRecord(raw.details)) {
    out.details = raw.details
  }
  if (Array.isArray(raw.errors)) {
    out.errors = raw.errors as FlatApiError['errors']
  }

  return out
}

export function getApiErrorCode(err: unknown): string | null {
  return getApiError(err)?.code ?? null
}

export function getApiErrorRequestId(err: unknown): string | null {
  const id = getApiError(err)?.request_id
  return id && id.length > 0 ? id : null
}

/** Flat API / BFF error body on `data` or top-level (Nuxt `$fetch` / `useFetch`). */
function getFlatErrorMessage(err: unknown): string | null {
  if (typeof err !== 'object' || err === null) return null
  const o = err as Record<string, unknown>
  if (typeof o.message === 'string') return o.message
  const data = o.data
  if (typeof data === 'object' && data !== null) {
    const m = (data as Record<string, unknown>).message
    if (typeof m === 'string') return m
  }
  return null
}

function hasStatusMessage(err: unknown): err is { statusMessage: string } {
  return typeof err === 'object' && err !== null && 'statusMessage' in err
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  return getFlatErrorMessage(err) ?? getDetail(err) ?? (hasStatusMessage(err) ? err.statusMessage : fallback)
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
