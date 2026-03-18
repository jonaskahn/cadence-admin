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
      label: t('admin.warmTier'),
      value: stats.value.warm_tier_count,
      icon: 'i-lucide-thermometer',
      color: 'warning'
    },
    {
      label: t('admin.coldTier'),
      value: stats.value.cold_tier_count,
      icon: 'i-lucide-snowflake',
      color: 'info'
    },
    { label: t('admin.sharedModels'), value: stats.value.shared_model_count, icon: 'i-lucide-share-2' },
    { label: t('admin.sharedBundles'), value: stats.value.shared_bundle_count, icon: 'i-lucide-package' }
  ]
})
</script>

<template>
  <div class="min-w-0 flex-1 flex flex-col overflow-hidden">
    <UDashboardPanel id="admin-pool">
      <template #header>
        <UDashboardNavbar :title="t('admin.pool')">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <div class="flex items-center gap-2">
              <InfoPopover title-key="info.admin.pool.title" description-key="info.admin.pool.description" />
              <UButton icon="i-lucide-refresh-cw" :label="t('common.refresh')" size="sm" variant="outline" @click="refresh()" />
            </div>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="p-6 flex flex-col gap-6">
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              <UIcon class="size-10 text-primary" name="i-lucide-memory-stick" />
              <div>
                <p class="text-3xl font-bold">
                  {{ stats.memory_estimate_mb.toFixed(1) }}
                  <span class="text-lg text-dimmed">{{ t('common.memoryUnitMB') }}</span>
                </p>
                <p class="text-dimmed text-sm">{{ t('admin.memoryEstimateDescription') }}</p>
              </div>
            </div>
          </UCard>

          <p class="text-xs text-dimmed text-center">{{ t('admin.autoRefresh') }}</p>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
