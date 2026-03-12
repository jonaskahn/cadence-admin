/**
 * Auth-related constants. Opaque names for security (less guessable by clients).
 *
 * - ca_at: Access token (JWT). HttpOnly cookie set by server on login.
 * - ca_ctx: Session context (selected org scope). Persists org selection across reloads.
 */
export const COOKIE_ACCESS_TOKEN = 'ca_at'
export const COOKIE_SESSION_CONTEXT = 'ca_ctx'
