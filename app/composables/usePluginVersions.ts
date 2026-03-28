import type { MaybeRefOrGetter } from 'vue'

import type { PluginMetadataResponse, SystemPluginResponse } from '~/types'

type PluginVersionItem = PluginMetadataResponse | SystemPluginResponse

function resolveValue<T>(v: MaybeRefOrGetter<T>): T {
  return typeof v === 'function' ? (v as () => T)() : (v as { value: T }).value
}

function buildVersionsUrl(orgId: string, pid: string, source: 'system' | 'org', isAdminContext: boolean): string {
  if (isAdminContext) {
    if (source === 'system') {
      return `/api/admin/plugins/${pid}/versions`
    }
    return `/api/admin/orgs/${orgId}/plugins/${pid}/versions`
  }
  return `/api/orgs/${orgId}/plugins/${pid}/versions?source=${source}`
}

export function usePluginVersions(
  pid: MaybeRefOrGetter<string>,
  source: MaybeRefOrGetter<'system' | 'org'>,
  orgId: MaybeRefOrGetter<string>,
  isAdminContext: MaybeRefOrGetter<boolean>
) {
  const versions = ref<PluginVersionItem[]>([])
  const loading = ref(false)
  /** Raw `$fetch` error (preserves flat API body for `getApiError`). */
  const error = ref<unknown>(null)

  async function fetchVersions(): Promise<void> {
    const p = resolveValue(pid)
    const s = resolveValue(source)
    const o = resolveValue(orgId)
    const admin = resolveValue(isAdminContext)

    if (!p || !s || !o) {
      versions.value = []
      error.value = null
      return
    }

    loading.value = true
    error.value = null
    try {
      const url = buildVersionsUrl(o, p, s, admin)
      const data = await $fetch<PluginVersionItem[]>(url)
      versions.value = Array.isArray(data) ? data : []
    } catch (e) {
      error.value = e
      versions.value = []
    } finally {
      loading.value = false
    }
  }

  return { versions, loading, error, fetchVersions }
}
