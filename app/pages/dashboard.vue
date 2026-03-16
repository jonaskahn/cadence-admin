<script lang="ts" setup>
import type { OrchestratorResponse, PluginMetadataResponse, PoolStatsResponse } from '~/types'
import { statusColor, tierColor } from '~/utils'
import { Bar, Doughnut, Line } from 'vue-chartjs'

const auth = useAuth()
const { t } = useI18n()
const localePath = useLocalePath()
const orgId = computed(() => auth.currentOrgId.value)

const { data: orchestrators } = await useApiFetch<OrchestratorResponse[]>(() => `/api/orgs/${orgId.value}/orchestrators`, { watch: [orgId] })

const { data: plugins } = await useApiFetch<PluginMetadataResponse[]>(() => `/api/orgs/${orgId.value}/plugins`, { watch: [orgId] })

const apiFetch = useRequestFetch()
const { data: poolStats } = await useAsyncData<PoolStatsResponse | null>('pool-stats', async () => {
  if (!auth.isSysAdmin.value) return null
  try {
    return await apiFetch<PoolStatsResponse>('/api/admin/pool/stats')
  } catch {
    return null
  }
})

const orchestratorColumns = computed(() => [
  { accessorKey: 'name', header: t('dashboard.name') },
  { accessorKey: 'framework_type', header: t('dashboard.framework') },
  { accessorKey: 'mode', header: t('dashboard.mode') },
  { accessorKey: 'tier', header: t('dashboard.tier') },
  { accessorKey: 'status', header: t('dashboard.status') }
])

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

// Fake chart data for demo
const chartOptions = { responsive: true, maintainAspectRatio: false }

const usersChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Active Users',
      data: [42, 58, 71, 89, 102, 124],
      backgroundColor: 'rgba(0, 193, 106, 0.6)',
      borderColor: 'rgb(0, 193, 106)',
      borderWidth: 1
    }
  ]
}

const tokensChartData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Tokens (K)',
      data: [120, 190, 280, 210, 340, 95, 180],
      fill: true,
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      tension: 0.3
    }
  ]
}

const orchestratorTierChartData = computed(() => ({
  labels: ['Hot', 'Warm', 'Cold'],
  datasets: [
    {
      data: [tierCounts.value.hot || 2, tierCounts.value.warm || 3, tierCounts.value.cold || 1],
      backgroundColor: ['rgba(239, 68, 68, 0.7)', 'rgba(34, 197, 94, 0.7)', 'rgba(59, 130, 246, 0.7)'],
      borderWidth: 0
    }
  ]
}))

const chatsChartData = {
  labels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm'],
  datasets: [
    {
      label: 'Chats',
      data: [12, 45, 78, 52, 91, 38],
      backgroundColor: 'rgba(168, 85, 247, 0.6)',
      borderColor: 'rgb(168, 85, 247)',
      borderWidth: 1
    }
  ]
}

const llmCostChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'LLM Cost ($)',
      data: [124, 189, 256, 312, 278, 341],
      fill: true,
      borderColor: 'rgb(234, 179, 8)',
      backgroundColor: 'rgba(234, 179, 8, 0.15)',
      tension: 0.3
    }
  ]
}

