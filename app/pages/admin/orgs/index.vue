<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { OrganizationResponse } from '~/types'
import { formatDate } from '~/utils'

const auth = useAuth()
const toast = useToast()
const showCreate = ref(false)

const { data: orgs, refresh } = await useFetch<OrganizationResponse[]>('/api/admin/orgs')

const schema = z.object({ name: z.string().min(1, 'Name is required') })
type Schema = z.output<typeof schema>
const state = reactive<Partial<Schema>>({ name: '' })
const creating = ref(false)

async function onCreate(event: FormSubmitEvent<Schema>) {
  creating.value = true
  try {
    await $fetch('/api/admin/orgs', { method: 'POST', body: event.data })
    state.name = ''
    showCreate.value = false
    await Promise.all([refresh(), auth.loadOrgs()])
    toast.add({ title: 'Organization created', icon: 'i-lucide-check', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to create organization', color: 'error' })
  } finally {
    creating.value = false
  }
}

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'org_id', header: 'ID' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'created_at', header: 'Created' },
  { id: 'actions' }
]
</script>

<template>
  <UDashboardPanel id="admin-orgs">
    <template #header>
      <UDashboardNavbar title="Organizations">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton label="Create Org" icon="i-lucide-plus" @click="showCreate = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UCard>
          <UTable :data="orgs || []" :columns="columns">
            <template #status-cell="{ row }">
              <UBadge
                :color="row.original.status === 'active' ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ row.original.status }}
              </UBadge>
            </template>
            <template #created_at-cell="{ row }">
              <span class="text-sm text-dimmed">{{ formatDate(row.original.created_at) }}</span>
            </template>
            <template #actions-cell="{ row }">
              <UButton
                icon="i-lucide-info"
                variant="ghost"
                size="xs"
                :to="`/admin/orgs/${row.original.org_id}`"
              />
            </template>
          </UTable>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="showCreate">
    <template #content>
      <UCard class="w-full">
        <template #header>
          <p class="font-semibold">Create Organization</p>
        </template>
        <UForm :schema="schema" :state="state" class="flex flex-col gap-4" @submit="onCreate">
          <UFormField label="Organization Name" name="name">
            <UInput v-model="state.name" placeholder="Acme Corp" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton label="Cancel" variant="ghost" color="neutral" @click="showCreate = false" />
            <UButton type="submit" label="Create" :loading="creating" />
          </div>
        </UForm>
      </UCard>
    </template>
  </UModal>
</template>
