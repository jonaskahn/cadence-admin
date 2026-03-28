<script lang="ts" setup>
import { Bar, Doughnut, Line } from 'vue-chartjs'

import type { OrchestratorResponse, PluginMetadataResponse, PoolStatsResponse } from '~/types'
import { normalizeOrchestratorPoolTier, statusColor, tierColor } from '~/utils'

const auth = useAuth()
const { t } = useI18n()
const localePath = useLocalePath()
const orgId = computed(() => auth.currentOrgId.value)

const { data: orchestrators } = await useApiFetch<OrchestratorResponse[]>(
  () => `/api/orgs/${orgId.value}/orchestrators`,
  { watch: [orgId] }
)

const { data: plugins } = await useApiFetch<PluginMetadataResponse[]>(() => `/api/orgs/${orgId.value}/plugins`, {
  watch: [orgId]
})

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
    cold: countByTier(list, 'cold') + countByTier(list, 'warm'),
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
      backgroundColor: 'rgba(249, 115, 22, 0.65)',
      borderColor: 'rgb(249, 115, 22)',
      borderWidth: 1,
      borderRadius: 4
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
      borderColor: 'rgb(245, 158, 11)',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      tension: 0.3
    }
  ]
}

const orchestratorTierChartData = computed(() => ({
  labels: ['Hot', 'Cold'],
  datasets: [
    {
      data: [tierCounts.value.hot, tierCounts.value.cold],
      backgroundColor: ['rgba(249, 115, 22, 0.85)', 'rgba(120, 113, 108, 0.55)'],
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
      backgroundColor: 'rgba(251, 146, 60, 0.65)',
      borderColor: 'rgb(251, 146, 60)',
      borderWidth: 1,
      borderRadius: 4
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
      borderColor: 'rgb(249, 115, 22)',
      backgroundColor: 'rgba(249, 115, 22, 0.12)',
      tension: 0.3
    }
  ]
}

const modelUsageChartData = {
  labels: ['GPT-4o', 'Claude 3.5', 'Gemini Pro', 'Llama 3', 'Mistral'],
  datasets: [
    {
      data: [38, 28, 18, 10, 6],
      backgroundColor: [
        'rgba(249, 115, 22, 0.85)',
        'rgba(251, 146, 60, 0.80)',
        'rgba(253, 186, 116, 0.75)',
        'rgba(245, 158, 11, 0.70)',
        'rgba(120, 113, 108, 0.55)'
      ],
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
      backgroundColor: [
        'rgba(249, 115, 22, 0.65)',
        'rgba(251, 146, 60, 0.60)',
        'rgba(253, 186, 116, 0.55)',
        'rgba(120, 113, 108, 0.45)'
      ],
      borderColor: ['rgb(249, 115, 22)', 'rgb(251, 146, 60)', 'rgb(253, 186, 116)', 'rgb(120, 113, 108)'],
      borderWidth: 1,
      borderRadius: 4
    }
  ]
}
</script>

<template>
  <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
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
        <div class="flex flex-col gap-10 p-6">
          <template v-if="auth.isOrgAdmin.value">
            <div class="grid grid-cols-2 gap-6 md:grid-cols-4">
              <div class="border-primary border-l-2 py-1 pl-4">
                <p class="text-3xl font-bold tracking-tight">{{ tierCounts.total }}</p>
                <p class="text-dimmed mt-1 text-sm">{{ t('dashboard.totalAiApps') }}</p>
              </div>

              <div class="border-error border-l-2 py-1 pl-4">
                <p class="text-3xl font-bold tracking-tight">{{ tierCounts.hot }}</p>
                <p class="text-dimmed mt-1 text-sm">{{ t('dashboard.hotTier') }}</p>
              </div>

              <div class="border-success border-l-2 py-1 pl-4">
                <p class="text-3xl font-bold tracking-tight">{{ plugins?.length || 0 }}</p>
                <p class="text-dimmed mt-1 text-sm">{{ t('dashboard.plugins') }}</p>
              </div>

              <div v-if="auth.isSysAdmin.value && poolStats" class="border-warning border-l-2 py-1 pl-4">
                <p class="text-3xl font-bold tracking-tight">{{ poolStats.memory_estimate_mb.toFixed(0) }} MB</p>
                <p class="text-dimmed mt-1 text-sm">{{ t('dashboard.poolMemory') }}</p>
              </div>

              <div v-else class="border-info border-l-2 py-1 pl-4">
                <p class="text-3xl font-bold tracking-tight">{{ tierCounts.cold }}</p>
                <p class="text-dimmed mt-1 text-sm">{{ t('dashboard.coldTier') }}</p>
              </div>
            </div>
          </template>

          <template v-if="auth.isSysAdmin.value && poolStats">
            <UCard variant="soft">
              <template #header>
                <p class="font-semibold tracking-tight">{{ t('dashboard.poolStatistics') }}</p>
              </template>
              <div class="grid grid-cols-2 gap-6 md:grid-cols-4">
                <div class="border-error/50 border-l-2 pl-3">
                  <p class="text-dimmed text-sm">{{ t('dashboard.hotTier') }}</p>
                  <p class="text-xl font-bold tabular-nums">{{ poolStats.hot_tier_count }}</p>
                </div>
                <div class="border-success/50 border-l-2 pl-3">
                  <p class="text-dimmed text-sm">{{ t('dashboard.demandPool') }}</p>
                  <p class="text-xl font-bold tabular-nums">{{ poolStats.demand_pool_count }}</p>
                </div>
                <div class="border-info/50 border-l-2 pl-3">
                  <p class="text-dimmed text-sm">{{ t('dashboard.coldTier') }}</p>
                  <p class="text-xl font-bold tabular-nums">{{ poolStats.cold_tier_count }}</p>
                </div>
                <div class="border-neutral/50 border-l-2 pl-3">
                  <p class="text-dimmed text-sm">{{ t('dashboard.sharedModels') }}</p>
                  <p class="text-xl font-bold tabular-nums">{{ poolStats.shared_model_count }}</p>
                </div>
              </div>
            </UCard>
          </template>

          <!-- Row 1: Users + Tokens (60/40 split) -->
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
            <UCard variant="soft">
              <template #header>
                <p class="font-semibold tracking-tight">{{ t('dashboard.usersOverTime') }}</p>
              </template>
              <ClientOnly>
                <div class="h-72">
                  <Bar :data="usersChartData" :options="chartOptions" />
                </div>
                <template #fallback>
                  <div class="text-dimmed flex h-72 items-center justify-center text-sm">Loading chart...</div>
                </template>
              </ClientOnly>
            </UCard>

            <UCard variant="soft">
              <template #header>
                <p class="font-semibold tracking-tight">{{ t('dashboard.tokenConsumption') }}</p>
              </template>
              <ClientOnly>
                <div class="h-72">
                  <Line :data="tokensChartData" :options="chartOptions" />
                </div>
                <template #fallback>
                  <div class="text-dimmed flex h-72 items-center justify-center text-sm">Loading chart...</div>
                </template>
              </ClientOnly>
            </UCard>
          </div>

          <!-- Row 2: Chats + Orchestrator Tier (2fr/1fr) -->
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            <UCard variant="soft">
              <template #header>
                <p class="font-semibold tracking-tight">{{ t('dashboard.chatsPerDay') }}</p>
              </template>
              <ClientOnly>
                <div class="h-72">
                  <Bar :data="chatsChartData" :options="chartOptions" />
                </div>
                <template #fallback>
                  <div class="text-dimmed flex h-72 items-center justify-center text-sm">Loading chart...</div>
                </template>
              </ClientOnly>
            </UCard>

            <UCard variant="soft">
              <template #header>
                <p class="font-semibold tracking-tight">{{ t('dashboard.aiAppsByTier') }}</p>
              </template>
              <ClientOnly>
                <div class="flex h-72 items-center justify-center">
                  <div class="size-52">
                    <Doughnut :data="orchestratorTierChartData" :options="chartOptions" />
                  </div>
                </div>
                <template #fallback>
                  <div class="text-dimmed flex h-72 items-center justify-center text-sm">Loading chart...</div>
                </template>
              </ClientOnly>
            </UCard>
          </div>

          <!-- Row 3: Full-width LLM Cost -->
          <UCard variant="soft">
            <template #header>
              <p class="font-semibold tracking-tight">{{ t('dashboard.llmCostOverTime') }}</p>
            </template>
            <ClientOnly>
              <div class="h-72">
                <Line :data="llmCostChartData" :options="chartOptions" />
              </div>
              <template #fallback>
                <div class="text-dimmed flex h-72 items-center justify-center text-sm">Loading chart...</div>
              </template>
            </ClientOnly>
          </UCard>

          <!-- Row 4: Model Usage + Cost by Provider -->
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">
            <UCard variant="soft">
              <template #header>
                <p class="font-semibold tracking-tight">{{ t('dashboard.modelUsage') }}</p>
              </template>
              <ClientOnly>
                <div class="flex h-72 items-center justify-center">
                  <div class="size-52">
                    <Doughnut :data="modelUsageChartData" :options="chartOptions" />
                  </div>
                </div>
                <template #fallback>
                  <div class="text-dimmed flex h-72 items-center justify-center text-sm">Loading chart...</div>
                </template>
              </ClientOnly>
            </UCard>

            <UCard variant="soft">
              <template #header>
                <p class="font-semibold tracking-tight">{{ t('dashboard.costByProvider') }}</p>
              </template>
              <ClientOnly>
                <div class="h-72">
                  <Bar :data="costByProviderChartData" :options="chartOptions" />
                </div>
                <template #fallback>
                  <div class="text-dimmed flex h-72 items-center justify-center text-sm">Loading chart...</div>
                </template>
              </ClientOnly>
            </UCard>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <p class="text-dimmed text-sm font-medium">{{ t('dashboard.quickActions') }}</p>
            <UButton
              icon="i-lucide-message-square"
              :label="t('dashboard.startChat')"
              :to="localePath('/chat')"
              size="sm"
            />
            <UButton icon="i-lucide-cpu" :label="t('dashboard.viewAiApps')" :to="localePath('/ai-apps')" size="sm" />
            <UButton
              v-if="auth.isOrgAdmin.value"
              icon="i-lucide-puzzle"
              :label="t('dashboard.manageAiAgents')"
              :to="localePath('/agent-store')"
              size="sm"
            />
          </div>

          <UCard variant="soft">
            <template #header>
              <div class="flex items-center justify-between">
                <p class="font-semibold tracking-tight">{{ t('dashboard.aiApps') }}</p>
                <UButton :label="t('common.viewAll')" size="sm" :to="localePath('/ai-apps')" />
              </div>
            </template>

            <template v-if="orchestrators?.length">
              <UTable :columns="orchestratorColumns" :data="orchestrators.slice(0, 5)">
                <template #tier-cell="{ row }">
                  <UBadge
                    :color="tierColor(normalizeOrchestratorPoolTier(row.original.tier))"
                    size="sm"
                    variant="subtle"
                  >
                    {{ normalizeOrchestratorPoolTier(row.original.tier).toUpperCase() }}
                  </UBadge>
                </template>
                <template #status-cell="{ row }">
                  <UBadge :color="statusColor(row.original.status)" size="sm" variant="subtle">
                    {{ row.original.status }}
                  </UBadge>
                </template>
              </UTable>
            </template>

            <p v-else class="text-dimmed py-4 text-center text-sm">
              {{ t('dashboard.noAiApps') }}
              <template v-if="auth.isOrgAdmin.value || auth.isSysAdmin.value">
                <NuxtLink class="text-primary underline" :to="localePath('/ai-apps')">
                  {{ t('dashboard.create') }}</NuxtLink
                >
              </template>
            </p>
          </UCard>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
