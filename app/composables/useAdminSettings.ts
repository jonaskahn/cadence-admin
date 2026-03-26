import type { GlobalSettingResponse } from '~/types'

function coerceValue(value: unknown, valueType: string): unknown {
  const t = (valueType || 'string').toLowerCase()
  if (t === 'boolean' || t === 'bool') {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
    return Boolean(value)
  }
  if (t === 'integer' || t === 'int' || t === 'number') {
    const n = Number(value)
    return Number.isNaN(n) ? 0 : Math.round(n)
  }
  if (t === 'float' || t === 'double') {
    const n = Number(value)
    return Number.isNaN(n) ? 0 : n
  }
  return value != null ? String(value) : ''
}

export function useAdminSettings() {
  const toast = useToast()
  const { t } = useI18n()
  const { withOverlay } = useLoadingOverlay()

  const { data: settings, refresh: refreshSettings } = useApiFetch<GlobalSettingResponse[]>('/api/admin/settings')

  const editValues = ref<Record<string, unknown>>({})
  const overridableValues = ref<Record<string, boolean>>({})
  const saving = ref<Record<string, boolean>>({})

  watch(
    settings,
    (vals) => {
      if (vals) {
        for (const s of vals) {
          editValues.value[s.key] = coerceValue(s.value, s.value_type)
          overridableValues.value[s.key] = s.overridable
        }
      }
    },
    { immediate: true }
  )

  async function saveSetting(key: string) {
    saving.value[key] = true
    try {
      await withOverlay(async () => {
        await $fetch(`/api/admin/settings/${key}`, {
          method: 'PATCH',
          body: { value: editValues.value[key], overridable: overridableValues.value[key] }
        })
        await refreshSettings()
        toast.add({ title: t('admin.settingUpdated'), icon: 'i-lucide-check' })
      })
    } catch {
      toast.add({ title: t('admin.failedUpdateSetting'), color: 'error' })
    } finally {
      saving.value[key] = false
    }
  }

  async function saveMultiple(keys: string[]) {
    for (const key of keys) saving.value[key] = true
    try {
      await withOverlay(async () => {
        for (const key of keys) {
          await $fetch(`/api/admin/settings/${key}`, {
            method: 'PATCH',
            body: { value: editValues.value[key], overridable: overridableValues.value[key] }
          })
        }
        await refreshSettings()
        toast.add({ title: t('admin.settingUpdated'), icon: 'i-lucide-check' })
      })
    } catch {
      toast.add({ title: t('admin.failedUpdateSetting'), color: 'error' })
    } finally {
      for (const key of keys) saving.value[key] = false
    }
  }

  const settingsByCategory = (category: string) =>
    computed(() => (settings.value ?? []).filter((s) => (s.category ?? '') === category))

  const settingByKey = (key: string) => computed(() => (settings.value ?? []).find((s) => s.key === key))

  return {
    settings,
    refreshSettings,
    editValues,
    overridableValues,
    saving,
    saveSetting,
    saveMultiple,
    settingsByCategory,
    settingByKey
  }
}
