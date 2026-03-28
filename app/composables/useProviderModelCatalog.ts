import type { AddProviderModelRequest, ProviderModelCatalogEntry, UpdateProviderModelRequest } from '~/types'

function replaceModelInList(models: ProviderModelCatalogEntry[], updated: ProviderModelCatalogEntry): void {
  const index = models.findIndex((m) => m.id === updated.id)
  if (index >= 0) {
    models[index] = updated
  }
}

export function useProviderModelCatalog() {
  const toast = useToast()
  const { t } = useI18n()
  const { showError } = useApiErrorToast()
  const models = ref<ProviderModelCatalogEntry[]>([])
  const loading = ref(true)

  async function fetchAll(): Promise<void> {
    loading.value = true
    try {
      models.value = await $fetch<ProviderModelCatalogEntry[]>('/api/admin/providers/models')
    } catch {
      toast.add({ title: t('providerModelApi.failedLoadModels'), color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function toggleActive(model: ProviderModelCatalogEntry): Promise<void> {
    const previousState = model.enabled
    model.enabled = !previousState
    try {
      const updated = await $fetch<ProviderModelCatalogEntry>(
        `/api/admin/providers/${model.provider}/models/${model.model_id}`,
        {
          method: 'PATCH',
          body: { enabled: model.enabled } satisfies UpdateProviderModelRequest
        }
      )
      replaceModelInList(models.value, updated)
      toast.add({
        title: updated.enabled ? t('providerModelApi.modelEnabled') : t('providerModelApi.modelDisabled'),
        icon: 'i-lucide-check',
        color: 'success'
      })
    } catch (err: unknown) {
      model.enabled = previousState
      showError(err, t('providerModelApi.errorTitle'), t('providerModelApi.toggleFailedFallback'))
    }
  }

  async function addModel(provider: string, body: AddProviderModelRequest): Promise<ProviderModelCatalogEntry> {
    const created = await $fetch<ProviderModelCatalogEntry>(`/api/admin/providers/${provider}/models`, {
      method: 'POST',
      body
    })
    models.value.push(created)
    return created
  }

  async function updateModel(
    provider: string,
    modelId: string,
    body: UpdateProviderModelRequest
  ): Promise<ProviderModelCatalogEntry> {
    const updated = await $fetch<ProviderModelCatalogEntry>(`/api/admin/providers/${provider}/models/${modelId}`, {
      method: 'PATCH',
      body
    })
    replaceModelInList(models.value, updated)
    return updated
  }

  return { models, loading, fetchAll, toggleActive, addModel, updateModel }
}
