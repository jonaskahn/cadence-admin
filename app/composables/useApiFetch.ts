/**
 * Wrapper around useFetch for API calls.
 * Sends cookies for same-origin requests (required for authenticated admin endpoints).
 */
export function useApiFetch<T>(url: string | (() => string | null), options?: Parameters<typeof useFetch>[1]) {
  return useFetch<T>(url, {
    ...options,
    credentials: 'include'
  })
}
