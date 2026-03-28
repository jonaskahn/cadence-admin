<script lang="ts" setup>
import type { PoolStatsResponse } from '~/types'
import { POOL_STATS_REFRESH_MS } from '~/utils'

const STAT_ICON_COLOR: Record<string, string> = {
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info'
}

const { t } = useI18n()
const { data: stats, refresh } = await useApiFetch<PoolStatsResponse>('/api/admin/pool/stats')

const timer = ref<ReturnType<typeof setInterval> | null>(null)

onMounted(() => {
  timer.value = setInterval(() => refresh(), POOL_STATS_REFRESH_MS)
})

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value)
})

const statCards = computed(() => {
  if (!stats.value) return []
  return [
    { label: t('admin.totalInstances'), value: stats.value.total_instances, icon: 'i-lucide-cpu' },
    {
      label: t('admin.hotTier'),
      value: stats.value.hot_tier_count,
      icon: 'i-lucide-flame',
      color: 'error'
    },
    {
      label: t('admin.demandPool'),
      value: stats.value.demand_pool_count,
      icon: 'i-lucide-thermometer',
      color: 'warning'
    },
    { label: t('admin.sharedModels'), value: stats.value.shared_model_count, icon: 'i-lucide-share-2' },
    { label: t('admin.sharedBundles'), value: stats.value.shared_bundle_count, icon: 'i-lucide-package' }
  ]
})
</script>

<template>
  <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
    <UDashboardPanel id="admin-pool">
      <template #header>
        <UDashboardNavbar :title="t('admin.pool')">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <div class="flex items-center gap-2">
              <InfoPopover title-key="info.admin.pool.title" description-key="info.admin.pool.description" />
              <UButton icon="i-lucide-refresh-cw" :label="t('common.refresh')" size="sm" @click="refresh()" />
            </div>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="flex flex-col gap-2 pt-2 pr-6 pl-6">
          <div class="grid grid-cols-2 gap-4 md:grid-cols-3">
            <UCard v-for="card in statCards" :key="card.label" variant="soft">
              <div class="flex items-center gap-3">
                <UIcon :class="['size-8', STAT_ICON_COLOR[card.color ?? ''] ?? 'text-primary']" :name="card.icon" />
                <div>
                  <p class="text-2xl font-bold">
                    {{ card.value }}
                  </p>
                  <p class="text-dimmed text-sm">
                    {{ card.label }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>

          <UCard v-if="stats" variant="soft">
            <template #header>
              <p class="font-semibold">{{ t('admin.memoryEstimate') }}</p>
            </template>
            <div class="flex items-center gap-4">
              <UIcon class="text-primary size-10" name="i-lucide-memory-stick" />
              <div>
                <p class="text-3xl font-bold">
                  {{ stats.memory_estimate_mb.toFixed(1) }}
                  <span class="text-dimmed text-lg">{{ t('common.memoryUnitMB') }}</span>
                </p>
                <p class="text-dimmed text-sm">{{ t('admin.memoryEstimateDescription') }}</p>
              </div>
            </div>
          </UCard>

          <p class="text-dimmed text-center text-xs">{{ t('admin.autoRefresh') }}</p>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
