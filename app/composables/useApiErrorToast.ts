import { getApiError, getApiErrorMessage } from '~/utils'

/**
 * Consistent error toasts for `$fetch` failures: catalog `code`, `message`,
 * and `request_id` when the BFF returns a flat Cadence error body.
 */
export function useApiErrorToast() {
  const toast = useToast()
  const { t } = useI18n()

  function showError(
    err: unknown,
    title: string,
    fallbackMessage?: string,
    /** Appended after the API detail (e.g. password hint). */
    trailingHint?: string
  ) {
    const api = getApiError(err)
    let description = api
      ? [api.code + ': ' + api.message, api.request_id ? `${t('errors.requestId')}: ${api.request_id}` : null]
          .filter(Boolean)
          .join('\n')
      : getApiErrorMessage(err, fallbackMessage ?? t('errors.generic'))
    if (trailingHint) {
      description = description ? `${description}\n\n${trailingHint}` : trailingHint
    }
    toast.add({ title, description, color: 'error' })
  }

  return { showError }
}
