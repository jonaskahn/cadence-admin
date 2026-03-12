import type { H3Event } from 'h3'
import { deleteCookie, getCookie, sendStream, setCookie } from 'h3'
import { COOKIE_ACCESS_TOKEN } from '~/constants'

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

const FORWARD_HEADERS = ['X-ORG-ID', 'X-INSTANCE-ID', 'X-CENTRAL-ID'] as const

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
  for (const name of FORWARD_HEADERS) {
    const value = event.headers.get(name)
    if (value) {
      headers[name] = value
    }
  }
  return headers
}

async function readRequestBody(event: H3Event, headers: Record<string, string>, method: string): Promise<BodyInit | undefined> {
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

async function handleLogin(event: H3Event, url: string, headers: Record<string, string>, body: BodyInit | undefined): Promise<{ token: string }> {
  const response = await fetch(url, { method: 'POST', headers, body })
  if (!response.ok) {
    const errBody = await response.text()
    throw createError({ statusCode: response.status, message: errBody })
  }
  const data = (await response.json()) as { token?: string; expires_in?: number }
  if (data.token) {
    setCookie(event, COOKIE_ACCESS_TOKEN, data.token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: data.expires_in ?? 60 * 60 * 3
    })
  }
  return { token: TOKEN_PLACEHOLDER }
}

async function handleLogout(event: H3Event, url: string, token: string | undefined, headers: Record<string, string>): Promise<null> {
  deleteCookie(event, COOKIE_ACCESS_TOKEN, { path: '/' })
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

async function handleStreaming(event: H3Event, url: string, method: string, headers: Record<string, string>, body: BodyInit | undefined): Promise<unknown> {
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
  const token = getCookie(event, COOKIE_ACCESS_TOKEN)
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
