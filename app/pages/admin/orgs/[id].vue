<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { OrganizationResponse, TierDefinitionResponse, TierQuota, UpdateOrganizationRequest, UserMembershipResponse } from '~/types'
import { getApiErrorMessage, SUBSCRIPTION_TIERS, subscriptionTierColor } from '~/utils'

const route = useRoute()
const toast = useToast()
const { t } = useI18n()
const localePath = useLocalePath()
const orgId = route.params.id as string
const showAdd = ref(false)
const saving = ref(false)
const orgFormRef = ref<{ $el?: { requestSubmit?: () => void } } | null>(null)

const { data: org, refresh: refreshOrg } = await useApiFetch<OrganizationResponse>(`/api/admin/orgs/${orgId}`)
const { data: quota, refresh: refreshQuota } = await useApiFetch<TierQuota>(`/api/admin/orgs/${orgId}/quota`)
const { data: tiers } = await useApiFetch<TierDefinitionResponse[]>('/api/admin/tiers')
const { data: members, refresh: refreshMembers } = await useApiFetch<UserMembershipResponse[]>(`/api/orgs/${orgId}/users`)

const tierOptions = SUBSCRIPTION_TIERS.map((tier) => ({ label: tier.charAt(0).toUpperCase() + tier.slice(1), value: tier }))

const editSchema = z.object({
  display_name: z.string().optional().nullable(),
  domain: z
    .string()
    .min(1, () => t('common.domainEmpty'))
    .optional()
    .nullable(),
  tier: z.string().optional().nullable(),
  contact_email: z
    .string()
    .email(() => t('common.invalidEmail'))
    .optional()
    .nullable()
    .or(z.literal('')),
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
    await refreshQuota()
    toast.add({ title: t('admin.organizationUpdated'), icon: 'i-lucide-check' })
  } catch (err) {
    toast.add({ title: t('errors.error'), description: getApiErrorMessage(err, t('admin.failedSaveOrg')), color: 'error' })
  } finally {
    saving.value = false
  }
}

function handleAddClose() {
  showAdd.value = false
  refreshMembers()
}

const removing = ref<string | null>(null)

async function removeMember(userId: string) {
  removing.value = userId
  try {
    await $fetch(`/api/orgs/${orgId}/users/${userId}`, { method: 'DELETE' })
    await refreshMembers()
    toast.add({ title: t('settings.memberRemoved'), icon: 'i-lucide-check' })
  } catch (err) {
    toast.add({ title: t('errors.error'), description: getApiErrorMessage(err, t('settings.failedRemoveMember')), color: 'error' })
  } finally {
    removing.value = null
  }
}

const memberColumns = computed(() => [
  { accessorKey: 'username', header: t('settings.username') },
  { accessorKey: 'email', header: t('profile.email') },
  { accessorKey: 'is_admin', header: t('profile.role') },
  { id: 'actions' }
])

/** Quota to display: selected tier's quota when editing, otherwise current org quota */
const displayQuota = computed(() => {
  const selectedTier = form.tier
  if (selectedTier && tiers.value?.length) {
    const tierDef = tiers.value.find((t) => t.tier_name.toLowerCase() === selectedTier.toLowerCase())
    if (tierDef?.quota) return tierDef.quota
  }
  return quota.value ?? null
})

const isPreviewingTier = computed(() => !!form.tier && form.tier.toLowerCase() !== (org.value?.tier ?? '').toLowerCase())

const quotaRows = computed(() => {
  const q = displayQuota.value
  if (!q) return []
  return [
    {
      label: t('admin.maxOrchestrators'),
      value: q.max_orchestrators === -1 ? t('common.unlimited') : q.max_orchestrators
    },
    {
      label: t('admin.maxCentralPoints'),
      value: (q.max_central_points ?? 0) === -1 ? t('common.unlimited') : (q.max_central_points ?? 0) === 0 ? t('common.disabled') : (q.max_central_points ?? 0)
    },
    { label: t('admin.maxMembers'), value: q.max_members === -1 ? t('common.unlimited') : q.max_members },
    {
      label: t('admin.messagesPerMonth'),
      value: q.max_messages_per_month === -1 ? t('common.unlimited') : q.max_messages_per_month.toLocaleString()
    },
    {
      label: t('admin.messagesPerDay'),
      value: q.max_messages_per_day === -1 ? t('common.unlimited') : q.max_messages_per_day.toLocaleString()
    },
    { label: t('admin.rateLimitRpm'), value: q.rate_limit_rpm },
    { label: t('admin.rateLimitBurst'), value: q.rate_limit_burst },
    { label: t('admin.maxLlmConfigs'), value: q.max_llm_configs === -1 ? t('common.unlimited') : q.max_llm_configs }
  ]
})
</script>