const modelUsageChartData = {
  labels: ['GPT-4o', 'Claude 3.5', 'Gemini Pro', 'Llama 3', 'Mistral'],
  datasets: [
    {
      data: [38, 28, 18, 10, 6],
      backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(99, 102, 241, 0.8)', 'rgba(251, 146, 60, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(34, 211, 238, 0.8)'],
      borderWidth: 0
    }
  ]
}

const costByProviderChartData = {
  labels: ['OpenAI', 'Anthropic', 'Google', 'Other'],
  datasets: [
    {
      label: 'Cost ($)',
      data: [420, 285, 156, 89],
      backgroundColor: ['rgba(16, 185, 129, 0.6)', 'rgba(99, 102, 241, 0.6)', 'rgba(251, 146, 60, 0.6)', 'rgba(156, 163, 175, 0.6)'],
      borderColor: ['rgb(16, 185, 129)', 'rgb(99, 102, 241)', 'rgb(251, 146, 60)', 'rgb(156, 163, 175)'],
      borderWidth: 1
    }
  ]
}
</script>

<template>
  <div class="min-w-0 flex-1 flex flex-col overflow-hidden">
    <UDashboardPanel id="dashboard">
      <template #header>
        <UDashboardNavbar :title="t('dashboard.title')">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <InfoPopover title-key="info.pages.dashboard.title" description-key="info.pages.dashboard.description" />
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
                    <p class="text-dimmed text-sm">{{ t('dashboard.totalOrchestrators') }}</p>
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
                    <p class="text-dimmed text-sm">{{ t('dashboard.hotTier') }}</p>
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
                    <p class="text-dimmed text-sm">{{ t('dashboard.plugins') }}</p>
                  </div>
                </div>
              </UCard>

              <UCard v-if="auth.isSysAdmin.value && poolStats">
                <div class="flex items-center gap-3">
                  <UIcon class="size-8 text-warning" name="i-lucide-server" />
                  <div>
                    <p class="text-2xl font-bold">{{ poolStats.memory_estimate_mb.toFixed(0) }} MB</p>
                    <p class="text-dimmed text-sm">{{ t('dashboard.poolMemory') }}</p>
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
                    <p class="text-dimmed text-sm">{{ t('dashboard.warmTier') }}</p>
                  </div>
                </div>
              </UCard>
            </div>
          </template>

          <template v-if="auth.isSysAdmin.value && poolStats">
            <UCard>
              <template #header>
                <p class="font-semibold">{{ t('dashboard.poolStatistics') }}</p>
              </template>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p class="text-dimmed text-sm">{{ t('dashboard.hotTier') }}</p>
                  <p class="text-xl font-bold">
                    {{ poolStats.hot_tier_count }}
                  </p>
                </div>
                <div>
                  <p class="text-dimmed text-sm">{{ t('dashboard.warmTier') }}</p>
                  <p class="text-xl font-bold">
                    {{ poolStats.warm_tier_count }}
                  </p>
                </div>
                <div>
                  <p class="text-dimmed text-sm">{{ t('dashboard.coldTier') }}</p>
                  <p class="text-xl font-bold">
                    {{ poolStats.cold_tier_count }}
                  </p>
                </div>
                <div>
                  <p class="text-dimmed text-sm">{{ t('dashboard.sharedModels') }}</p>
                  <p class="text-xl font-bold">
                    {{ poolStats.shared_model_count }}
                  </p>
                </div>
              </div>
            </UCard>
          </template>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UCard>
              <template #header>
                <p class="font-semibold">{{ t('dashboard.usersOverTime') }}</p>
              </template>
              <ClientOnly>
                <div class="h-64">
                  <Bar :data="usersChartData" :options="chartOptions" />
                </div>
                <template #fallback>
                  <div class="h-64 flex items-center justify-center text-dimmed text-sm">Loading chart...</div>
                </template>
              </ClientOnly>
            </UCard>

            <UCard>
              <template #header>
                <p class="font-semibold">{{ t('dashboard.tokenConsumption') }}</p>
              </template>
              <ClientOnly>
                <div class="h-64">
                  <Line :data="tokensChartData" :options="chartOptions" />
                </div>
                <template #fallback>
                  <div class="h-64 flex items-center justify-center text-dimmed text-sm">Loading chart...</div>
                </template>
              </ClientOnly>
            </UCard>

            <UCard>
              <template #header>
                <p class="font-semibold">{{ t('dashboard.orchestratorByTier') }}</p>
              </template>
              <ClientOnly>
                <div class="h-64 flex items-center justify-center">
                  <div class="size-48">
                    <Doughnut :data="orchestratorTierChartData" :options="chartOptions" />
                  </div>
                </div>
                <template #fallback>
                  <div class="h-64 flex items-center justify-center text-dimmed text-sm">Loading chart...</div>
                </template>
              </ClientOnly>
            </UCard>

            <UCard>
              <template #header>
                <p class="font-semibold">{{ t('dashboard.chatsPerDay') }}</p>
              </template>
              <ClientOnly>
                <div class="h-64">
                  <Bar :data="chatsChartData" :options="chartOptions" />
                </div>
                <template #fallback>
                  <div class="h-64 flex items-center justify-center text-dimmed text-sm">Loading chart...</div>
                </template>
              </ClientOnly>
            </UCard>

            <UCard>
              <template #header>
                <p class="font-semibold">{{ t('dashboard.llmCostOverTime') }}</p>
              </template>
              <ClientOnly>
                <div class="h-64">
                  <Line :data="llmCostChartData" :options="chartOptions" />
                </div>
                <template #fallback>
                  <div class="h-64 flex items-center justify-center text-dimmed text-sm">Loading chart...</div>
                </template>
              </ClientOnly>
            </UCard>

            <UCard>
              <template #header>
                <p class="font-semibold">{{ t('dashboard.modelUsage') }}</p>
              </template>
              <ClientOnly>
                <div class="h-64 flex items-center justify-center">
                  <div class="size-48">
                    <Doughnut :data="modelUsageChartData" :options="chartOptions" />
                  </div>
                </div>
                <template #fallback>
                  <div class="h-64 flex items-center justify-center text-dimmed text-sm">Loading chart...</div>
                </template>
              </ClientOnly>
            </UCard>

            <UCard>
              <template #header>
                <p class="font-semibold">{{ t('dashboard.costByProvider') }}</p>
              </template>
              <ClientOnly>
                <div class="h-64">
                  <Bar :data="costByProviderChartData" :options="chartOptions" />
                </div>
                <template #fallback>
                  <div class="h-64 flex items-center justify-center text-dimmed text-sm">Loading chart...</div>
                </template>
              </ClientOnly>
            </UCard>
          </div>

          <UCard>
            <template #header>
              <p class="font-semibold">{{ t('dashboard.quickActions') }}</p>
            </template>
            <div class="flex flex-wrap gap-3">
              <UButton icon="i-lucide-message-square" :label="t('dashboard.startChat')" :to="localePath('/chat')" />
              <UButton icon="i-lucide-cpu" :label="t('dashboard.viewOrchestrators')" :to="localePath('/orchestrators')" variant="outline" />
              <UButton
                v-if="auth.isOrgAdmin.value"
                icon="i-lucide-puzzle"
                :label="t('dashboard.managePlugins')"
                :to="localePath('/plugins')"
                variant="outline"
              />
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <p class="font-semibold">{{ t('dashboard.orchestrators') }}</p>
                <UButton :label="t('common.viewAll')" size="sm" :to="localePath('/orchestrators')" variant="outline" />
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
              {{ t('dashboard.noOrchestrators') }}
              <template v-if="auth.isOrgAdmin.value || auth.isSysAdmin.value">
                <NuxtLink class="text-primary underline" :to="localePath('/orchestrators')"> {{ t('dashboard.create') }}</NuxtLink>
              </template>
            </p>
          </UCard>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
