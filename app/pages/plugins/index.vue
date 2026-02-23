<script setup lang="ts">
import type { PluginMetadataResponse } from '~/types'

const auth = useAuth()
const toast = useToast()
const orgId = computed(() => auth.currentOrgId.value || '')
const showUpload = ref(false)

const { data: plugins, refresh } = await useFetch<PluginMetadataResponse[]>(
  () => `/api/orgs/${orgId.value}/plugins`,
  { watch: [orgId] }
)

function handleUploadClose() {
  showUpload.value = false
  refresh()
}

async function deletePlugin(id: number) {
  if (!confirm('Delete this plugin?')) return
  try {
    await $fetch(`/api/orgs/${orgId.value}/plugins/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Plugin deleted', icon: 'i-lucide-check' })
    await refresh()
  } catch {
    toast.add({ title: 'Failed to delete plugin', color: 'error' })
  }
}

const columns = [
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'pid',
    header: 'PID'
  },
  {
    accessorKey: 'version',
    header: 'Version'
  },
  {
    accessorKey: 'source',
    header: 'Source'
  },
  {
    accessorKey: 'agent_type',
    header: 'Type'
  },
  {
    id: 'actions'
  }
]
</script>

<template>
  <UDashboardPanel id="plugins">
    <template #header>
      <UDashboardNavbar title="Plugins">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton label="Upload" icon="i-lucide-upload" @click="showUpload = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UCard>
          <UTable :data="plugins || []" :columns="columns">
            <template #source-cell="{ row }">
              <UBadge
                :color="row.original.source === 'system' ? 'info' : 'success'"
                variant="subtle"
                size="sm"
              >
                {{ row.original.source }}
              </UBadge>
            </template>

            <template #actions-cell="{ row }">
              <UButton
                v-if="row.original.source === 'org'"
                icon="i-lucide-trash-2"
                variant="ghost"
                size="xs"
                color="error"
                @click="deletePlugin(row.original.id)"
              />
            </template>
          </UTable>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="showUpload">
    <template #content>
      <PluginUploadModal :org-id="orgId" @close="handleUploadClose" />
    </template>
  </UModal>
</template>
