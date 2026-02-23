<script lang="ts" setup>
import type { OrchestratorResponse } from '~/types'
import { statusColor, tierColor } from '~/utils'

const auth = useAuth()
const { t } = useI18n()
const localePath = useLocalePath()
const orchestrators = useOrchestrators()

const columns = computed(() => [
  { accessorKey: 'name', header: t('dashboard.name') },
  { accessorKey: 'framework_type', header: t('dashboard.framework') },
  { accessorKey: 'mode', header: t('dashboard.mode') },
  { accessorKey: 'tier', header: t('dashboard.tier') },
  { accessorKey: 'status', header: t('dashboard.status') },
  { id: 'ready', header: t('orchestrators.ready') },
  { id: 'actions' }
])

onMounted(orchestrators.fetchAll)

async function onDeactivate(row: OrchestratorResponse) {
  if (!confirm(t('orchestrators.deactivateConfirm', { name: row.name }))) return
  await orchestrators.deactivate(row.instance_id)
}

async function onActivate(row: OrchestratorResponse) {
  await orchestrators.activate(row.instance_id)
}

function onClone(row: OrchestratorResponse) {
  navigateTo(localePath(`/orchestrators/create?clone=${row.instance_id}`))
}
</script>

<template>
  <UDashboardPanel id="orchestrators" :ui="{ body: 'min-w-0' }">
    <template #header>
      <UDashboardNavbar :title="t('orchestrators.title')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton v-if="auth.isOrgAdmin.value" icon="i-lucide-plus" :label="t('dashboard.create')" :to="localePath('/orchestrators/create')" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 min-w-0 w-full">
        <UCard>
          <UTable :columns="columns" :data="orchestrators.orchestrators.value" :loading="orchestrators.loading.value">
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

            <template #ready-cell="{ row }">
              <UIcon v-if="row.original.is_ready" class="text-success size-4" name="i-lucide-circle-check" />
              <UIcon v-else class="text-muted size-4" name="i-lucide-circle-x" />
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center gap-1">
                <UButton :to="localePath(`/orchestrators/${row.original.instance_id}`)" icon="i-lucide-info" size="xs" variant="ghost" />
                <template v-if="auth.isOrgAdmin.value">
                  <UButton icon="i-lucide-copy" size="xs" :title="t('orchestrators.clone')" variant="ghost" @click="onClone(row.original)" />
                  <template v-if="row.original.status === 'active'">
                    <UButton icon="i-lucide-play" size="xs" variant="ghost" @click="orchestrators.load(row.original.instance_id)" />
                    <UButton icon="i-lucide-square" size="xs" variant="ghost" @click="orchestrators.unload(row.original.instance_id)" />
                    <UButton
                      color="neutral"
                      icon="i-lucide-route-off"
                      size="xs"
                      :title="t('orchestrators.deactivate')"
                      variant="ghost"
                      @click="onDeactivate(row.original)"
                    />
                  </template>
                  <UButton
                    v-else
                    color="success"
                    icon="i-lucide-route"
                    size="xs"
                    :title="t('orchestrators.activate')"
                    variant="ghost"
                    @click="onActivate(row.original)"
                  />
                </template>
              </div>
            </template>
          </UTable>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
