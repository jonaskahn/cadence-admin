<script lang="ts" setup>
import type { HealthCheckResponse, HealthResponse } from '~/types'
import { HEALTH_SERVICE_LABELS } from '~/constants'

const { t } = useI18n()
const { data: systemHealth } = await useFetch<HealthResponse>('/api/system-health')
const { data: instanceHealth } = await useApiFetch<HealthCheckResponse[]>('/api/admin/health')

const columns = computed(() => [
  { accessorKey: 'instance_id', header: t('admin.instanceId') },
  { accessorKey: 'framework_type', header: t('dashboard.framework') },
  { accessorKey: 'mode', header: t('dashboard.mode') },
  { accessorKey: 'is_ready', header: t('orchestrators.ready') },
  { accessorKey: 'plugin_count', header: t('admin.plugins') }
])
</script>

<template>
  <UDashboardPanel id="admin-health">
    <template #header>
      <UDashboardNavbar :title="t('admin.health')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <InfoPopover title-key="info.admin.health.title" description-key="info.admin.health.description" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 flex flex-col gap-6">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                :class="systemHealth?.status === 'healthy' ? 'text-success' : 'text-error'"
                :name="systemHealth?.status === 'healthy' ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
                class="size-5"
              />
              <p class="font-semibold">{{ t('admin.systemStatus') }}: {{ systemHealth?.status || t('errors.unknown') }}</p>
            </div>
          </template>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div v-for="(_, key) in HEALTH_SERVICE_LABELS" :key="key">
              <p class="text-dimmed text-sm">
                {{ t(`healthServices.${key}`) }}
              </p>
              <div class="flex items-center gap-1 mt-1">
                <UIcon
                  :class="systemHealth?.[key as keyof typeof systemHealth] === 'connected' ? 'text-success' : 'text-error'"
                  :name="systemHealth?.[key as keyof typeof systemHealth] === 'connected' ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
                  class="size-4"
                />
                <span class="text-sm">{{ systemHealth?.[key as keyof typeof systemHealth] || t('errors.unknown') }}</span>
              </div>
            </div>
          </div>

          <p v-if="systemHealth?.error" class="mt-3 text-error text-sm">
            {{ systemHealth.error }}
          </p>
        </UCard>

        <UCard>
          <template #header>
            <p class="font-semibold">{{ t('admin.orchestratorInstanceHealth') }}</p>
          </template>

          <UTable :columns="columns" :data="instanceHealth || []">
            <template #instance_id-cell="{ row }">
              <span class="font-mono text-xs">{{ row.original.instance_id }}</span>
            </template>
            <template #is_ready-cell="{ row }">
              <UBadge :color="row.original.is_ready ? 'success' : 'error'" size="sm" variant="subtle">
                {{ row.original.is_ready ? t('admin.ready') : t('admin.notReady') }}
              </UBadge>
            </template>
          </UTable>

          <p v-if="!instanceHealth?.length" class="text-dimmed text-sm text-center py-4">{{ t('admin.noInstances') }}</p>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
