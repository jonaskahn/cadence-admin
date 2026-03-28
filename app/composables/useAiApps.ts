import type {
  ActivatePluginVersionRequest,
  CreateOrchestratorRequest,
  GraphDefinitionResponse,
  OrchestratorResponse,
  UpdateOrchestratorMetadataRequest,
  UpdatePluginSettingsRequest
} from '~/types'
import { getFetchErrorStatus } from '~/utils'

function updateAiAppInList(list: OrchestratorResponse[], instanceId: string, updated: OrchestratorResponse): void {
  const index = list.findIndex((o) => o.instance_id === instanceId)
  if (index >= 0) {
    list[index] = updated
  }
}

export function useAiApps() {
  const auth = useAuth()
  const toast = useToast()
  const { t } = useI18n()
  const { showError } = useApiErrorToast()
  const orgId = computed(() => auth.currentOrgId.value || '')

  const aiApps = ref<OrchestratorResponse[]>([])
  const loading = ref(false)

  async function withErrorToast<T>(action: () => Promise<T>, errorTitleKey: string): Promise<T> {
    try {
      return await action()
    } catch (err) {
      showError(err, t(errorTitleKey))
      throw err
    }
  }

  async function fetchAll(): Promise<void> {
    if (!orgId.value) return
    loading.value = true
    try {
      aiApps.value = await $fetch<OrchestratorResponse[]>(`/api/orgs/${orgId.value}/orchestrators`)
    } catch (err: unknown) {
      showError(err, t('aiAppApi.failedLoadList'))
    } finally {
      loading.value = false
    }
  }

  async function create(data: CreateOrchestratorRequest): Promise<OrchestratorResponse> {
    try {
      const result = await $fetch<OrchestratorResponse>(`/api/orgs/${orgId.value}/orchestrators`, {
        method: 'POST',
        body: data
      })
      await fetchAll()
      toast.add({ title: t('aiAppApi.created'), color: 'success', icon: 'i-lucide-check' })
      return result
    } catch (err: unknown) {
      showError(err, t('aiAppApi.failedCreate'), t('aiAppApi.createFailedFallback'))
      throw err
    }
  }

  async function deactivate(instanceId: string): Promise<void> {
    try {
      await $fetch(`/api/orgs/${orgId.value}/orchestrators/${instanceId}`, { method: 'DELETE' })
      await fetchAll()
      toast.add({ title: t('aiAppApi.deactivated'), icon: 'i-lucide-check' })
    } catch {
      toast.add({ title: t('aiAppApi.failedDeactivate'), color: 'error' })
    }
  }

  async function purge(instanceId: string): Promise<void> {
    try {
      await $fetch(`/api/orgs/${orgId.value}/orchestrators/${instanceId}/purge`, { method: 'DELETE' })
      await fetchAll()
      toast.add({ title: t('aiAppApi.purged'), icon: 'i-lucide-check' })
    } catch (err: unknown) {
      const status = getFetchErrorStatus(err)
      if (status === 409) {
        toast.add({ title: t('errors.purgeReferencedError'), color: 'error' })
      } else {
        toast.add({ title: t('aiAppApi.failedPurge'), color: 'error' })
      }
      throw err
    }
  }

  async function activate(instanceId: string): Promise<void> {
    try {
      const result = await $fetch<OrchestratorResponse>(`/api/orgs/${orgId.value}/orchestrators/${instanceId}/status`, {
        method: 'PATCH',
        body: { status: 'active' }
      })
      updateAiAppInList(aiApps.value, instanceId, result)
      toast.add({ title: t('aiAppApi.activated'), icon: 'i-lucide-check' })
    } catch {
      toast.add({ title: t('aiAppApi.failedActivate'), color: 'error' })
    }
  }

  async function load(instanceId: string, tier = 'hot'): Promise<void> {
    try {
      await $fetch(`/api/orgs/${orgId.value}/orchestrators/${instanceId}/load`, {
        method: 'POST',
        body: { tier }
      })
      toast.add({ title: t('aiAppApi.loadSent'), icon: 'i-lucide-check' })
    } catch {
      toast.add({ title: t('aiAppApi.failedLoad'), color: 'error' })
    }
  }

  async function unload(instanceId: string): Promise<void> {
    try {
      await $fetch(`/api/orgs/${orgId.value}/orchestrators/${instanceId}/unload`, {
        method: 'POST'
      })
      toast.add({ title: t('aiAppApi.unloadSent'), icon: 'i-lucide-check' })
    } catch {
      toast.add({ title: t('aiAppApi.failedUnload'), color: 'error' })
    }
  }

  async function updateStatus(instanceId: string, status: 'active' | 'suspended'): Promise<void> {
    try {
      const result = await $fetch<OrchestratorResponse>(`/api/orgs/${orgId.value}/orchestrators/${instanceId}/status`, {
        method: 'PATCH',
        body: { status }
      })
      updateAiAppInList(aiApps.value, instanceId, result)
      toast.add({ title: t('aiAppApi.statusSet', { status }), icon: 'i-lucide-check' })
    } catch {
      toast.add({ title: t('aiAppApi.failedUpdateStatus'), color: 'error' })
    }
  }

  async function updateMetadata(
    instanceId: string,
    payload: UpdateOrchestratorMetadataRequest
  ): Promise<OrchestratorResponse> {
    return withErrorToast(async () => {
      const result = await $fetch<OrchestratorResponse>(`/api/orgs/${orgId.value}/orchestrators/${instanceId}`, {
        method: 'PATCH',
        body: payload
      })
      updateAiAppInList(aiApps.value, instanceId, result)
      toast.add({ title: t('aiAppApi.updated'), icon: 'i-lucide-check' })
      return result
    }, 'aiAppApi.failedUpdate')
  }

  async function updateConfig(instanceId: string, config: Record<string, unknown>): Promise<OrchestratorResponse> {
    return withErrorToast(async () => {
      const result = await $fetch<OrchestratorResponse>(`/api/orgs/${orgId.value}/orchestrators/${instanceId}/config`, {
        method: 'PATCH',
        body: { config }
      })
      updateAiAppInList(aiApps.value, instanceId, result)
      toast.add({ title: t('aiAppApi.configUpdated'), icon: 'i-lucide-check' })
      return result
    }, 'aiAppApi.failedUpdateConfig')
  }

  async function updatePluginSettings(
    instanceId: string,
    pluginSettings: UpdatePluginSettingsRequest['plugin_settings']
  ): Promise<OrchestratorResponse> {
    return withErrorToast(async () => {
      const result = await $fetch<OrchestratorResponse>(
        `/api/orgs/${orgId.value}/orchestrators/${instanceId}/plugin-settings`,
        {
          method: 'PATCH',
          body: { plugin_settings: pluginSettings }
        }
      )
      updateAiAppInList(aiApps.value, instanceId, result)
      toast.add({ title: t('aiAppApi.pluginSettingsUpdated'), icon: 'i-lucide-check' })
      return result
    }, 'aiAppApi.failedUpdatePluginSettings')
  }

  async function fetchGraph(instanceId: string): Promise<GraphDefinitionResponse> {
    return $fetch<GraphDefinitionResponse>(`/api/orgs/${orgId.value}/orchestrators/${instanceId}/graph`)
  }

  async function activatePluginVersion(
    instanceId: string,
    pid: string,
    version: string,
    source: string
  ): Promise<OrchestratorResponse> {
    const body: ActivatePluginVersionRequest = { pid, version, source: source as 'system' | 'org' }
    return withErrorToast(async () => {
      const result = await $fetch<OrchestratorResponse>(
        `/api/orgs/${orgId.value}/orchestrators/${instanceId}/plugin-settings/activate`,
        {
          method: 'POST',
          body
        }
      )
      updateAiAppInList(aiApps.value, instanceId, result)
      toast.add({
        title: t('aiAppApi.pluginVersionActivated', { pluginRef: `${source}:${pid}@${version}` }),
        icon: 'i-lucide-check'
      })
      return result
    }, 'aiAppApi.failedActivatePluginVersion')
  }

  return {
    aiApps,
    loading,
    orgId,
    fetchAll,
    create,
    deactivate,
    remove: deactivate,
    purge,
    activate,
    load,
    unload,
    updateStatus,
    updateMetadata,
    updateConfig,
    updatePluginSettings,
    activatePluginVersion,
    fetchGraph
  }
}
