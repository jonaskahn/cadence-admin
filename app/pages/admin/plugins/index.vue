<script lang="ts" setup>
import type { SystemPluginResponse } from '~/types'

const auth = useAuth()
const toast = useToast()
const showUpload = ref(false)
const orgId = computed(() => auth.currentOrgId.value || '')

const { data: plugins, refresh } = await useFetch<SystemPluginResponse[]>('/api/admin/plugins')

function handleUploadClose() {
  showUpload.value = false
  refresh()
}

async function deletePlugin(id: number) {
  try {
    await $fetch(`/api/admin/plugins/${id}`, { method: 'DELETE' })
    await refresh()
    toast.add({ title: 'Plugin deleted', icon: 'i-lucide-check' })
  } catch {
    toast.add({ title: 'Failed to delete plugin', color: 'error' })
  }
}

async function confirmDeletePlugin(id: number) {
  if (!confirm('Delete this system plugin?')) return
  await deletePlugin(id)
}

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'pid', header: 'PID' },
  { accessorKey: 'version', header: 'Version' },
  { accessorKey: 'agent_type', header: 'Type' },
  { accessorKey: 'is_active', header: 'Active' },
  { id: 'actions' }
]
</script>

<template>
  <UDashboardPanel id="admin-plugins">
    <template #header>
      <UDashboardNavbar title="System Plugins">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-upload" label="Upload Plugin" @click="showUpload = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UCard>
          <UTable :columns="columns" :data="plugins || []">
            <template #is_active-cell="{ row }">
              <UBadge :color="row.original.is_active ? 'success' : 'neutral'" size="sm" variant="subtle">
                {{ row.original.is_active ? 'active' : 'inactive' }}
              </UBadge>
            </template>
            <template #actions-cell="{ row }">
              <UButton color="error" icon="i-lucide-trash-2" size="xs" variant="ghost" @click="confirmDeletePlugin(row.original.id)" />
            </template>
          </UTable>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="showUpload">
    <template #content>
      <PluginUploadModal :is-admin="true" :org-id="orgId" @close="handleUploadClose" />
    </template>
  </UModal>
</template>
