<script lang="ts" setup>
import type { TierDefinitionResponse, TierQuota } from '~/types'
import { getApiErrorMessage, subscriptionTierColor } from '~/utils'

const toast = useToast()
const { t } = useI18n()
const { withOverlay } = useLoadingOverlay()

const { data: tiers, refresh: refreshTiers } = await useApiFetch<TierDefinitionResponse[]>('/api/admin/tiers')

const tierSaving = ref<Record<string, boolean>>({})
const draftQuotas = ref<Record<string, TierQuota>>({})

watch(
  tiers,
  (vals) => {
    if (vals) {
      for (const tier of vals) {
        draftQuotas.value[tier.tier_name] = { ...tier.quota }
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
</script>

<template>
  <div class="flex flex-col gap-6 pt-4">
    <UAlert color="info" icon="i-lucide-layers" :title="t('admin.subscriptionTiers')" :description="t('admin.tierQuotasDescription')" variant="subtle" />

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
