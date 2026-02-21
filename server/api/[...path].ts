import { getCookie, setCookie, deleteCookie, sendStream } from 'h3'
import type { H3Event } from 'h3'

const COOKIE_NAME = 'cadence-token'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
const TOKEN_PLACEHOLDER = '[set]'
const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const CONTENT_TYPE_JSON = 'application/json'
const CONTENT_TYPE_MULTIPART = 'multipart/form-data'
const ACCEPT_SSE = 'text/event-stream'

function buildBackendUrl(baseUrl: string, path: string, query: Record<string, unknown>): URL {
  const url = new URL(`/api/${path}`, baseUrl)
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value))
    }
  }
  return url
}

function buildForwardHeaders(event: H3Event, token: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': event.headers.get('content-type') ?? CONTENT_TYPE_JSON
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const accept = event.headers.get('accept')
  if (accept) {
    headers.Accept = accept
  }
  return headers
}

async function readRequestBody(
  event: H3Event,
  headers: Record<string, string>,
  method: string
): Promise<BodyInit | undefined> {
  if (!METHODS_WITH_BODY.has(method)) {
    return undefined
  }
  const isMultipart = headers['Content-Type']?.startsWith(CONTENT_TYPE_MULTIPART)
  if (isMultipart) {
    delete headers['Content-Type']
    return await readFormData(event)
  }
  if (headers['Content-Type'] === CONTENT_TYPE_JSON) {
    const raw = await readBody(event)
    if (raw !== undefined && raw !== null) {
      return JSON.stringify(raw)
    }
  }
  return undefined
}

async function handleLogin(
  event: H3Event,
  url: string,
  headers: Record<string, string>,
  body: BodyInit | undefined
): Promise<{ token: string }> {
  const response = await fetch(url, { method: 'POST', headers, body })
  if (!response.ok) {
    const errBody = await response.text()
    throw createError({ statusCode: response.status, message: errBody })
  }
  const data = (await response.json()) as { token?: string }
  if (data.token) {
    setCookie(event, COOKIE_NAME, data.token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE_SECONDS
    })
  }
  return { token: TOKEN_PLACEHOLDER }
}

async function handleLogout(
  event: H3Event,
  url: string,
  token: string | undefined,
  headers: Record<string, string>
): Promise<null> {
  deleteCookie(event, COOKIE_NAME, { path: '/' })
  try {
    if (token) {
      await fetch(url, { method: 'DELETE', headers })
    }
  } catch {
    void 0
  }
  setResponseStatus(event, 204)
  return null
}

async function handleStreaming(
  event: H3Event,
  url: string,
  method: string,
  headers: Record<string, string>,
  body: BodyInit | undefined
): Promise<unknown> {
  const response = await fetch(url, { method, headers, body })
  if (!response.ok) {
    throw createError({ statusCode: response.status, message: 'Stream error' })
  }
  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')
  return sendStream(event, response.body!)
}

async function handleProxiedRequest(
  event: H3Event,
  url: string,
  method: string,
  headers: Record<string, string>,
  body: BodyInit | undefined
): Promise<unknown> {
  const response = await fetch(url, { method, headers, body })
  setResponseStatus(event, response.status)
  if (response.status === 204) {
    return null
  }
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return await response.json()
  }
  return await response.text()
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const backendUrl = config.backendUrl

  const path = event.context.params?.path ?? ''
  const method = event.method
  const query = getQuery(event)

  const url = buildBackendUrl(backendUrl, path, query)
  const token = getCookie(event, COOKIE_NAME)
  const headers = buildForwardHeaders(event, token)
  const body = await readRequestBody(event, headers, method)

  const accept = event.headers.get('accept')

  if (path === 'auth/login' && method === 'POST') {
    return await handleLogin(event, url.toString(), headers, body)
  }

  if (path === 'auth/logout' && method === 'DELETE') {
    return await handleLogout(event, url.toString(), token, headers)
  }

  if (accept?.includes(ACCEPT_SSE)) {
    return await handleStreaming(event, url.toString(), method, headers, body)
  }

  return await handleProxiedRequest(event, url.toString(), method, headers, body)
})
