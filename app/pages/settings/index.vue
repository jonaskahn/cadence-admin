<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { OrganizationResponse } from '~/types'
import { subscriptionTierColor } from '~/utils'

const auth = useAuth()
const toast = useToast()
const orgId = computed(() => auth.currentOrgId.value || '')
const isOrgAdmin = computed(() => auth.currentOrg.value?.role === 'org_admin' || auth.currentOrg.value?.role === 'sys_admin')

const { data: org, refresh: refreshOrg } = await useFetch<OrganizationResponse>(() => `/api/orgs/${orgId.value}`, { watch: [orgId] })

const profileSchema = z.object({
  display_name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  contact_email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  website: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  timezone: z.string().optional().nullable()
})
type ProfileSchema = z.output<typeof profileSchema>

const profileState = reactive<Partial<ProfileSchema>>({
  display_name: org.value?.display_name ?? null,
  description: org.value?.description ?? null,
  contact_email: org.value?.contact_email ?? null,
  website: org.value?.website ?? null,
  logo_url: org.value?.logo_url ?? null,
  country: org.value?.country ?? null,
  timezone: org.value?.timezone ?? null
})

const savingProfile = ref(false)

async function onProfileSubmit(event: FormSubmitEvent<ProfileSchema>) {
  savingProfile.value = true
  try {
    await $fetch(`/api/orgs/${orgId.value}/profile`, {
      method: 'PATCH',
      body: event.data
    })
    await refreshOrg()
    toast.add({ title: 'Organization updated', icon: 'i-lucide-check', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to update organization', color: 'error' })
  } finally {
    savingProfile.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <!-- Read-only org identity -->
    <UPageCard title="Organization" variant="subtle">
      <dl class="grid grid-cols-2 gap-4">
        <div>
          <dt class="text-dimmed text-sm">Organization ID</dt>
          <dd class="font-mono text-sm mt-1">{{ orgId }}</dd>
        </div>
        <div>
          <dt class="text-dimmed text-sm">Your Role</dt>
          <dd class="mt-1">
            <UBadge size="sm" variant="subtle">{{ auth.currentOrg.value?.role?.toUpperCase() || '—' }}</UBadge>
          </dd>
        </div>
        <div>
          <dt class="text-dimmed text-sm">Slug</dt>
          <dd class="font-mono text-sm mt-1">{{ org?.name || '—' }}</dd>
        </div>
        <div>
          <dt class="text-dimmed text-sm">Domain</dt>
          <dd class="font-mono text-sm mt-1">{{ org?.domain || '—' }}</dd>
        </div>
        <div>
          <dt class="text-dimmed text-sm">Subscription Tier</dt>
          <dd class="mt-1">
            <UBadge v-if="org?.tier" :color="subscriptionTierColor(org.tier)" size="sm" variant="subtle">
              {{ org.tier.toUpperCase() }}
            </UBadge>
            <span v-else class="text-sm text-dimmed">—</span>
          </dd>
        </div>
        <div>
          <dt class="text-dimmed text-sm">Status</dt>
          <dd class="mt-1">
            <UBadge :color="org?.status === 'active' ? 'success' : 'neutral'" size="sm" variant="subtle">
              {{ org?.status || '—' }}
            </UBadge>
          </dd>
        </div>
      </dl>
    </UPageCard>

    <!-- Editable profile (org_admin only) -->
    <UPageCard v-if="isOrgAdmin" description="Update your organization's public profile." title="Organization Profile" variant="subtle">
      <UForm :schema="profileSchema" :state="profileState" class="flex flex-col gap-4" @submit="onProfileSubmit">
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Display Name" name="display_name">
            <UInput v-model="profileState.display_name" class="w-full" placeholder="Acme Corporation" />
          </UFormField>
          <UFormField label="Contact Email" name="contact_email">
            <UInput v-model="profileState.contact_email" class="w-full" placeholder="admin@acme.com" type="email" />
          </UFormField>
          <UFormField label="Website" name="website">
            <UInput v-model="profileState.website" class="w-full" placeholder="https://acme.com" />
          </UFormField>
          <UFormField label="Country" name="country">
            <UInput v-model="profileState.country" class="w-full" placeholder="US" />
          </UFormField>
          <UFormField label="Timezone" name="timezone">
            <UInput v-model="profileState.timezone" class="w-full" placeholder="America/New_York" />
          </UFormField>
          <UFormField label="Logo URL" name="logo_url">
            <UInput v-model="profileState.logo_url" class="w-full" placeholder="https://cdn.example.com/logo.png" />
          </UFormField>
          <UFormField class="col-span-2" label="Description" name="description">
            <UTextarea v-model="profileState.description" class="w-full" placeholder="Brief description of your organization" />
          </UFormField>
        </div>
        <UButton :loading="savingProfile" class="w-fit" label="Save Profile" type="submit" />
      </UForm>
    </UPageCard>
  </div>
</template>
