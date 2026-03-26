<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type {
  OrganizationResponse,
  TierDefinitionResponse,
  TierQuota,
  UpdateOrganizationRequest,
  UserMembershipResponse
} from '~/types'
import { getApiErrorMessage, SUBSCRIPTION_TIERS, subscriptionTierSelectItems } from '~/utils'

const route = useRoute()
const toast = useToast()
const { t } = useI18n()
const { withOverlay } = useLoadingOverlay()
const localePath = useLocalePath()
const orgId = route.params.id as string
const showAdd = ref(false)
const saving = ref(false)
const orgFormRef = ref<{ $el?: { requestSubmit?: () => void } } | null>(null)

const { data: org, refresh: refreshOrg } = await useApiFetch<OrganizationResponse>(`/api/admin/orgs/${orgId}`)
const { data: quota, refresh: refreshQuota } = await useApiFetch<TierQuota>(`/api/admin/orgs/${orgId}/quota`)
const { data: tiers } = await useApiFetch<TierDefinitionResponse[]>('/api/admin/tiers')
const { data: members, refresh: refreshMembers } = await useApiFetch<UserMembershipResponse[]>(
  `/api/orgs/${orgId}/users`
)

const tierOptions = subscriptionTierSelectItems(SUBSCRIPTION_TIERS)

const editSchema = z.object({
  display_name: z.string().optional().nullable(),
  domain: z
    .string()
    .min(1, { message: t('common.domainEmpty') })
    .optional()
    .nullable(),
  tier: z.string().optional().nullable(),
  contact_email: z
    .string()
    .email({ message: t('common.invalidEmail') })
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

// Nuxt UI inputs model `string | undefined`; org PATCH fields are nullable — same reactive object, looser template typing.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- bridge nullable API fields to input v-model
const formUi = form as any

async function saveOrg(event?: FormSubmitEvent<EditSchema>) {
  saving.value = true
  try {
    await withOverlay(async () => {
      await $fetch(`/api/admin/orgs/${orgId}`, {
        method: 'PATCH',
        body: event?.data ?? form
      })
      await refreshOrg()
      await refreshQuota()
      toast.add({ title: t('admin.organizationUpdated'), icon: 'i-lucide-check' })
    })
  } catch (err: unknown) {
    toast.add({
      title: t('errors.error'),
      description: getApiErrorMessage(err, t('admin.failedSaveOrg')),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

function openAdd() {
  showAdd.value = true
}

function handleAddClose() {
  showAdd.value = false
  refreshMembers()
}

const removing = ref<string | null>(null)

async function removeMember(userId: string) {
  removing.value = userId
  try {
    await withOverlay(async () => {
      await $fetch(`/api/orgs/${orgId}/users/${userId}`, { method: 'DELETE' })
      await refreshMembers()
      toast.add({ title: t('settings.memberRemoved'), icon: 'i-lucide-check' })
    })
  } catch (err: unknown) {
    toast.add({
      title: t('errors.error'),
      description: getApiErrorMessage(err, t('settings.failedRemoveMember')),
      color: 'error'
    })
  } finally {
    removing.value = null
  }
}

async function handleRemoveConfirm(userId: string, close: () => void) {
  await removeMember(userId)
  close()
}

const memberColumns = computed(() => [
  { accessorKey: 'username', header: t('settings.username') },
  { accessorKey: 'email', header: t('profile.email') },
  { accessorKey: 'is_admin', header: t('profile.role') },
  { id: 'actions' }
])

const displayQuota = computed(() => {
  const selectedTier = form.tier
  if (selectedTier && tiers.value?.length) {
    const tierDef = tiers.value.find((row) => row.tier_name.toLowerCase() === selectedTier.toLowerCase())
    if (tierDef?.quota) return tierDef.quota
  }
  return quota.value ?? null
})

const isPreviewingTier = computed(
  () => !!form.tier && form.tier.toLowerCase() !== (org.value?.tier ?? '').toLowerCase()
)

const quotaRows = computed(() => {
  const q = displayQuota.value
  if (!q) return []
  return [
    {
      label: t('admin.maxAiApps'),
      value: q.max_orchestrators === -1 ? t('common.unlimited') : q.max_orchestrators
    },
    {
      label: t('admin.maxCentralPoints'),
      value:
        (q.max_central_points ?? 0) === -1
          ? t('common.unlimited')
          : (q.max_central_points ?? 0) === 0
            ? t('common.disabled')
            : (q.max_central_points ?? 0)
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
            <UButton icon="i-lucide-arrow-left" :to="localePath('/admin/orgs')" />
          </template>
          <template #right>
            <div class="flex items-center gap-2">
              <InfoPopover title-key="info.admin.orgDetail.title" description-key="info.admin.orgDetail.description" />
              <UButton color="primary" icon="i-lucide-user-plus" :label="t('settings.addMember')" @click="openAdd" />
            </div>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="pt-2 pl-6 pr-6 pr-6 flex flex-col gap-2">
          <AdminOrgIdentityCard v-if="org" :organization="org" />

          <UCard variant="soft">
            <template #header>
              <p class="font-semibold">{{ t('admin.editOrganization') }}</p>
            </template>
            <UForm ref="orgFormRef" :schema="editSchema" :state="form" class="flex flex-col gap-4" @submit="saveOrg">
              <div class="grid grid-cols-2 gap-4">
                <UFormField :label="t('settings.displayName')" name="display_name">
                  <UInput v-model="formUi.display_name" class="w-full" :placeholder="t('settings.acmePlaceholder')" />
                </UFormField>
                <UFormField :label="t('settings.domain')" name="domain">
                  <UInput v-model="formUi.domain" class="w-full" :placeholder="t('admin.domainPlaceholder')" />
                </UFormField>
                <UFormField :label="t('settings.subscriptionTier')" name="tier">
                  <USelect v-model="formUi.tier" :items="tierOptions" class="w-full" />
                </UFormField>
                <UFormField :label="t('settings.contactEmail')" name="contact_email">
                  <UInput
                    v-model="formUi.contact_email"
                    class="w-full"
                    :placeholder="t('settings.adminEmailPlaceholder')"
                    type="email"
                  />
                </UFormField>
                <UFormField :label="t('settings.website')" name="website">
                  <UInput v-model="formUi.website" class="w-full" :placeholder="t('settings.websitePlaceholder')" />
                </UFormField>
                <UFormField :label="t('settings.country')" name="country">
                  <UInput v-model="formUi.country" class="w-full" :placeholder="t('settings.countryPlaceholder')" />
                </UFormField>
                <UFormField :label="t('settings.timezone')" name="timezone">
                  <UInput v-model="formUi.timezone" class="w-full" :placeholder="t('settings.timezonePlaceholder')" />
                </UFormField>
                <UFormField :label="t('settings.logoUrl')" name="logo_url">
                  <UInput v-model="formUi.logo_url" class="w-full" :placeholder="t('settings.logoPlaceholder')" />
                </UFormField>
                <UFormField class="col-span-2" :label="t('settings.description')" name="description">
                  <UTextarea
                    v-model="formUi.description"
                    class="w-full"
                    :placeholder="t('settings.briefDescription')"
                  />
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

          <AdminOrgQuotaCard
            v-if="displayQuota"
            :quota-rows="quotaRows"
            :is-previewing-tier="isPreviewingTier"
            :preview-tier="form.tier"
          />

          <AdminOrgMembersTable
            :columns="memberColumns"
            :members="members || []"
            :removing="removing"
            @remove-confirmed="handleRemoveConfirm"
          />
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
