<script setup lang="ts">
import type { GlobalSettingResponse } from '~/types'

const toast = useToast()
const { data: settings, refresh } = await useFetch<GlobalSettingResponse[]>('/api/admin/settings')

const editValues = ref<Record<string, string>>({})

watch(settings, (vals) => {
  if (vals) {
    for (const s of vals) {
      editValues.value[s.key] = String(s.value)
    }
  }
}, { immediate: true })

const saving = ref<Record<string, boolean>>({})

async function saveSetting(key: string) {
  saving.value[key] = true
  try {
    await $fetch(`/api/admin/settings/${key}`, {
      method: 'PATCH',
      body: { value: editValues.value[key] }
    })
    await refresh()
    toast.add({ title: 'Setting updated', icon: 'i-lucide-check' })
  } catch {
    toast.add({ title: 'Failed to update setting', color: 'error' })
  } finally {
    saving.value[key] = false
  }
}
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
      <div class="p-6">
        <UCard>
          <div class="flex flex-col divide-y divide-default">
            <div
              v-for="setting in settings"
              :key="setting.key"
              class="py-4 flex items-start gap-4"
            >
              <div class="flex-1">
                <p class="font-medium text-sm">{{ setting.key }}</p>
                <p class="text-dimmed text-xs mt-0.5">{{ setting.description }}</p>
                <UBadge variant="subtle" size="xs" class="mt-1">{{ setting.value_type }}</UBadge>
              </div>
              <div class="flex items-center gap-2 min-w-64">
                <UInput
                  v-model="editValues[setting.key]"
                  :type="setting.value_type === 'bool' ? 'text' : 'text'"
                  class="flex-1"
                  size="sm"
                />
                <UButton
                  label="Save"
                  size="sm"
                  :loading="saving[setting.key]"
                  @click="saveSetting(setting.key)"
                />
              </div>
            </div>

            <p v-if="!settings?.length" class="text-dimmed text-sm text-center py-4">
              No global settings.
            </p>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
