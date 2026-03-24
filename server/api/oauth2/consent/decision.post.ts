import { COOKIE_ACCESS_TOKEN } from '~/constants'

/** Proxy: POST /oauth2/consent/decision with Bearer cookie session. */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const backendUrl = String(config.backendUrl).replace(/\/$/, '')
  const token = getCookie(event, COOKIE_ACCESS_TOKEN)
  if (!token) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }
  const body = await readBody(event)
  const res = await fetch(`${backendUrl}/oauth2/consent/decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body ?? {})
  })
  const text = await res.text()
  if (!res.ok) {
    throw createError({ statusCode: res.status, message: text })
  }
  try {
    return JSON.parse(text) as { redirect_to?: string }
  } catch {
    return { raw: text }
  }
})
