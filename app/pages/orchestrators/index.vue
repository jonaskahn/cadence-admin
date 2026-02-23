<script setup lang="ts">
import type { OrchestratorResponse } from '~/types'
import { tierColor, statusColor } from '~/utils'

const auth = useAuth()
const orchestrators = useOrchestrators()
const showCreate = ref(false)

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'framework_type', header: 'Framework' },
  { accessorKey: 'mode', header: 'Mode' },
  { accessorKey: 'tier', header: 'Tier' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'actions' }
]

const fetchData = async () => await orchestrators.fetchAll()

onMounted(fetchData)

async function onDelete(row: OrchestratorResponse) {
  if (!confirm(`Delete "${row.name}"?`)) return
  await orchestrators.remove(row.instance_id)
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
          <UButton
            v-if="auth.isOrgAdmin.value"
            label="Create"
            icon="i-lucide-plus"
            @click="showCreate = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UCard>
          <UTable
            :data="orchestrators.orchestrators.value"
            :columns="columns"
            :loading="orchestrators.loading.value"
          >
            <template #tier-cell="{ row }">
              <UBadge :color="tierColor(row.original.tier)" variant="subtle" size="sm">
                {{ row.original.tier }}
              </UBadge>
            </template>

            <template #status-cell="{ row }">
              <UBadge :color="statusColor(row.original.status)" variant="subtle" size="sm">
                {{ row.original.status }}
              </UBadge>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center gap-1">
                <UButton
                  icon="i-lucide-info"
                  variant="ghost"
                  size="xs"
                  :to="`/orchestrators/${row.original.instance_id}`"
                />
                <template v-if="auth.isOrgAdmin.value">
                  <UButton
                    icon="i-lucide-play"
                    variant="ghost"
                    size="xs"
                    @click="orchestrators.load(row.original.instance_id)"
                  />
                  <UButton
                    icon="i-lucide-square"
                    variant="ghost"
                    size="xs"
                    @click="orchestrators.unload(row.original.instance_id)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    variant="ghost"
                    size="xs"
                    color="error"
                    @click="onDelete(row.original)"
                  />
                </template>
              </div>
            </template>
          </UTable>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="showCreate" :ui="{ content: 'sm:max-w-6xl' }" @after:leave="fetchData()">
    <template #content>
      <OrchestratorCreateModal @close="showCreate = false" />
    </template>
  </UModal>
</template>
