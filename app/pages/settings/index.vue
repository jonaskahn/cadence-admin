<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

import type { OrganizationResponse } from '~/types'
import { subscriptionTierColor } from '~/utils'

const auth = useAuth()
const toast = useToast()
const { t } = useI18n()
const { withOverlay } = useLoadingOverlay()
const orgId = computed(() => auth.currentOrgId.value || '')
const isOrgAdmin = computed(
  () => auth.currentOrg.value?.role === 'org_admin' || auth.currentOrg.value?.role === 'sys_admin'
)

const { data: org, refresh: refreshOrg } = await useApiFetch<OrganizationResponse>(() => `/api/orgs/${orgId.value}`, {
  watch: [orgId]
})

const profileSchema = z.object({
  display_name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  contact_email: z
    .string()
    .email({ error: () => t('common.invalidEmail') })
    .optional()
    .nullable()
    .or(z.literal('')),
  website: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  timezone: z.string().optional().nullable()
})
type ProfileSchema = z.output<typeof profileSchema>

/** Form model for Nuxt UI inputs (`string | undefined` only; API/nullable handled by Zod on submit). */
type OrgProfileFormState = {
  display_name?: string
  description?: string
  contact_email?: string
  website?: string
  logo_url?: string
  country?: string
  timezone?: string
}

const profileState = reactive<OrgProfileFormState>({
  display_name: org.value?.display_name ?? undefined,
  description: org.value?.description ?? undefined,
  contact_email: org.value?.contact_email ?? undefined,
  website: org.value?.website ?? undefined,
  logo_url: org.value?.logo_url ?? undefined,
  country: org.value?.country ?? undefined,
  timezone: org.value?.timezone ?? undefined
})

watch(
  () => org.value,
  (o) => {
    if (!o) return
    profileState.display_name = o.display_name ?? undefined
    profileState.description = o.description ?? undefined
    profileState.contact_email = o.contact_email ?? undefined
    profileState.website = o.website ?? undefined
    profileState.logo_url = o.logo_url ?? undefined
    profileState.country = o.country ?? undefined
    profileState.timezone = o.timezone ?? undefined
  },
  { immediate: true }
)

const savingProfile = ref(false)
const settingsProfileFormRef = ref<{ $el?: { requestSubmit?: () => void } } | null>(null)

