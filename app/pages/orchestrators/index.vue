<script lang="ts" setup>
import type { OrchestratorResponse } from '~/types'
import { statusColor, tierColor } from '~/utils'

const auth = useAuth()
const orchestrators = useOrchestrators()
const showCreate = ref(false)

const cloneSource = ref<OrchestratorResponse | null>(null)

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'framework_type', header: 'Framework' },
  { accessorKey: 'mode', header: 'Mode' },
  { accessorKey: 'tier', header: 'Tier' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'ready', header: 'Ready' },
  { id: 'actions' }
]

onMounted(orchestrators.fetchAll)

async function onDelete(row: OrchestratorResponse) {
  if (!confirm(`Delete "${row.name}"?`)) return
  await orchestrators.remove(row.instance_id)
}

function onClone(row: OrchestratorResponse) {
  cloneSource.value = row
  showCreate.value = true
}

function onCreateClose() {
  showCreate.value = false
  cloneSource.value = null
}
</script>

<template>
  <UDashboardPanel id="orchestrators">
    <template #header>
      <UDashboardNavbar title="Orchestrators">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton v-if="auth.isOrgAdmin.value" icon="i-lucide-plus" label="Create" @click="showCreate = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
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
                <UButton :to="`/orchestrators/${row.original.instance_id}`" icon="i-lucide-info" size="xs" variant="ghost" />
                <template v-if="auth.isOrgAdmin.value">
                  <UButton icon="i-lucide-copy" size="xs" title="Clone" variant="ghost" @click="onClone(row.original)" />
                  <UButton icon="i-lucide-play" size="xs" variant="ghost" @click="orchestrators.load(row.original.instance_id)" />
                  <UButton icon="i-lucide-square" size="xs" variant="ghost" @click="orchestrators.unload(row.original.instance_id)" />
                  <UButton color="error" icon="i-lucide-trash-2" size="xs" variant="ghost" @click="onDelete(row.original)" />
                </template>
              </div>
            </template>
          </UTable>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="showCreate" :ui="{ content: 'sm:max-w-xl' }" @after:leave="orchestrators.fetchAll()">
    <template #content>
      <OrchestratorCreateModal :clone-source="cloneSource" @close="onCreateClose" />
    </template>
  </UModal>
</template>
