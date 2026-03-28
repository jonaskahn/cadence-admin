import { COOKIE_ACCESS_TOKEN } from '~/constants'

import { BFF_CODE_NO_AUTH, respondWithBackendError, respondWithFlatBffError } from '../../../utils/flat-error'

/** Proxy: POST /oauth2/consent/decision with Bearer cookie session. */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const backendUrl = String(config.backendUrl).replace(/\/$/, '')
  const token = getCookie(event, COOKIE_ACCESS_TOKEN)
  if (!token) {
    return respondWithFlatBffError(event, 401, BFF_CODE_NO_AUTH, 'Not authenticated')
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
    return respondWithBackendError(event, res, text, true)
  }
  try {
    return JSON.parse(text) as { redirect_to?: string }
  } catch {
    return { raw: text }
  }
})
