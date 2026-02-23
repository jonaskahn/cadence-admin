<script lang="ts" setup>
import type { LLMConfigResponse } from '~/types'
import { formatDate, providerLabel } from '~/utils'

const auth = useAuth()
const toast = useToast()
const orgId = computed(() => auth.currentOrgId.value || '')
const showAdd = ref(false)
const editingConfig = ref<LLMConfigResponse | null>(null)

const { data: configs, refresh } = await useFetch<LLMConfigResponse[]>(() => `/api/orgs/${orgId.value}/llm-configs`, { watch: [orgId] })

function handleModalClose() {
  showAdd.value = false
  editingConfig.value = null
  refresh()
}

function startEdit(config: LLMConfigResponse) {
  editingConfig.value = config
}

function onEditModalClose(open: boolean) {
  if (!open) editingConfig.value = null
}

async function deleteConfig(name: string) {
  if (!confirm(`Delete config "${name}"?`)) return
  try {
    await $fetch(`/api/orgs/${orgId.value}/llm-configs/${name}`, { method: 'DELETE' })
    await refresh()
    toast.add({ title: 'Config deleted', icon: 'i-lucide-check' })
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status
    if (status === 409) {
      toast.add({
        title: 'Cannot delete config',
        description: 'This config is still referenced by active orchestrators.',
        color: 'error'
      })
    } else {
      toast.add({ title: 'Failed to delete config', color: 'error' })
    }
  }
}

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'provider', header: 'Provider' },
  { accessorKey: 'base_url', header: 'Base URL' },
  { accessorKey: 'created_at', header: 'Created' },
  { id: 'actions' }
]
</script>

<template>
  <div class="flex flex-col gap-6">
    <UPageCard description="Bring Your Own Key (BYOK) LLM provider configurations." orientation="horizontal" title="LLM Configurations" variant="naked">
      <UButton class="w-fit lg:ms-auto" icon="i-lucide-plus" label="Add Config" @click="showAdd = true" />
    </UPageCard>

    <UCard>
      <UTable :columns="columns" :data="configs || []">
        <template #provider-cell="{ row }">
          <span>{{ providerLabel(row.original.provider) }}</span>
        </template>

        <template #base_url-cell="{ row }">
          <span class="text-dimmed">{{ row.original.base_url || '—' }}</span>
        </template>

        <template #created_at-cell="{ row }">
          <span class="text-sm text-dimmed">{{ formatDate(row.original.created_at) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-1">
            <UButton color="neutral" icon="i-lucide-pencil" size="xs" variant="ghost" @click="startEdit(row.original)" />
            <UButton color="error" icon="i-lucide-trash-2" size="xs" variant="ghost" @click="deleteConfig(row.original.name)" />
          </div>
        </template>
      </UTable>
    </UCard>
  </div>

  <UModal v-model:open="showAdd" @after:leave="refresh()">
    <template #content>
      <LLMConfigModal :org-id="orgId" @close="handleModalClose" />
    </template>
  </UModal>

  <UModal :open="!!editingConfig" @update:open="onEditModalClose">
    <template #content>
      <LLMConfigModal v-if="editingConfig" :initial-value="editingConfig" :org-id="orgId" @close="handleModalClose" />
    </template>
  </UModal>
</template>