<template>
  <div class="min-w-0 flex-1 flex flex-col overflow-hidden">
    <UDashboardPanel :id="`admin-org-${orgId}`">
    <template #header>
      <UDashboardNavbar :title="org?.display_name || org?.name || orgId">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" :to="localePath('/admin/orgs')" variant="outline" />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <InfoPopover title-key="info.admin.orgDetail.title" description-key="info.admin.orgDetail.description" />
            <UButton color="primary" variant="outline" icon="i-lucide-user-plus" :label="t('settings.addMember')" @click="showAdd = true" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 flex flex-col gap-6">
        <!-- Identity card -->
        <UCard v-if="org">
          <template #header>
            <p class="font-semibold">{{ t('admin.details') }}</p>
          </template>
          <dl class="grid grid-cols-2 gap-4">
            <div>
              <dt class="text-dimmed text-sm">{{ t('admin.orgId') }}</dt>
              <dd class="font-mono text-sm mt-1">{{ org.org_id }}</dd>
            </div>
            <div>
              <dt class="text-dimmed text-sm">{{ t('dashboard.status') }}</dt>
              <dd class="mt-1">
                <UBadge :color="org.status === 'active' ? 'success' : 'neutral'" size="sm" variant="subtle">
                  {{ org.status }}
                </UBadge>
              </dd>
            </div>
            <div>
              <dt class="text-dimmed text-sm">{{ t('admin.slugName') }}</dt>
              <dd class="font-mono text-sm mt-1">{{ org.name }}</dd>
            </div>
            <div>
              <dt class="text-dimmed text-sm">{{ t('settings.domain') }}</dt>
              <dd class="font-mono text-sm mt-1">{{ org.domain || t('common.empty') }}</dd>
            </div>
            <div>
              <dt class="text-dimmed text-sm">{{ t('settings.subscriptionTier') }}</dt>
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
            <p class="font-semibold">{{ t('admin.editOrganization') }}</p>
          </template>
          <UForm ref="orgFormRef" :schema="editSchema" :state="form" class="flex flex-col gap-4" @submit="saveOrg">
            <div class="grid grid-cols-2 gap-4">
              <UFormField :label="t('settings.displayName')" name="display_name">
                <UInput v-model="form.display_name" class="w-full" :placeholder="t('settings.acmePlaceholder')" />
              </UFormField>
              <UFormField :label="t('settings.domain')" name="domain">
                <UInput v-model="form.domain" class="w-full" :placeholder="t('admin.domainPlaceholder')" />
              </UFormField>
              <UFormField :label="t('settings.subscriptionTier')" name="tier">
                <USelect v-model="form.tier" :items="tierOptions" class="w-full" />
              </UFormField>
              <UFormField :label="t('settings.contactEmail')" name="contact_email">
                <UInput v-model="form.contact_email" class="w-full" :placeholder="t('settings.adminEmailPlaceholder')" type="email" />
              </UFormField>
              <UFormField :label="t('settings.website')" name="website">
                <UInput v-model="form.website" class="w-full" :placeholder="t('settings.websitePlaceholder')" />
              </UFormField>
              <UFormField :label="t('settings.country')" name="country">
                <UInput v-model="form.country" class="w-full" :placeholder="t('settings.countryPlaceholder')" />
              </UFormField>
              <UFormField :label="t('settings.timezone')" name="timezone">
                <UInput v-model="form.timezone" class="w-full" :placeholder="t('settings.timezonePlaceholder')" />
              </UFormField>
              <UFormField :label="t('settings.logoUrl')" name="logo_url">
                <UInput v-model="form.logo_url" class="w-full" :placeholder="t('settings.logoPlaceholder')" />
              </UFormField>
              <UFormField class="col-span-2" :label="t('settings.description')" name="description">
                <UTextarea v-model="form.description" class="w-full" :placeholder="t('settings.briefDescription')" />
              </UFormField>
            </div>
            <div class="flex justify-end mt-2">
              <ConfirmActionPopover
                label-key="common.save"
                icon="i-lucide-save"
                confirm-title-key="common.saveConfirmTitle"
                confirm-message-key="common.saveConfirmMessage"
                confirm-label-key="common.saveConfirmFriendly"
                :loading="saving"
                :on-confirm="() => orgFormRef?.$el?.requestSubmit?.()"
              />
            </div>
          </UForm>
        </UCard>

        <!-- Quota card -->
        <UCard v-if="displayQuota">
          <template #header>
            <div class="flex items-center gap-2">
              <p class="font-semibold">{{ t('admin.tierQuota') }}</p>
              <UBadge v-if="isPreviewingTier" :color="subscriptionTierColor(form.tier ?? '')" size="sm" variant="soft">
                {{ t('admin.preview') }}: {{ form.tier?.toUpperCase() }}
              </UBadge>
            </div>
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
            <p class="font-semibold">{{ t('settings.members') }}</p>
          </template>
          <UTable :columns="memberColumns" :data="members || []">
            <template #is_admin-cell="{ row }">
              <UBadge :color="row.original.is_admin ? 'warning' : 'neutral'" size="sm" variant="subtle">
                {{ row.original.is_admin ? t('roles.orgAdmin') : t('roles.member') }}
              </UBadge>
            </template>
            <template #actions-cell="{ row }">
              <UPopover>
                <UButton color="error" icon="i-lucide-trash" size="xs" />
                <template #content="{ close }">
                  <div class="p-4 min-w-48">
                    <p class="text-sm text-dimmed mb-3">{{ t('admin.removeMemberConfirm') }}</p>
                    <div class="flex justify-end gap-2">
                      <UButton color="neutral" :label="t('common.cancel')" variant="outline" @click="close" />
                      <UButton
                        color="error"
                        :label="t('common.remove')"
                        :loading="removing === row.original.user_id"
                        @click="async () => { await removeMember(row.original.user_id); close() }"
                      />
                    </div>
                  </div>
                </template>
              </UPopover>
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
  </div>
</template>
