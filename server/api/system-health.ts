/**
 * Proxies health check to the backend. Returns backend response or unreachable status.
 */
export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const backendUrl = config.backendUrl

  try {
    const response = await fetch(`${backendUrl}/health`)
    return await response.json()
  } catch {
    return { status: 'unreachable' }
  }
})
