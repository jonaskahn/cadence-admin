/** Proxy: GET /oauth2/consent/context (handoff JWT → client_id, requested_claims). */
import { BFF_CODE_HANDOFF_REQUIRED, respondWithBackendError, respondWithFlatBffError } from '../../../utils/flat-error'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const backendUrl = String(config.backendUrl).replace(/\/$/, '')
  const q = getQuery(event)
  const handoff = q.handoff
  if (!handoff || typeof handoff !== 'string') {
    return respondWithFlatBffError(event, 400, BFF_CODE_HANDOFF_REQUIRED, 'handoff required')
  }
  const url = new URL(`${backendUrl}/oauth2/consent/context`)
  url.searchParams.set('handoff', handoff)
  const res = await fetch(url.toString(), { method: 'GET' })
  if (!res.ok) {
    const text = await res.text()
    return respondWithBackendError(event, res, text, true)
  }
  return await res.json()
})
