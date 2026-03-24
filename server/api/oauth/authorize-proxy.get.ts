/**
 * BFF entry for OAuth authorize: browser hits Nuxt only; server forwards to Cadence AS.
 * Query string is passed through; Location from AS (consent redirect) is returned to the client.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const backendUrl = String(config.backendUrl).replace(/\/$/, '')
  const q = getQuery(event)
  const url = new URL(`${backendUrl}/oauth2/authorize`)
  for (const [key, value] of Object.entries(q)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value))
    }
  }
  const res = await fetch(url.toString(), { method: 'GET', redirect: 'manual' })
  const loc = res.headers.get('location')
  if (res.status >= 300 && res.status < 400 && loc) {
    return sendRedirect(event, loc, res.status)
  }
  const text = await res.text()
  throw createError({ statusCode: res.status, message: text.slice(0, 500) })
})
