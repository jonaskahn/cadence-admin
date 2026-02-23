<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { OrganizationResponse } from '~/types'
import { formatDate, getApiErrorMessage, SUBSCRIPTION_TIERS, subscriptionTierColor } from '~/utils'

const auth = useAuth()
const toast = useToast()
const showCreate = ref(false)

const { data: orgs, refresh } = await useFetch<OrganizationResponse[]>('/api/admin/orgs')

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  display_name: z.string().optional(),
  domain: z.string().min(1, 'Domain is required'),
  tier: z.string().optional(),
  description: z.string().optional(),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  website: z.string().optional(),
  logo_url: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional()
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '',
  display_name: '',
  domain: '',
  tier: 'free',
  description: '',
  contact_email: '',
  website: '',
  logo_url: '',
  country: '',
  timezone: ''
})
const creating = ref(false)

const tierOptions = SUBSCRIPTION_TIERS.map((t) => ({ label: t, value: t }))

async function onCreate(event: FormSubmitEvent<Schema>) {
  creating.value = true
  try {
    const payload = {
      name: event.data.name,
      display_name: event.data.display_name || null,
      domain: event.data.domain,
      tier: event.data.tier || null,
      description: event.data.description || null,
      contact_email: event.data.contact_email || null,
      website: event.data.website || null,
      logo_url: event.data.logo_url || null,
      country: event.data.country || null,
      timezone: event.data.timezone || null
    }
    await $fetch('/api/admin/orgs', { method: 'POST', body: payload })
    Object.assign(state, {
      name: '',
      display_name: '',
      domain: '',
      tier: 'free',
      description: '',
      contact_email: '',
      website: '',
      logo_url: '',
      country: '',
      timezone: ''
    })
    showCreate.value = false
    await Promise.all([refresh(), auth.loadOrgs()])
    toast.add({ title: 'Organization created', icon: 'i-lucide-check', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Error', description: getApiErrorMessage(err, 'Failed to create organization'), color: 'error' })
  } finally {
    creating.value = false
  }
}

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'org_id', header: 'ID' },
  { accessorKey: 'tier', header: 'Tier' },
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
          <UButton icon="i-lucide-plus" label="Create Org" @click="showCreate = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UCard>
          <UTable :columns="columns" :data="orgs || []">
            <template #name-cell="{ row }">
              <div>
                <p class="font-medium">{{ row.original.display_name || row.original.name }}</p>
                <p v-if="row.original.display_name" class="text-xs text-dimmed font-mono">{{ row.original.name }}</p>
              </div>
            </template>
            <template #tier-cell="{ row }">
              <UBadge :color="subscriptionTierColor(row.original.tier)" size="sm" variant="subtle">
                {{ row?.original?.tier?.toUpperCase() }}
              </UBadge>
            </template>
            <template #status-cell="{ row }">
              <UBadge :color="row.original.status === 'active' ? 'success' : 'neutral'" size="sm" variant="subtle">
                {{ row.original.status }}
              </UBadge>
            </template>
            <template #created_at-cell="{ row }">
              <span class="text-sm text-dimmed">{{ formatDate(row.original.created_at) }}</span>
            </template>
            <template #actions-cell="{ row }">
              <UButton :to="`/admin/orgs/${row.original.org_id}`" icon="i-lucide-info" size="xs" variant="ghost" />
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
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Slug Name" name="name" required>
              <UInput v-model="state.name" class="w-full" placeholder="acme-corp" />
            </UFormField>
            <UFormField label="Display Name" name="display_name">
              <UInput v-model="state.display_name" class="w-full" placeholder="Acme Corporation" />
            </UFormField>
            <UFormField label="Domain" name="domain" required>
              <UInput v-model="state.domain" class="w-full" placeholder="acme.com" />
            </UFormField>
            <UFormField label="Subscription Tier" name="tier">
              <USelect v-model="state.tier" :items="tierOptions" class="w-full" />
            </UFormField>
            <UFormField label="Contact Email" name="contact_email">
              <UInput v-model="state.contact_email" class="w-full" placeholder="admin@acme.com" type="email" />
            </UFormField>
            <UFormField label="Website" name="website">
              <UInput v-model="state.website" class="w-full" placeholder="https://acme.com" />
            </UFormField>
            <UFormField label="Country" name="country">
              <UInput v-model="state.country" class="w-full" placeholder="US" />
            </UFormField>
            <UFormField label="Timezone" name="timezone">
              <UInput v-model="state.timezone" class="w-full" placeholder="America/New_York" />
            </UFormField>
            <UFormField class="col-span-2" label="Logo URL" name="logo_url">
              <UInput v-model="state.logo_url" class="w-full" placeholder="https://cdn.example.com/logo.png" />
            </UFormField>
            <UFormField class="col-span-2" label="Description" name="description">
              <UTextarea v-model="state.description" class="w-full" placeholder="Brief description" />
            </UFormField>
          </div>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" label="Cancel" variant="ghost" @click="showCreate = false" />
            <UButton :loading="creating" label="Create" type="submit" />
          </div>
        </UForm>
      </UCard>
    </template>
  </UModal>
</template>
