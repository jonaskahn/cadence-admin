/** Proxy: GET /oauth2/consent/context (handoff JWT → client_id, requested_claims). */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const backendUrl = String(config.backendUrl).replace(/\/$/, '')
  const q = getQuery(event)
  const handoff = q.handoff
  if (!handoff || typeof handoff !== 'string') {
    throw createError({ statusCode: 400, message: 'handoff required' })
  }
  const url = new URL(`${backendUrl}/oauth2/consent/context`)
  url.searchParams.set('handoff', handoff)
  const res = await fetch(url.toString(), { method: 'GET' })
  if (!res.ok) {
    const text = await res.text()
    throw createError({ statusCode: res.status, message: text })
  }
  return await res.json()
})
