import type { AsyncData, UseFetchOptions } from 'nuxt/app'
import type { FetchError } from 'ofetch'

type ApiFetchRequest = string | Ref<string | null | undefined> | (() => string | null | undefined)

export function useApiFetch<T>(
  request: ApiFetchRequest,
  opts?: Omit<UseFetchOptions<T>, '$fetch'>
): AsyncData<T, FetchError | null> {
  const apiFetch = useRequestFetch()
  return useFetch(
    request as never,
    {
      ...opts,
      $fetch: apiFetch as typeof $fetch
    } as never
  ) as AsyncData<T, FetchError | null>
}
