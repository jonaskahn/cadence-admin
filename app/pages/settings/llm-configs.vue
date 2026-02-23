<script setup lang="ts">
import type { LLMConfigResponse } from '~/types'
import { formatDate } from '~/utils'

const auth = useAuth()
const toast = useToast()
const orgId = computed(() => auth.currentOrgId.value || '')
const showAdd = ref(false)

const { data: configs, refresh } = await useFetch<LLMConfigResponse[]>(
  () => `/api/orgs/${orgId.value}/llm-configs`,
  { watch: [orgId] }
)

function handleAddClose() {
  showAdd.value = false
  refresh()
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
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'provider',
    header: 'Provider'
  },
  {
    accessorKey: 'base_url',
    header: 'Base URL'
  },
  {
    accessorKey: 'created_at',
    header: 'Created'
  },
  {
    id: 'actions'
  }
]
</script>

<template>
  <div class="flex flex-col gap-6">
    <UPageCard
      title="LLM Configurations"
      description="Bring Your Own Key (BYOK) LLM provider configurations."
      variant="naked"
      orientation="horizontal"
    >
      <UButton
        label="Add Config"
        icon="i-lucide-plus"
        class="w-fit lg:ms-auto"
        @click="showAdd = true"
      />
    </UPageCard>

    <UCard>
      <UTable :data="configs || []" :columns="columns">
        <template #base_url-cell="{ row }">
          <span class="text-dimmed">{{ row.original.base_url || '—' }}</span>
        </template>

        <template #created_at-cell="{ row }">
          <span class="text-sm text-dimmed">{{ formatDate(row.original.created_at) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <UButton
            icon="i-lucide-trash-2"
            variant="ghost"
            size="xs"
            color="error"
            @click="deleteConfig(row.original.name)"
          />
        </template>
      </UTable>
    </UCard>
  </div>

  <UModal v-model:open="showAdd" @after:close="">
    <template #content>
      <LLMConfigModal :org-id="orgId" @close="handleAddClose" />
    </template>
  </UModal>
</template>
