import type { CentralPointResponse } from '~/types'

export type CreateCentralPointRequest = {
  name: string
  description?: string | null
  orchestrator_id: string
  visibility: 'public' | 'private'
}

export function useCentralPoints(orgId: ComputedRef<string>) {
  const toast = useToast()
  const { t } = useI18n()
  const centerPoints = ref<CentralPointResponse[]>([])
  const loading = ref(false)

  async function fetchAll(): Promise<void> {
    if (!orgId.value) return
    loading.value = true
    try {
      centerPoints.value = await $fetch<CentralPointResponse[]>(`/api/orgs/${orgId.value}/central-points`)
    } catch {
      toast.add({ title: t('centralPoints.failedLoad'), color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function create(data: CreateCentralPointRequest): Promise<CentralPointResponse> {
    const result = await $fetch<CentralPointResponse>(`/api/orgs/${orgId.value}/central-points`, {
      method: 'POST',
      body: {
        name: data.name,
        description: data.description ?? null,
        orchestrator_id: data.orchestrator_id,
        visibility: data.visibility
      }
    })
    await fetchAll()
    toast.add({ title: t('centralPoints.createdSuccess'), color: 'success', icon: 'i-lucide-check' })
    return result
  }

  async function remove(id: string): Promise<void> {
    await $fetch(`/api/orgs/${orgId.value}/central-points/${id}`, { method: 'DELETE' })
    await fetchAll()
    toast.add({ title: t('centralPoints.deletedSuccess'), color: 'success', icon: 'i-lucide-check' })
  }

  return { centerPoints, loading, fetchAll, create, remove }
}
