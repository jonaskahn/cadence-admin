<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { OrganizationResponse } from '~/types'
import { formatDate, getApiErrorMessage, SUBSCRIPTION_TIERS, subscriptionTierColor } from '~/utils'

const auth = useAuth()
const toast = useToast()
const { t } = useI18n()
const { withOverlay } = useLoadingOverlay()
const showCreate = ref(false)

function openCreate() {
  showCreate.value = true
}

function closeCreate() {
  showCreate.value = false
}

const { data: orgs, refresh } = await useApiFetch<OrganizationResponse[]>('/api/admin/orgs')

const schema = z.object({
  name: z.string().min(1, () => t('common.nameRequired')),
  display_name: z.string().optional(),
  domain: z.string().min(1, () => t('common.domainRequired')),
  tier: z.string().optional(),
  description: z.string().optional(),
  contact_email: z
    .string()
    .email(() => t('common.invalidEmail'))
    .optional()
    .or(z.literal('')),
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
    await withOverlay(async () => {
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
      toast.add({ title: t('admin.organizationCreated'), icon: 'i-lucide-check', color: 'success' })
    })
  } catch (err: unknown) {
    toast.add({ title: t('errors.error'), description: getApiErrorMessage(err, t('admin.failedCreateOrg')), color: 'error' })
  } finally {
    creating.value = false
  }
}

const columns = computed(() => [
  { accessorKey: 'name', header: t('dashboard.name') },
  { accessorKey: 'org_id', header: t('admin.id') },
  { accessorKey: 'tier', header: t('dashboard.tier') },
  { accessorKey: 'status', header: t('dashboard.status') },
  { accessorKey: 'created_at', header: t('settings.created') },
  { id: 'actions' }
])
</script>

<template>
  <div class="min-w-0 flex-1 flex flex-col overflow-hidden">
    <UDashboardPanel id="admin-orgs">
      <template #header>
        <UDashboardNavbar :title="t('admin.organizations')">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <div class="flex items-center gap-2">
              <InfoPopover title-key="info.admin.orgs.title" description-key="info.admin.orgs.description" />
              <UButton icon="i-lucide-plus" :label="t('admin.createOrg')" @click="openCreate" />
            </div>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="p-6">
          <UCard variant="soft">
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
                <div class="flex items-center gap-1.5">
                  <UBadge :color="row.original.status === 'active' ? 'success' : 'neutral'" size="sm" variant="subtle">
                    {{ row.original.status }}
                  </UBadge>
                  <UBadge v-if="row.original.is_deleted" color="error" size="sm" variant="subtle">
                    {{ t('common.deleted') }}
                  </UBadge>
                </div>
              </template>
              <template #created_at-cell="{ row }">
                <span class="text-sm text-dimmed">{{ formatDate(row.original.created_at) }}</span>
              </template>
              <template #actions-cell="{ row }">
                <UButton :to="`/admin/orgs/${row.original.org_id}`" icon="i-lucide-info" :label="t('common.viewDetails')" size="xs" />
              </template>
            </UTable>
          </UCard>
        </div>
      </template>
    </UDashboardPanel>

    <UModal v-model:open="showCreate">
      <template #content>
        <UCard variant="soft" class="w-full">
          <template #header>
            <p class="font-semibold">{{ t('admin.createOrganization') }}</p>
          </template>
          <UForm :schema="schema" :state="state" class="flex flex-col gap-4" @submit="onCreate">
            <div class="grid grid-cols-2 gap-4">
              <UFormField :label="t('admin.slugName')" name="name" required>
                <UInput v-model="state.name" class="w-full" :placeholder="t('admin.acmePlaceholder')" />
              </UFormField>
              <UFormField :label="t('settings.displayName')" name="display_name">
                <UInput v-model="state.display_name" class="w-full" :placeholder="t('settings.acmePlaceholder')" />
              </UFormField>
              <UFormField :label="t('settings.domain')" name="domain" required>
                <UInput v-model="state.domain" class="w-full" :placeholder="t('admin.domainPlaceholder')" />
              </UFormField>
              <UFormField :label="t('settings.subscriptionTier')" name="tier">
                <USelect v-model="state.tier" :items="tierOptions" class="w-full" />
              </UFormField>
              <UFormField :label="t('settings.contactEmail')" name="contact_email">
                <UInput v-model="state.contact_email" class="w-full" :placeholder="t('settings.adminEmailPlaceholder')" type="email" />
              </UFormField>
              <UFormField :label="t('settings.website')" name="website">
                <UInput v-model="state.website" class="w-full" :placeholder="t('settings.websitePlaceholder')" />
              </UFormField>
              <UFormField :label="t('settings.country')" name="country">
                <UInput v-model="state.country" class="w-full" :placeholder="t('settings.countryPlaceholder')" />
              </UFormField>
              <UFormField :label="t('settings.timezone')" name="timezone">
                <UInput v-model="state.timezone" class="w-full" :placeholder="t('settings.timezonePlaceholder')" />
              </UFormField>
              <UFormField class="col-span-2" :label="t('settings.logoUrl')" name="logo_url">
                <UInput v-model="state.logo_url" class="w-full" :placeholder="t('settings.logoPlaceholder')" />
              </UFormField>
              <UFormField class="col-span-2" :label="t('settings.description')" name="description">
                <UTextarea v-model="state.description" class="w-full" :placeholder="t('admin.descriptionPlaceholder')" />
              </UFormField>
            </div>
            <div class="flex justify-end gap-2">
              <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="closeCreate" />
              <UButton color="primary" :loading="creating" :label="t('common.create')" type="submit" />
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
