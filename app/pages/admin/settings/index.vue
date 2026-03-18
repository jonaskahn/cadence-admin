<script lang="ts" setup>
import type { GlobalSettingResponse, TierDefinitionResponse, TierQuota } from '~/types'
import { SETTINGS_GROUPS, NON_OVERRIDABLE_SETTING_KEYS } from '~/constants'
import { getApiErrorMessage, subscriptionTierColor } from '~/utils'

const toast = useToast()
const { t } = useI18n()
const { withOverlay } = useLoadingOverlay()

const SETTINGS_GROUP_KEYS: Record<string, string> = {
  LLM: 'settingsGroups.llm',
  Pool: 'settingsGroups.pool',
  Caching: 'settingsGroups.caching',
  'Rate Limiting': 'settingsGroups.rateLimiting',
  Conversation: 'settingsGroups.conversation',
  Orchestration: 'settingsGroups.orchestration',
  Streaming: 'settingsGroups.streaming',
  Checkpointing: 'settingsGroups.checkpointing',
  'Feature Flags': 'settingsGroups.featureFlags',
  Security: 'settingsGroups.security'
}

// --- Global Settings tab ---
const { data: settings, refresh: refreshSettings } = await useApiFetch<GlobalSettingResponse[]>('/api/admin/settings')

const editValues = ref<Record<string, string>>({})
const overridableValues = ref<Record<string, boolean>>({})
const saving = ref<Record<string, boolean>>({})

watch(
  settings,
  (vals) => {
    if (vals) {
      for (const s of vals) {
        editValues.value[s.key] = String(s.value)
        overridableValues.value[s.key] = s.overridable
      }
    }
  },
  { immediate: true }
)

async function saveSetting(key: string) {
  saving.value[key] = true
  try {
    await withOverlay(async () => {
      await $fetch(`/api/admin/settings/${key}`, {
        method: 'PATCH',
        body: { value: editValues.value[key], overridable: overridableValues.value[key] }
      })
      await refreshSettings()
      toast.add({ title: t('admin.settingUpdated'), icon: 'i-lucide-check' })
    })
  } catch {
    toast.add({ title: t('admin.failedUpdateSetting'), color: 'error' })
  } finally {
    saving.value[key] = false
  }
}

const allGroups = computed(() => {
  if (!settings.value) return []

  const nonTierSettings = settings.value.filter((s) => !s.key.startsWith('tier.'))
  const byKey = Object.fromEntries(nonTierSettings.map((s) => [s.key, s]))
  const assigned = new Set(Object.values(SETTINGS_GROUPS).flat())

  const named = Object.entries(SETTINGS_GROUPS)
    .map(([groupKey, keys]) => ({
      label: SETTINGS_GROUP_KEYS[groupKey] ? t(SETTINGS_GROUP_KEYS[groupKey]) : groupKey,
      items: keys.flatMap((k) => (byKey[k] ? [byKey[k]] : []))
    }))
    .filter((g) => g.items.length > 0)

  const other = nonTierSettings.filter((s) => !assigned.has(s.key))
  if (other.length) named.push({ label: t('common.other'), items: other })

  return named
})

// --- Subscription Tiers tab ---
const { data: tiers, refresh: refreshTiers } = await useApiFetch<TierDefinitionResponse[]>('/api/admin/tiers')

const tierSaving = ref<Record<string, boolean>>({})
const draftQuotas = ref<Record<string, TierQuota>>({})

watch(
  tiers,
  (vals) => {
    if (vals) {
      for (const t of vals) {
        draftQuotas.value[t.tier_name] = { ...t.quota }
      }
    }
  },
  { immediate: true }
)

async function saveTier(tierName: string) {
  tierSaving.value[tierName] = true
  try {
    await withOverlay(async () => {
      await $fetch(`/api/admin/tiers/${tierName}`, {
        method: 'PATCH',
        body: draftQuotas.value[tierName]
      })
      await refreshTiers()
      toast.add({ title: t('admin.tierUpdated'), description: t('admin.quotaSaved'), icon: 'i-lucide-check', color: 'success' })
    })
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, t('admin.failedSaveTier'))
    toast.add({ title: t('admin.saveFailed'), description: msg, color: 'error' })
  } finally {
    tierSaving.value[tierName] = false
  }
}

const QUOTA_FIELDS = computed(() => [
  { key: 'max_orchestrators' as const, label: t('admin.maxOrchestrators'), hint: t('admin.maxOrchestratorsHint') },
  { key: 'max_central_points' as const, label: t('admin.maxCentralPoints'), hint: t('admin.maxCentralPointsHint') },
  { key: 'max_members' as const, label: t('admin.maxMembers'), hint: t('admin.maxMembersHint') },
  { key: 'max_messages_per_month' as const, label: t('admin.messagesPerMonth'), hint: t('admin.maxMessagesMonthHint') },
  { key: 'max_messages_per_day' as const, label: t('admin.messagesPerDay'), hint: t('admin.maxMessagesDayHint') },
  { key: 'max_llm_configs' as const, label: t('admin.maxLlmConfigs'), hint: t('admin.maxLlmConfigsHint') },
  { key: 'rate_limit_rpm' as const, label: t('admin.rateLimitRpm'), hint: t('admin.rateLimitRpmHint') },
  { key: 'rate_chat_limit_rpm' as const, label: t('admin.rateChatLimitRpm'), hint: t('admin.rateChatLimitRpmHint') },
  { key: 'rate_limit_burst' as const, label: t('admin.rateLimitBurst'), hint: t('admin.rateLimitBurstHint') }
])

