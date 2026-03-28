/**
 * Flat API error bodies for BFF routes (matches Cadence FastAPI flat JSON shape).
 */
import type { H3Event } from 'h3'
import { setHeader, setResponseStatus } from 'h3'

/** BFF-local catalog codes (not emitted by Python API). */
export const BFF_CODE_INVALID_JSON = 'UI-9001'
export const BFF_CODE_MISSING_CREDENTIALS = 'UI-9002'
export const BFF_CODE_NO_REFRESH = 'UI-9003'
export const BFF_CODE_NO_AUTH = 'UI-9004'
export const BFF_CODE_HANDOFF_REQUIRED = 'UI-9005'
export const BFF_CODE_NO_AUTH_URL = 'UI-9006'

export function bffRequestId(event: H3Event): string {
  return event.headers.get('x-request-id') ?? crypto.randomUUID()
}

export function isBffDev(): boolean {
  return import.meta.dev === true
}

/** Stack lines limited to this server bundle (drops node_modules / Node internals). */
function proxyStackLines(): string[] {
  const err = new Error()
  const lines = (err.stack ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const filtered = lines.filter((l) => l.includes('/server/') && !l.includes('node_modules'))
  const head = lines[0] ?? 'Error'
  return [head, ...filtered]
}

/**
 * Parse backend JSON error, set HTTP status, return flat body.
 * In dev, replaces any backend `stack` with proxy-only frames when replaceStack is true.
 */
export function respondWithBackendError(
  event: H3Event,
  response: Response,
  errBody: string,
  replaceStack: boolean
): Record<string, unknown> {
  const requestId = bffRequestId(event)
  setResponseStatus(event, response.status)
  setHeader(event, 'X-Request-ID', requestId)

  let parsed: Record<string, unknown> | null = null
  try {
    const v = JSON.parse(errBody) as unknown
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      parsed = v as Record<string, unknown>
    }
  } catch {
    void 0
  }

  if (!parsed) {
    const base: Record<string, unknown> = {
      statusCode: response.status,
      code: 'SY-9000',
      message: errBody.slice(0, 2000),
      request_id: requestId,
      timestamp: new Date().toISOString()
    }
    if (isBffDev() && replaceStack) {
      base.stack = proxyStackLines()
    }
    return base
  }

  const code = typeof parsed.code === 'string' ? parsed.code : 'SY-9000'
  const message = typeof parsed.message === 'string' ? parsed.message : 'Request failed'
  const timestamp = typeof parsed.timestamp === 'string' ? parsed.timestamp : new Date().toISOString()
  const reqId = typeof parsed.request_id === 'string' ? parsed.request_id : requestId
  const statusCode = typeof parsed.statusCode === 'number' ? parsed.statusCode : response.status

  const out: Record<string, unknown> = {
    statusCode,
    code,
    message,
    request_id: reqId,
    timestamp
  }
  if (typeof parsed.field === 'string') {
    out.field = parsed.field
  }
  if (parsed.details !== undefined && typeof parsed.details === 'object' && parsed.details !== null) {
    out.details = parsed.details
  }
  if (Array.isArray(parsed.errors)) {
    out.errors = parsed.errors
  }
  if (isBffDev() && replaceStack) {
    out.stack = proxyStackLines()
  } else if (Array.isArray(parsed.stack)) {
    out.stack = parsed.stack
  }
  return out
}

/** Local BFF validation / auth errors (no upstream body). */
export function respondWithFlatBffError(
  event: H3Event,
  statusCode: number,
  code: string,
  message: string
): Record<string, unknown> {
  const requestId = bffRequestId(event)
  setResponseStatus(event, statusCode)
  setHeader(event, 'X-Request-ID', requestId)
  const out: Record<string, unknown> = {
    statusCode,
    code,
    message,
    request_id: requestId,
    timestamp: new Date().toISOString()
  }
  if (isBffDev()) {
    out.stack = proxyStackLines()
  }
  return out
}
