<script setup lang="ts">
import type { GlobalSettingResponse } from '~/types'
import { SETTINGS_GROUPS } from '~/constants'

const toast = useToast()
const { data: settings, refresh } = await useFetch<GlobalSettingResponse[]>('/api/admin/settings')

const editValues = ref<Record<string, string>>({})
const saving = ref<Record<string, boolean>>({})

watch(
  settings,
  (vals) => {
    if (vals) {
      for (const s of vals) {
        editValues.value[s.key] = String(s.value)
      }
    }
  },
  { immediate: true }
)

async function saveSetting(key: string) {
  saving.value[key] = true
  try {
    await $fetch(`/api/admin/settings/${key}`, {
      method: 'PATCH',
      body: { value: editValues.value[key] }
    })
    await refresh()
    toast.add({
      title: 'Setting updated',
      description: 'Broadcast to all nodes via RabbitMQ.',
      icon: 'i-lucide-check'
    })
  } catch {
    toast.add({ title: 'Failed to update setting', color: 'error' })
  } finally {
    saving.value[key] = false
  }
}

const grouped = computed(() => {
  if (!settings.value) return []
  const byKey = Object.fromEntries(settings.value.map((s) => [s.key, s]))
  return Object.entries(SETTINGS_GROUPS)
    .map(([label, keys]) => ({
      label,
      items: keys.flatMap((k) => (byKey[k] ? [byKey[k]] : []))
    }))
    .filter((g) => g.items.length > 0)
})

const ungrouped = computed(() => {
  if (!settings.value) return []
  const assigned = new Set(Object.values(SETTINGS_GROUPS).flat())
  return settings.value.filter((s) => !assigned.has(s.key))
})
</script>

<template>
  <UDashboardPanel id="admin-settings">
    <template #header>
      <UDashboardNavbar title="Global Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 flex flex-col gap-6">
        <UAlert
          icon="i-lucide-radio"
          color="info"
          variant="subtle"
          title="Platform-wide defaults"
          description="Changes are broadcast to all nodes via RabbitMQ and take effect immediately. Organization and instance settings take priority over these defaults."
        />

        <template v-for="group in grouped" :key="group.label">
          <UCard>
            <template #header>
              <p class="font-semibold text-sm">
                {{ group.label }}
              </p>
            </template>
            <div class="flex flex-col divide-y divide-default">
              <div
                v-for="setting in group.items"
                :key="setting.key"
                class="py-4 flex items-start gap-4"
              >
                <div class="flex-1">
                  <p class="font-medium text-sm">
                    {{ setting.description }}
                  </p>
                  <p class="text-dimmed text-xs font-mono mt-0.5">
                    {{ setting.key }}
                  </p>
                  <UBadge variant="subtle" size="xs" class="mt-1">
                    {{ setting.value_type }}
                  </UBadge>
                </div>
                <div class="flex items-center gap-2 min-w-56">
                  <UInput v-model="editValues[setting.key]" class="flex-1" size="sm" />
                  <UButton
                    label="Save"
                    size="sm"
                    :loading="saving[setting.key]"
                    @click="saveSetting(setting.key)"
                  />
                </div>
              </div>
            </div>
          </UCard>
        </template>

        <UCard v-if="ungrouped.length">
          <template #header>
            <p class="font-semibold text-sm">Other</p>
          </template>
          <div class="flex flex-col divide-y divide-default">
            <div
              v-for="setting in ungrouped"
              :key="setting.key"
              class="py-4 flex items-start gap-4"
            >
              <div class="flex-1">
                <p class="font-medium text-sm">
                  {{ setting.description }}
                </p>
                <p class="text-dimmed text-xs font-mono mt-0.5">
                  {{ setting.key }}
                </p>
                <UBadge variant="subtle" size="xs" class="mt-1">
                  {{ setting.value_type }}
                </UBadge>
              </div>
              <div class="flex items-center gap-2 min-w-56">
                <UInput v-model="editValues[setting.key]" class="flex-1" size="sm" />
                <UButton
                  label="Save"
                  size="sm"
                  :loading="saving[setting.key]"
                  @click="saveSetting(setting.key)"
                />
              </div>
            </div>
          </div>
        </UCard>

        <p v-if="!settings?.length" class="text-dimmed text-sm text-center py-4">
          No global settings.
        </p>
      </div>
    </template>
  </UDashboardPanel>
</template>
