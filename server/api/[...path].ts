import type { H3Event } from 'h3'
import { deleteCookie, getCookie, sendRedirect, sendStream, setCookie } from 'h3'

import { COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN } from '~/constants'

import {
  BFF_CODE_INVALID_JSON,
  BFF_CODE_MISSING_CREDENTIALS,
  BFF_CODE_NO_AUTH_URL,
  BFF_CODE_NO_REFRESH,
  respondWithBackendError,
  respondWithFlatBffError
} from '../utils/flat-error'

const TOKEN_PLACEHOLDER = '[set]'
const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const CONTENT_TYPE_JSON = 'application/json'
const CONTENT_TYPE_FORM = 'application/x-www-form-urlencoded'
const CONTENT_TYPE_MULTIPART = 'multipart/form-data'
const ACCEPT_SSE = 'text/event-stream'

function buildOAuth2TokenUrl(baseUrl: string): string {
  return new URL('/oauth2/token', baseUrl).toString()
}

function buildBackendUrl(baseUrl: string, path: string, query: Record<string, unknown>): URL {
  const url = new URL(`/api/${path}`, baseUrl)
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value))
    }
  }
  return url
}

/** FastAPI routes under `/oauth2/*` (not `/api/oauth2/...`). */
function buildBackendRootPathUrl(baseUrl: string, path: string, query: Record<string, unknown>): URL {
  const url = new URL(`/${path}`, baseUrl)
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value))
    }
  }
  return url
}

function buildBackendRequestUrl(backendUrl: string, path: string, query: Record<string, unknown>): URL {
  if (path.startsWith('oauth2/social/')) {
    return buildBackendRootPathUrl(backendUrl, path, query)
  }
  return buildBackendUrl(backendUrl, path, query)
}

const FORWARD_HEADERS = ['X-API-KEY', 'X-ORG-ID', 'X-INSTANCE-ID', 'X-CENTRAL-ID'] as const

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

type OAuth2TokenSuccess = {
  access_token?: string
  token?: string
  expires_in?: number
  refresh_token?: string
  refresh_expires_in?: number
}

function accessTokenFromOAuth2Response(data: OAuth2TokenSuccess): string | undefined {
  return data.access_token ?? data.token
}

async function handleLogin(
  event: H3Event,
  tokenUrl: string,
  clientId: string,
  body: BodyInit | undefined
): Promise<{ token: string } | Record<string, unknown>> {
  const raw = typeof body === 'string' ? body : JSON.stringify(body ?? {})
  let username: string | undefined
  let password: string | undefined
  try {
    const parsed = JSON.parse(raw) as { username?: string; password?: string }
    username = parsed.username
    password = parsed.password
  } catch {
    return respondWithFlatBffError(event, 400, BFF_CODE_INVALID_JSON, 'Invalid JSON body')
  }
  if (!username || !password) {
    return respondWithFlatBffError(event, 400, BFF_CODE_MISSING_CREDENTIALS, 'username and password required')
  }
  const params = new URLSearchParams()
  params.set('grant_type', 'password')
  params.set('client_id', clientId)
  params.set('username', username)
  params.set('password', password)
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': CONTENT_TYPE_FORM },
    body: params.toString()
  })
  if (!response.ok) {
    const errBody = await response.text()
    return respondWithBackendError(event, response, errBody, true)
  }
  const data = (await response.json()) as OAuth2TokenSuccess
  const accessToken = accessTokenFromOAuth2Response(data)
  if (accessToken) {
    setCookie(event, COOKIE_ACCESS_TOKEN, accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: data.expires_in ?? 60 * 60 * 3
    })
  }
  if (data.refresh_token) {
    setCookie(event, COOKIE_REFRESH_TOKEN, data.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: data.refresh_expires_in ?? 60 * 60 * 24 * 7
    })
  }
  return { token: TOKEN_PLACEHOLDER }
}

async function handleLogout(
  event: H3Event,
  url: string,
  token: string | undefined,
  refreshToken: string | undefined,
  headers: Record<string, string>
): Promise<null> {
  deleteCookie(event, COOKIE_ACCESS_TOKEN, { path: '/' })
  deleteCookie(event, COOKIE_REFRESH_TOKEN, { path: '/' })
  try {
    if (token || refreshToken) {
      const logoutHeaders = { ...headers }
      if (refreshToken) {
        logoutHeaders['X-Refresh-Token'] = refreshToken
      }
      await fetch(url, { method: 'DELETE', headers: logoutHeaders })
    }
  } catch {
    void 0
  }
  setResponseStatus(event, 204)
  return null
}

