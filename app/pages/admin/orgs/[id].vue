<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { OrganizationResponse, TierQuota, UpdateOrganizationRequest, UserMembershipResponse } from '~/types'
import { getApiErrorMessage, SUBSCRIPTION_TIERS, subscriptionTierColor } from '~/utils'

const route = useRoute()
const toast = useToast()
const orgId = route.params.id as string
const showAdd = ref(false)
const saving = ref(false)

const { data: org, refresh: refreshOrg } = await useFetch<OrganizationResponse>(`/api/admin/orgs/${orgId}`)
const { data: quota } = await useFetch<TierQuota>(`/api/admin/orgs/${orgId}/quota`)
const { data: members, refresh: refreshMembers } = await useFetch<UserMembershipResponse[]>(`/api/orgs/${orgId}/users`)

const tierOptions = SUBSCRIPTION_TIERS.map((t) => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t }))

const editSchema = z.object({
  display_name: z.string().optional().nullable(),
  domain: z.string().min(1, 'Domain cannot be empty').optional().nullable(),
  tier: z.string().optional().nullable(),
  contact_email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  website: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
  description: z.string().optional().nullable()
})
type EditSchema = z.output<typeof editSchema>

const form = reactive<UpdateOrganizationRequest>({
  display_name: org.value?.display_name ?? null,
  domain: org.value?.domain ?? null,
  tier: org.value?.tier ?? null,
  description: org.value?.description ?? null,
  contact_email: org.value?.contact_email ?? null,
  website: org.value?.website ?? null,
  logo_url: org.value?.logo_url ?? null,
  country: org.value?.country ?? null,
  timezone: org.value?.timezone ?? null
})

async function saveOrg(event?: FormSubmitEvent<EditSchema>) {
  saving.value = true
  try {
    await $fetch(`/api/admin/orgs/${orgId}`, {
      method: 'PATCH',
      body: event?.data ?? form
    })
    await refreshOrg()
    toast.add({ title: 'Organization updated', icon: 'i-lucide-check' })
  } catch (err) {
    toast.add({ title: 'Error', description: getApiErrorMessage(err, 'Failed to save organization'), color: 'error' })
  } finally {
    saving.value = false
  }
}

function handleAddClose() {
  showAdd.value = false
  refreshMembers()
}

async function removeMember(userId: string) {
  if (!confirm('Remove member?')) return
  try {
    await $fetch(`/api/orgs/${orgId}/users/${userId}`, { method: 'DELETE' })
    await refreshMembers()
    toast.add({ title: 'Member removed', icon: 'i-lucide-check' })
  } catch (err) {
    toast.add({ title: 'Error', description: getApiErrorMessage(err, 'Failed to remove member'), color: 'error' })
  }
}

const memberColumns = [
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'is_admin', header: 'Role' },
  { id: 'actions' }
]

const quotaRows = computed(() => {
  if (!quota.value) return []
  return [
    {
      label: 'Max Orchestrators',
      value: quota.value.max_orchestrators === -1 ? 'Unlimited' : quota.value.max_orchestrators
    },
    { label: 'Max Members', value: quota.value.max_members === -1 ? 'Unlimited' : quota.value.max_members },
    {
      label: 'Messages / Month',
      value: quota.value.max_messages_per_month === -1 ? 'Unlimited' : quota.value.max_messages_per_month.toLocaleString()
    },
    {
      label: 'Messages / Day',
      value: quota.value.max_messages_per_day === -1 ? 'Unlimited' : quota.value.max_messages_per_day.toLocaleString()
    },
    { label: 'Rate Limit (RPM)', value: quota.value.rate_limit_rpm },
    { label: 'Rate Limit Burst', value: quota.value.rate_limit_burst },
    { label: 'Max LLM Configs', value: quota.value.max_llm_configs === -1 ? 'Unlimited' : quota.value.max_llm_configs }
  ]
})
</script>

