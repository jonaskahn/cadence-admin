<script setup lang="ts">
import type { HealthResponse, HealthCheckResponse } from '~/types'
import { HEALTH_SERVICE_LABELS } from '~/constants'

const { data: systemHealth } = await useFetch<HealthResponse>('/api/system-health')
const { data: instanceHealth } = await useFetch<HealthCheckResponse[]>('/api/admin/health')

const columns = [
  { accessorKey: 'instance_id', header: 'Instance ID' },
  { accessorKey: 'framework_type', header: 'Framework' },
  { accessorKey: 'mode', header: 'Mode' },
  { accessorKey: 'is_ready', header: 'Ready' },
  { accessorKey: 'plugin_count', header: 'Plugins' }
]
</script>

<template>
  <UDashboardPanel id="admin-health">
    <template #header>
      <UDashboardNavbar title="System Health">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 flex flex-col gap-6">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                :name="
                  systemHealth?.status === 'healthy' ? 'i-lucide-check-circle' : 'i-lucide-x-circle'
                "
                :class="systemHealth?.status === 'healthy' ? 'text-success' : 'text-error'"
                class="size-5"
              />
              <p class="font-semibold">System Status: {{ systemHealth?.status || 'unknown' }}</p>
            </div>
          </template>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div v-for="(label, key) in HEALTH_SERVICE_LABELS" :key="key">
              <p class="text-dimmed text-sm">
                {{ label }}
              </p>
              <div class="flex items-center gap-1 mt-1">
                <UIcon
                  :name="
                    systemHealth?.[key as keyof typeof systemHealth] === 'connected'
                      ? 'i-lucide-circle-check'
                      : 'i-lucide-circle-x'
                  "
                  :class="
                    systemHealth?.[key as keyof typeof systemHealth] === 'connected'
                      ? 'text-success'
                      : 'text-error'
                  "
                  class="size-4"
                />
                <span class="text-sm">{{
                  systemHealth?.[key as keyof typeof systemHealth] || 'unknown'
                }}</span>
              </div>
            </div>
          </div>

          <p v-if="systemHealth?.error" class="mt-3 text-error text-sm">
            {{ systemHealth.error }}
          </p>
        </UCard>

        <UCard>
          <template #header>
            <p class="font-semibold">Orchestrator Instance Health</p>
          </template>

          <UTable :data="instanceHealth || []" :columns="columns">
            <template #instance_id-cell="{ row }">
              <span class="font-mono text-xs">{{ row.original.instance_id }}</span>
            </template>
            <template #is_ready-cell="{ row }">
              <UBadge
                :color="row.original.is_ready ? 'success' : 'error'"
                variant="subtle"
                size="sm"
              >
                {{ row.original.is_ready ? 'ready' : 'not ready' }}
              </UBadge>
            </template>
          </UTable>

          <p v-if="!instanceHealth?.length" class="text-dimmed text-sm text-center py-4">
            No instances loaded.
          </p>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