async function handleRefresh(
  event: H3Event,
  tokenUrl: string,
  clientId: string
): Promise<{ token: string } | Record<string, unknown>> {
  const refreshToken = getCookie(event, COOKIE_REFRESH_TOKEN)
  if (!refreshToken) {
    return respondWithFlatBffError(event, 401, BFF_CODE_NO_REFRESH, 'No refresh token')
  }
  const params = new URLSearchParams()
  params.set('grant_type', 'refresh_token')
  params.set('client_id', clientId)
  params.set('refresh_token', refreshToken)
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': CONTENT_TYPE_FORM },
    body: params.toString()
  })
  if (!response.ok) {
    deleteCookie(event, COOKIE_ACCESS_TOKEN, { path: '/' })
    deleteCookie(event, COOKIE_REFRESH_TOKEN, { path: '/' })
    const errBody = await response.text()
    return respondWithBackendError(event, response, errBody, true)
  }
  const data = (await response.json()) as OAuth2TokenSuccess
  const accessToken = accessTokenFromOAuth2Response(data)
  if (accessToken) {
    setCookie(event, COOKIE_ACCESS_TOKEN, accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: data.expires_in ?? 60 * 60 * 3
    })
  }
  if (data.refresh_token) {
    setCookie(event, COOKIE_REFRESH_TOKEN, data.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: data.refresh_expires_in ?? 60 * 60 * 24 * 7
    })
  }
  return { token: TOKEN_PLACEHOLDER }
}

async function handleOAuthInitiate(
  event: H3Event,
  url: string,
  headers: Record<string, string>
): Promise<Record<string, unknown> | undefined> {
  const response = await fetch(url, { method: 'GET', headers })
  if (!response.ok) {
    const errBody = await response.text()
    return respondWithBackendError(event, response, errBody, true)
  }
  const data = (await response.json()) as { authorization_url?: string }
  if (!data.authorization_url) {
    return respondWithFlatBffError(event, 500, BFF_CODE_NO_AUTH_URL, 'No authorization URL')
  }
  sendRedirect(event, data.authorization_url)
}

async function handleOAuthCallback(
  event: H3Event,
  url: string,
  headers: Record<string, string>
): Promise<Record<string, unknown> | undefined> {
  const response = await fetch(url, { method: 'GET', headers })
  if (!response.ok) {
    deleteCookie(event, COOKIE_ACCESS_TOKEN, { path: '/' })
    deleteCookie(event, COOKIE_REFRESH_TOKEN, { path: '/' })
    const errBody = await response.text()
    return respondWithBackendError(event, response, errBody, true)
  }
  const data = (await response.json()) as OAuth2TokenSuccess
  const accessToken = accessTokenFromOAuth2Response(data)
  if (accessToken) {
    setCookie(event, COOKIE_ACCESS_TOKEN, accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: data.expires_in ?? 60 * 60 * 3
    })
  }
  if (data.refresh_token) {
    setCookie(event, COOKIE_REFRESH_TOKEN, data.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: data.refresh_expires_in ?? 60 * 60 * 24 * 7
    })
  }
  sendRedirect(event, '/org-select')
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
    const errBody = await response.text()
    return respondWithBackendError(event, response, errBody, true)
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
  const oauthAdminClientId = config.oauthAdminClientId as string
  const oauth2TokenUrl = buildOAuth2TokenUrl(backendUrl)

  const path = event.context.params?.path ?? ''
  const method = event.method
  const query = getQuery(event)

  const url = buildBackendRequestUrl(backendUrl, path, query)
  const token = getCookie(event, COOKIE_ACCESS_TOKEN)
  const refreshToken = getCookie(event, COOKIE_REFRESH_TOKEN)
  const headers = buildForwardHeaders(event, token)
  const body = await readRequestBody(event, headers, method)

  const accept = event.headers.get('accept')

  if (path === 'auth/login' && method === 'POST') {
    return await handleLogin(event, oauth2TokenUrl, oauthAdminClientId, body)
  }

  if (path === 'auth/refresh' && method === 'POST') {
    return await handleRefresh(event, oauth2TokenUrl, oauthAdminClientId)
  }

  if (path === 'auth/logout' && method === 'DELETE') {
    return await handleLogout(event, url.toString(), token, refreshToken, headers)
  }

  if (method === 'GET' && path.startsWith('oauth2/social/')) {
    if (path.endsWith('/callback')) {
      return await handleOAuthCallback(event, url.toString(), headers)
    }
    if (path !== 'oauth2/social/providers') {
      return await handleOAuthInitiate(event, url.toString(), headers)
    }
  }

  if (accept?.includes(ACCEPT_SSE)) {
    return await handleStreaming(event, url.toString(), method, headers, body)
  }

  return await handleProxiedRequest(event, url.toString(), method, headers, body)
})
