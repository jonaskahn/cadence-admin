export function useApiFetch<T>(
  url: Parameters<typeof useFetch<T>>[0],
  options?: Parameters<typeof useFetch<T>>[1]
) {
  const headers = useRequestHeaders(['cookie'])
  return useFetch<T>(url, { headers, ...options })
}
