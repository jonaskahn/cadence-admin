<script lang="ts" setup>
import type { OrchestratorResponse, PluginMetadataResponse, PoolStatsResponse } from '~/types'
import { statusColor, tierColor } from '~/utils'

const auth = useAuth()
const orgId = computed(() => auth.currentOrgId.value)

const { data: orchestrators } = await useFetch<OrchestratorResponse[]>(() => `/api/orgs/${orgId.value}/orchestrators`, { watch: [orgId] })

const { data: plugins } = await useFetch<PluginMetadataResponse[]>(() => `/api/orgs/${orgId.value}/plugins`, { watch: [orgId] })

const { data: poolStats } = await useAsyncData<PoolStatsResponse | null>('pool-stats', async () => {
  if (!auth.isSysAdmin.value) return null
  try {
    return await $fetch<PoolStatsResponse>('/api/admin/pool/stats')
  } catch {
    return null
  }
})

const orchestratorColumns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'framework_type', header: 'Framework' },
  { accessorKey: 'mode', header: 'Mode' },
  { accessorKey: 'tier', header: 'Tier' },
  { accessorKey: 'status', header: 'Status' }
]

function countByTier(list: OrchestratorResponse[], tier: string): number {
  return list.filter((o) => o.tier === tier).length
}

const tierCounts = computed(() => {
  const list = orchestrators.value || []
  return {
    hot: countByTier(list, 'hot'),
    warm: countByTier(list, 'warm'),
    cold: countByTier(list, 'cold'),
    total: list.length
  }
})
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 flex flex-col gap-8">
        <template v-if="auth.isOrgAdmin.value">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <UCard>
              <div class="flex items-center gap-3">
                <UIcon class="size-8 text-primary" name="i-lucide-cpu" />
                <div>
                  <p class="text-2xl font-bold">
                    {{ tierCounts.total }}
                  </p>
                  <p class="text-dimmed text-sm">Total Orchestrators</p>
                </div>
              </div>
            </UCard>

            <UCard>
              <div class="flex items-center gap-3">
                <UIcon class="size-8 text-error" name="i-lucide-flame" />
                <div>
                  <p class="text-2xl font-bold">
                    {{ tierCounts.hot }}
                  </p>
                  <p class="text-dimmed text-sm">Hot Tier</p>
                </div>
              </div>
            </UCard>

            <UCard>
              <div class="flex items-center gap-3">
                <UIcon class="size-8 text-success" name="i-lucide-puzzle" />
                <div>
                  <p class="text-2xl font-bold">
                    {{ plugins?.length || 0 }}
                  </p>
                  <p class="text-dimmed text-sm">Plugins</p>
                </div>
              </div>
            </UCard>

            <UCard v-if="auth.isSysAdmin.value && poolStats">
              <div class="flex items-center gap-3">
                <UIcon class="size-8 text-warning" name="i-lucide-server" />
                <div>
                  <p class="text-2xl font-bold">{{ poolStats.memory_estimate_mb.toFixed(0) }} MB</p>
                  <p class="text-dimmed text-sm">Pool Memory</p>
                </div>
              </div>
            </UCard>

            <UCard v-else>
              <div class="flex items-center gap-3">
                <UIcon class="size-8 text-info" name="i-lucide-thermometer" />
                <div>
                  <p class="text-2xl font-bold">
                    {{ tierCounts.warm }}
                  </p>
                  <p class="text-dimmed text-sm">Warm Tier</p>
                </div>
              </div>
            </UCard>
          </div>
        </template>

        <template v-if="auth.isSysAdmin.value && poolStats">
          <UCard>
            <template #header>
              <p class="font-semibold">Pool Statistics</p>
            </template>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p class="text-dimmed text-sm">Hot</p>
                <p class="text-xl font-bold">
                  {{ poolStats.hot_tier_count }}
                </p>
              </div>
              <div>
                <p class="text-dimmed text-sm">Warm</p>
                <p class="text-xl font-bold">
                  {{ poolStats.warm_tier_count }}
                </p>
              </div>
              <div>
                <p class="text-dimmed text-sm">Cold</p>
                <p class="text-xl font-bold">
                  {{ poolStats.cold_tier_count }}
                </p>
              </div>
              <div>
                <p class="text-dimmed text-sm">Shared Models</p>
                <p class="text-xl font-bold">
                  {{ poolStats.shared_model_count }}
                </p>
              </div>
            </div>
          </UCard>
        </template>

        <UCard>
          <template #header>
            <p class="font-semibold">Quick Actions</p>
          </template>
          <div class="flex flex-wrap gap-3">
            <UButton icon="i-lucide-message-square" label="Start Chat" to="/chat" />
            <UButton icon="i-lucide-cpu" label="View Orchestrators" to="/orchestrators" variant="outline" />
            <UButton v-if="auth.isOrgAdmin.value" icon="i-lucide-puzzle" label="Manage Plugins" to="/plugins" variant="outline" />
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <p class="font-semibold">Orchestrators</p>
              <UButton label="View all" size="sm" to="/orchestrators" variant="ghost" />
            </div>
          </template>

          <template v-if="orchestrators?.length">
            <UTable :columns="orchestratorColumns" :data="orchestrators.slice(0, 5)">
              <template #tier-cell="{ row }">
                <UBadge :color="tierColor(row.original.tier)" size="sm" variant="subtle">
                  {{ row?.original?.tier?.toUpperCase() }}
                </UBadge>
              </template>
              <template #status-cell="{ row }">
                <UBadge :color="statusColor(row.original.status)" size="sm" variant="subtle">
                  {{ row.original.status }}
                </UBadge>
              </template>
            </UTable>
          </template>

          <p v-else class="text-dimmed text-sm text-center py-4">
            No orchestrators yet.
            <template v-if="auth.isOrgAdmin.value || auth.isSysAdmin.value">
              <NuxtLink class="text-primary underline" to="/orchestrators"> Create</NuxtLink>
            </template>
          </p>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
