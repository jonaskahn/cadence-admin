import type {
  OrchestratorResponse,
  CreateOrchestratorRequest,
  UpdatePluginSettingsRequest,
  ActivatePluginVersionRequest
} from '~/types'
import { getApiErrorMessage } from '~/utils'

function updateOrchestratorInList(
  orchestrators: OrchestratorResponse[],
  instanceId: string,
  updated: OrchestratorResponse
): void {
  const idx = orchestrators.findIndex((o) => o.instance_id === instanceId)
  if (idx >= 0) {
    orchestrators[idx] = updated
  }
}

export function useOrchestrators() {
  const auth = useAuth()
  const toast = useToast()
  const orgId = computed(() => auth.currentOrgId.value || '')

  const orchestrators = ref<OrchestratorResponse[]>([])
  const loading = ref(false)

  async function fetchAll(): Promise<void> {
    if (!orgId.value) return
    loading.value = true
    try {
      orchestrators.value = await $fetch<OrchestratorResponse[]>(
        `/api/orgs/${orgId.value}/orchestrators`
      )
    } catch {
      toast.add({ title: 'Failed to load orchestrators', color: 'error' })
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
      toast.add({ title: 'Orchestrator created', color: 'success', icon: 'i-lucide-check' })
      return result
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Create failed')
      toast.add({ title: 'Failed to create orchestrator', description: msg, color: 'error' })
      throw err
    }
  }

  async function remove(instanceId: string): Promise<void> {
    try {
      await $fetch(`/api/orgs/${orgId.value}/orchestrators/${instanceId}`, { method: 'DELETE' })
      await fetchAll()
      toast.add({ title: 'Orchestrator deleted', icon: 'i-lucide-check' })
    } catch {
      toast.add({ title: 'Failed to delete orchestrator', color: 'error' })
    }
  }

  async function load(instanceId: string, tier = 'hot'): Promise<void> {
    try {
      await $fetch(`/api/orgs/${orgId.value}/orchestrators/${instanceId}/load`, {
        method: 'POST',
        body: { tier }
      })
      toast.add({ title: 'Load event sent', icon: 'i-lucide-check' })
    } catch {
      toast.add({ title: 'Failed to load orchestrator', color: 'error' })
    }
  }

  async function unload(instanceId: string): Promise<void> {
    try {
      await $fetch(`/api/orgs/${orgId.value}/orchestrators/${instanceId}/unload`, {
        method: 'POST'
      })
      toast.add({ title: 'Unload event sent', icon: 'i-lucide-check' })
    } catch {
      toast.add({ title: 'Failed to unload orchestrator', color: 'error' })
    }
  }

  async function updateStatus(instanceId: string, status: 'active' | 'suspended'): Promise<void> {
    try {
      const result = await $fetch<OrchestratorResponse>(
        `/api/orgs/${orgId.value}/orchestrators/${instanceId}/status`,
        {
          method: 'PATCH',
          body: { status }
        }
      )
      updateOrchestratorInList(orchestrators.value, instanceId, result)
      toast.add({ title: `Status set to ${status}`, icon: 'i-lucide-check' })
    } catch {
      toast.add({ title: 'Failed to update status', color: 'error' })
    }
  }

  async function updateConfig(
    instanceId: string,
    config: Record<string, unknown>
  ): Promise<OrchestratorResponse> {
    try {
      const result = await $fetch<OrchestratorResponse>(
        `/api/orgs/${orgId.value}/orchestrators/${instanceId}/config`,
        {
          method: 'PATCH',
          body: { config }
        }
      )
      updateOrchestratorInList(orchestrators.value, instanceId, result)
      toast.add({ title: 'Config updated', icon: 'i-lucide-check' })
      return result
    } catch (err) {
      toast.add({ title: 'Failed to update config', color: 'error' })
      throw err
    }
  }

  async function updatePluginSettings(
    instanceId: string,
    pluginSettings: UpdatePluginSettingsRequest['plugin_settings']
  ): Promise<OrchestratorResponse> {
    try {
      const result = await $fetch<OrchestratorResponse>(
        `/api/orgs/${orgId.value}/orchestrators/${instanceId}/plugin-settings`,
        {
          method: 'PATCH',
          body: { plugin_settings: pluginSettings }
        }
      )
      updateOrchestratorInList(orchestrators.value, instanceId, result)
      toast.add({ title: 'Plugin settings updated', icon: 'i-lucide-check' })
      return result
    } catch (err) {
      toast.add({ title: 'Failed to update plugin settings', color: 'error' })
      throw err
    }
  }

  async function activatePluginVersion(
    instanceId: string,
    pid: string,
    version: string
  ): Promise<OrchestratorResponse> {
    const body: ActivatePluginVersionRequest = { pid, version }
    try {
      const result = await $fetch<OrchestratorResponse>(
        `/api/orgs/${orgId.value}/orchestrators/${instanceId}/plugin-settings/activate`,
        {
          method: 'POST',
          body
        }
      )
      updateOrchestratorInList(orchestrators.value, instanceId, result)
      toast.add({ title: `Plugin ${pid}@${version} activated`, icon: 'i-lucide-check' })
      return result
    } catch (err) {
      toast.add({ title: 'Failed to activate plugin version', color: 'error' })
      throw err
    }
  }

  return {
    orchestrators,
    loading,
    orgId,
    fetchAll,
    create,
    remove,
    load,
    unload,
    updateStatus,
    updateConfig,
    updatePluginSettings,
    activatePluginVersion
  }
}