const tabs = computed(() => [
  { label: t('admin.settings'), slot: 'settings', icon: 'i-lucide-sliders' },
  { label: t('admin.subscriptionTiers'), slot: 'tiers', icon: 'i-lucide-layers' },
  { label: t('admin.llmProviders'), slot: 'llm-providers', icon: 'i-lucide-brain-circuit' }
])
</script>

<template>
  <div class="min-w-0 flex-1 flex flex-col overflow-hidden">
    <UDashboardPanel id="admin-settings">
      <template #header>
        <UDashboardNavbar :title="t('admin.globalSettings')">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <InfoPopover title-key="info.admin.globalSettings.title" description-key="info.admin.globalSettings.description" />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="p-6 flex flex-col gap-6">
          <UTabs :items="tabs" variant="link">
            <template #settings>
              <div class="flex flex-col gap-6 pt-4">
                <UAlert color="info" icon="i-lucide-radio" :title="t('admin.platformDefaults')" variant="subtle" />

                <UCard v-for="group in allGroups" :key="group.label" variant="soft">
                  <template #header>
                    <p class="font-semibold text-sm">{{ group.label }}</p>
                  </template>
                  <div class="flex flex-col divide-y divide-default">
                    <div v-for="setting in group.items" :key="setting.key" class="py-4 flex items-start gap-4">
                      <div class="flex-1">
                        <p class="font-medium text-sm">{{ setting.description }}</p>
                        <p class="text-dimmed text-xs font-mono mt-0.5">{{ setting.key }}</p>
                        <UBadge class="mt-1" size="xs" variant="subtle">{{ setting.value_type }}</UBadge>
                      </div>
                      <div class="flex items-center gap-4">
                        <div v-if="!NON_OVERRIDABLE_SETTING_KEYS.has(setting.key)" class="flex items-center gap-1.5">
                          <UToggle v-model="overridableValues[setting.key]" size="sm" />
                          <span class="text-xs text-dimmed">{{ t('admin.overridable') }}</span>
                        </div>
                        <div class="flex items-center gap-2 min-w-56">
                          <UInput v-model="editValues[setting.key]" class="flex-1" size="sm" />
                          <ConfirmActionPopover
                            label-key="common.save"
                            size="sm"
                            confirm-title-key="common.saveConfirmTitle"
                            confirm-message-key="common.saveConfirmMessage"
                            confirm-label-key="common.saveConfirmFriendly"
                            :loading="saving[setting.key]"
                            :on-confirm="() => saveSetting(setting.key)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </UCard>

                <p v-if="!settings?.length" class="text-dimmed text-sm text-center py-4">{{ t('admin.noGlobalSettings') }}</p>
              </div>
            </template>

            <template #tiers>
              <div class="flex flex-col gap-6 pt-4">
                <UAlert
                  color="info"
                  icon="i-lucide-layers"
                  :title="t('admin.subscriptionTiers')"
                  :description="t('admin.tierQuotasDescription')"
                  variant="subtle"
                />

                <div v-if="tiers?.length" class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <UCard v-for="tier in tiers" :key="tier.tier_name" variant="soft">
                    <template #header>
                      <div class="flex items-center gap-2">
                        <UBadge :color="subscriptionTierColor(tier.tier_name)" :label="tier.tier_name?.toUpperCase()" variant="subtle" />
                        <p class="font-semibold text-sm capitalize">{{ tier.quota.description || tier.tier_name }}</p>
                      </div>
                    </template>

                    <div v-if="draftQuotas[tier.tier_name]" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <UFormField v-for="field in QUOTA_FIELDS" :key="field.key" :label="field.label" :description="field.hint">
                        <div class="relative w-full">
                          <UInput v-model.number="draftQuotas[tier.tier_name][field.key]" type="number" class="w-full" />
                          <span
                            v-if="draftQuotas[tier.tier_name][field.key] === -1"
                            class="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-success pointer-events-none"
                          >
                            {{ t('common.unlimited') }}
                          </span>
                        </div>
                      </UFormField>
                    </div>

                    <template #footer>
                      <div class="flex justify-end">
                        <ConfirmActionPopover
                          label-key="common.save"
                          icon="i-lucide-save"
                          size="sm"
                          confirm-title-key="common.saveConfirmTitle"
                          confirm-message-key="common.saveConfirmMessage"
                          confirm-label-key="common.saveConfirmFriendly"
                          :loading="tierSaving[tier.tier_name]"
                          :on-confirm="() => saveTier(tier.tier_name)"
                        />
                      </div>
                    </template>
                  </UCard>
                </div>

                <p v-else class="text-dimmed text-sm text-center py-4">{{ t('admin.noTierDefinitions') }}</p>
              </div>
            </template>

            <template #llm-providers>
              <div class="pt-4">
                <LLMProviderCatalog />
              </div>
            </template>
          </UTabs>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