async function onProfileSubmit(event: FormSubmitEvent<ProfileSchema>) {
  savingProfile.value = true
  try {
    await withOverlay(async () => {
      await $fetch(`/api/orgs/${orgId.value}/profile`, {
        method: 'PATCH',
        body: event.data
      })
      await refreshOrg()
      toast.add({ title: t('settings.organizationUpdated'), icon: 'i-lucide-check', color: 'success' })
    })
  } catch {
    toast.add({ title: t('settings.failedUpdateOrg'), color: 'error' })
  } finally {
    savingProfile.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <!-- Read-only org identity -->
    <UPageCard>
      <template #header>
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold">{{ t('settings.organization') }}</span>
          <InfoPopover
            title-key="info.settings.orgIdentity.title"
            description-key="info.settings.orgIdentity.description"
          />
        </div>
      </template>
      <dl class="grid grid-cols-2 gap-4">
        <div>
          <dt class="text-dimmed text-sm">{{ t('settings.organizationId') }}</dt>
          <dd class="mt-1 font-mono text-sm">{{ orgId }}</dd>
        </div>
        <div>
          <dt class="text-dimmed text-sm">{{ t('settings.yourRole') }}</dt>
          <dd class="mt-1">
            <UBadge size="sm" variant="subtle">{{
              auth.currentOrg.value?.role?.toUpperCase() || t('common.empty')
            }}</UBadge>
          </dd>
        </div>
        <div>
          <dt class="text-dimmed text-sm">{{ t('settings.slug') }}</dt>
          <dd class="mt-1 font-mono text-sm">{{ org?.name || t('common.empty') }}</dd>
        </div>
        <div>
          <dt class="text-dimmed text-sm">{{ t('settings.domain') }}</dt>
          <dd class="mt-1 font-mono text-sm">{{ org?.domain || t('common.empty') }}</dd>
        </div>
        <div>
          <dt class="text-dimmed text-sm">{{ t('settings.subscriptionTier') }}</dt>
          <dd class="mt-1">
            <UBadge v-if="org?.tier" :color="subscriptionTierColor(org.tier)" size="sm" variant="subtle">
              {{ org.tier.toUpperCase() }}
            </UBadge>
            <span v-else class="text-dimmed text-sm">{{ t('common.empty') }}</span>
          </dd>
        </div>
        <div>
          <dt class="text-dimmed text-sm">{{ t('settings.status') }}</dt>
          <dd class="mt-1">
            <UBadge :color="org?.status === 'active' ? 'success' : 'neutral'" size="sm" variant="subtle">
              {{ org?.status || t('common.empty') }}
            </UBadge>
          </dd>
        </div>
      </dl>
    </UPageCard>

    <!-- Editable profile (org_admin only) -->
    <UPageCard v-if="isOrgAdmin" :description="t('settings.orgProfileDescription')">
      <template #header>
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold">{{ t('settings.organizationProfile') }}</span>
          <InfoPopover
            title-key="info.settings.orgProfile.title"
            description-key="info.settings.orgProfile.description"
          />
        </div>
      </template>
      <UForm
        ref="settingsProfileFormRef"
        :schema="profileSchema"
        :state="profileState"
        class="flex flex-col gap-4"
        @submit="onProfileSubmit"
      >
        <div class="grid grid-cols-2 gap-4">
          <UFormField name="display_name">
            <template #label>
              <div class="flex items-center gap-2">
                <span>{{ t('settings.displayName') }}</span>
                <InfoPopover
                  title-key="info.fields.displayName.title"
                  description-key="info.fields.displayName.description"
                />
              </div>
            </template>
            <UInput v-model="profileState.display_name" class="w-full" :placeholder="t('settings.acmePlaceholder')" />
          </UFormField>
          <UFormField :label="t('settings.contactEmail')" name="contact_email">
            <UInput
              v-model="profileState.contact_email"
              class="w-full"
              :placeholder="t('settings.adminEmailPlaceholder')"
              type="email"
            />
          </UFormField>
          <UFormField :label="t('settings.website')" name="website">
            <UInput v-model="profileState.website" class="w-full" :placeholder="t('settings.websitePlaceholder')" />
          </UFormField>
          <UFormField :label="t('settings.country')" name="country">
            <UInput v-model="profileState.country" class="w-full" :placeholder="t('settings.countryPlaceholder')" />
          </UFormField>
          <UFormField :label="t('settings.timezone')" name="timezone">
            <UInput v-model="profileState.timezone" class="w-full" :placeholder="t('settings.timezonePlaceholder')" />
          </UFormField>
          <UFormField :label="t('settings.logoUrl')" name="logo_url">
            <UInput v-model="profileState.logo_url" class="w-full" :placeholder="t('settings.logoPlaceholder')" />
          </UFormField>
          <UFormField class="col-span-2" :label="t('settings.description')" name="description">
            <UTextarea
              v-model="profileState.description"
              class="w-full"
              :placeholder="t('settings.briefDescription')"
            />
          </UFormField>
        </div>
        <div class="flex justify-end pt-2">
          <ConfirmActionPopover
            label-key="common.save"
            confirm-title-key="common.saveConfirmTitle"
            confirm-message-key="common.saveConfirmMessage"
            confirm-label-key="common.saveConfirmFriendly"
            :loading="savingProfile"
            :on-confirm="() => settingsProfileFormRef?.$el?.requestSubmit?.()"
          />
        </div>
      </UForm>
    </UPageCard>
  </div>
</template>