<template>
  <UDashboardPanel :id="`admin-org-${orgId}`">
    <template #header>
      <UDashboardNavbar :title="org?.display_name || org?.name || orgId">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" to="/admin/orgs" variant="ghost" />
        </template>
        <template #right>
          <UButton icon="i-lucide-user-plus" label="Add Member" @click="showAdd = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 flex flex-col gap-6">
        <!-- Identity card -->
        <UCard v-if="org">
          <template #header>
            <p class="font-semibold">Details</p>
          </template>
          <dl class="grid grid-cols-2 gap-4">
            <div>
              <dt class="text-dimmed text-sm">Org ID</dt>
              <dd class="font-mono text-sm mt-1">{{ org.org_id }}</dd>
            </div>
            <div>
              <dt class="text-dimmed text-sm">Status</dt>
              <dd class="mt-1">
                <UBadge :color="org.status === 'active' ? 'success' : 'neutral'" size="sm" variant="subtle">
                  {{ org.status }}
                </UBadge>
              </dd>
            </div>
            <div>
              <dt class="text-dimmed text-sm">Slug (name)</dt>
              <dd class="font-mono text-sm mt-1">{{ org.name }}</dd>
            </div>
            <div>
              <dt class="text-dimmed text-sm">Domain</dt>
              <dd class="font-mono text-sm mt-1">{{ org.domain || '—' }}</dd>
            </div>
            <div>
              <dt class="text-dimmed text-sm">Subscription Tier</dt>
              <dd class="mt-1">
                <UBadge :color="subscriptionTierColor(org.tier)" size="sm" variant="subtle">
                  {{ org?.tier?.toUpperCase() }}
                </UBadge>
              </dd>
            </div>
          </dl>
        </UCard>

        <!-- Edit form -->
        <UCard>
          <template #header>
            <p class="font-semibold">Edit Organization</p>
          </template>
          <UForm :schema="editSchema" :state="form" class="flex flex-col gap-4" @submit="saveOrg">
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Display Name" name="display_name">
                <UInput v-model="form.display_name" class="w-full" placeholder="Acme Corporation" />
              </UFormField>
              <UFormField label="Domain" name="domain">
                <UInput v-model="form.domain" class="w-full" placeholder="acme.com" />
              </UFormField>
              <UFormField label="Subscription Tier" name="tier">
                <USelect v-model="form.tier" :items="tierOptions" class="w-full" />
              </UFormField>
              <UFormField label="Contact Email" name="contact_email">
                <UInput v-model="form.contact_email" class="w-full" placeholder="admin@acme.com" type="email" />
              </UFormField>
              <UFormField label="Website" name="website">
                <UInput v-model="form.website" class="w-full" placeholder="https://acme.com" />
              </UFormField>
              <UFormField label="Country" name="country">
                <UInput v-model="form.country" class="w-full" placeholder="US" />
              </UFormField>
              <UFormField label="Timezone" name="timezone">
                <UInput v-model="form.timezone" class="w-full" placeholder="America/New_York" />
              </UFormField>
              <UFormField label="Logo URL" name="logo_url">
                <UInput v-model="form.logo_url" class="w-full" placeholder="https://..." />
              </UFormField>
              <UFormField class="col-span-2" label="Description" name="description">
                <UTextarea v-model="form.description" class="w-full" placeholder="Brief description of this organization" />
              </UFormField>
            </div>
            <div class="flex justify-end mt-2">
              <UButton :loading="saving" icon="i-lucide-save" label="Save Changes" type="submit" />
            </div>
          </UForm>
        </UCard>

        <!-- Quota card -->
        <UCard v-if="quota">
          <template #header>
            <p class="font-semibold">Current Tier Quota</p>
          </template>
          <dl class="grid grid-cols-2 gap-4">
            <div v-for="row in quotaRows" :key="row.label">
              <dt class="text-dimmed text-sm">{{ row.label }}</dt>
              <dd class="font-mono text-sm mt-1">{{ row.value }}</dd>
            </div>
          </dl>
        </UCard>

        <!-- Members table -->
        <UCard>
          <template #header>
            <p class="font-semibold">Members</p>
          </template>
          <UTable :columns="memberColumns" :data="members || []">
            <template #is_admin-cell="{ row }">
              <UBadge :color="row.original.is_admin ? 'warning' : 'neutral'" size="sm" variant="subtle">
                {{ row.original.is_admin ? 'org_admin' : 'member' }}
              </UBadge>
            </template>
            <template #actions-cell="{ row }">
              <UButton color="error" icon="i-lucide-x" size="xs" variant="ghost" @click="removeMember(row.original.user_id)" />
            </template>
          </UTable>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="showAdd">
    <template #content>
      <AddMemberModal :org-id="orgId" @close="handleAddClose" />
    </template>
  </UModal>
</template>
