<script setup lang="ts">
import type { PoolStatsResponse } from '~/types'
import { POOL_STATS_REFRESH_MS } from '~/utils'

const STAT_ICON_COLOR: Record<string, string> = {
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info'
}

const { data: stats, refresh } = await useFetch<PoolStatsResponse>('/api/admin/pool/stats')

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
    { label: 'Total Instances', value: stats.value.total_instances, icon: 'i-lucide-cpu' },
    {
      label: 'Hot Tier',
      value: stats.value.hot_tier_count,
      icon: 'i-lucide-flame',
      color: 'error'
    },
    {
      label: 'Warm Tier',
      value: stats.value.warm_tier_count,
      icon: 'i-lucide-thermometer',
      color: 'warning'
    },
    {
      label: 'Cold Tier',
      value: stats.value.cold_tier_count,
      icon: 'i-lucide-snowflake',
      color: 'info'
    },
    { label: 'Shared Models', value: stats.value.shared_model_count, icon: 'i-lucide-share-2' },
    { label: 'Shared Bundles', value: stats.value.shared_bundle_count, icon: 'i-lucide-package' }
  ]
})
</script>

<template>
  <UDashboardPanel id="admin-pool">
    <template #header>
      <UDashboardNavbar title="Pool Statistics">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            variant="ghost"
            size="sm"
            label="Refresh"
            @click="refresh()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 flex flex-col gap-6">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <UCard v-for="card in statCards" :key="card.label">
            <div class="flex items-center gap-3">
              <UIcon
                :name="card.icon"
                :class="['size-8', STAT_ICON_COLOR[card.color ?? ''] ?? 'text-primary']"
              />
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

        <UCard v-if="stats">
          <template #header>
            <p class="font-semibold">Memory Estimate</p>
          </template>
          <div class="flex items-center gap-4">
            <UIcon name="i-lucide-memory-stick" class="size-10 text-primary" />
            <div>
              <p class="text-3xl font-bold">
                {{ stats.memory_estimate_mb.toFixed(1) }}
                <span class="text-lg text-dimmed">MB</span>
              </p>
              <p class="text-dimmed text-sm">Estimated pool memory usage</p>
            </div>
          </div>
        </UCard>

        <p class="text-xs text-dimmed text-center">Auto-refreshes every 30 seconds</p>
      </div>
    </template>
  </UDashboardPanel>
</template>
