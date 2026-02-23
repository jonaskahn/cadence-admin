<script lang="ts" setup>
import type { GlobalSettingResponse, TierDefinitionResponse, TierQuota } from '~/types'
import { SETTINGS_GROUPS } from '~/constants'
import { getApiErrorMessage, subscriptionTierColor } from '~/utils'

const toast = useToast()

// --- Global Settings tab ---
const { data: settings, refresh: refreshSettings } = await useFetch<GlobalSettingResponse[]>('/api/admin/settings')

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
    await $fetch(`/api/admin/settings/${key}`, {
      method: 'PATCH',
      body: { value: editValues.value[key], overridable: overridableValues.value[key] }
    })
    await refreshSettings()
    toast.add({ title: 'Setting updated', icon: 'i-lucide-check' })
  } catch {
    toast.add({ title: 'Failed to update setting', color: 'error' })
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
    .map(([label, keys]) => ({
      label,
      items: keys.flatMap((k) => (byKey[k] ? [byKey[k]] : []))
    }))
    .filter((g) => g.items.length > 0)

  const other = nonTierSettings.filter((s) => !assigned.has(s.key))
  if (other.length) named.push({ label: 'Other', items: other })

  return named
})

// --- Subscription Tiers tab ---
const { data: tiers, refresh: refreshTiers } = await useFetch<TierDefinitionResponse[]>('/api/admin/tiers')

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

function unlimitedLabel(val: number): string {
  return val === -1 ? 'Unlimited' : ''
}

async function saveTier(tierName: string) {
  tierSaving.value[tierName] = true
  try {
    await $fetch(`/api/admin/tiers/${tierName}`, {
      method: 'PATCH',
      body: draftQuotas.value[tierName]
    })
    await refreshTiers()
    toast.add({ title: 'Tier updated', description: `${tierName} quota saved`, icon: 'i-lucide-check', color: 'success' })
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, 'Failed to save tier')
    toast.add({ title: 'Save failed', description: msg, color: 'error' })
  } finally {
    tierSaving.value[tierName] = false
  }
}

const QUOTA_FIELDS: { key: keyof TierQuota; label: string; hint: string }[] = [
  { key: 'max_orchestrators', label: 'Max Orchestrators', hint: '-1 = unlimited' },
  { key: 'max_members', label: 'Max Members', hint: '-1 = unlimited' },
  { key: 'max_messages_per_month', label: 'Max Messages / Month', hint: '-1 = unlimited' },
  { key: 'max_messages_per_day', label: 'Max Messages / Day', hint: '-1 = unlimited' },
  { key: 'max_llm_configs', label: 'Max LLM Configs', hint: '-1 = unlimited' },
  { key: 'rate_limit_rpm', label: 'Rate Limit (RPM)', hint: 'Requests per minute' },
  { key: 'rate_limit_burst', label: 'Rate Limit Burst', hint: 'Burst allowance' }
]

const tabs = [
  { label: 'Settings', slot: 'settings', icon: 'i-lucide-sliders' },
  { label: 'Subscription Tiers', slot: 'tiers', icon: 'i-lucide-layers' }
]
</script>

<template>
  <UDashboardPanel id="admin-settings">
    <template #header>
      <UDashboardNavbar title="Global Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 flex flex-col gap-6">
        <UTabs :items="tabs" variant="link">
          <template #settings>
            <div class="flex flex-col gap-6 pt-4">
              <UAlert color="info" icon="i-lucide-radio" title="Platform-wide defaults" variant="subtle" />

              <UCard v-for="group in allGroups" :key="group.label">
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
                      <div class="flex items-center gap-1.5">
                        <UToggle v-model="overridableValues[setting.key]" size="sm" />
                        <span class="text-xs text-dimmed">Overridable</span>
                      </div>
                      <div class="flex items-center gap-2 min-w-56">
                        <UInput v-model="editValues[setting.key]" class="flex-1" size="sm" />
                        <UButton :loading="saving[setting.key]" label="Save" size="sm"
                          @click="saveSetting(setting.key)" />
                      </div>
                    </div>
                  </div>
                </div>
              </UCard>

              <p v-if="!settings?.length" class="text-dimmed text-sm text-center py-4">No global settings.</p>
            </div>
          </template>

          <template #tiers>
            <div class="flex flex-col gap-6 pt-4">
              <UAlert color="info" icon="i-lucide-layers" title="Subscription tier quotas"
                description="Edit the quota limits for each subscription tier below. These values apply globally — organizations cannot override them."
                variant="subtle" />

              <div v-if="tiers?.length" class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <UCard v-for="tier in tiers" :key="tier.tier_name">
                  <template #header>
                    <div class="flex items-center gap-2">
                      <UBadge :color="subscriptionTierColor(tier.tier_name)" :label="tier.tier_name" variant="subtle" />
                      <p class="font-semibold text-sm capitalize">{{ tier.quota.description || tier.tier_name }}</p>
                    </div>
                  </template>

                  <div v-if="draftQuotas[tier.tier_name]" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div v-for="field in QUOTA_FIELDS" :key="field.key" class="flex flex-col gap-1">
                      <label class="text-xs font-medium text-highlighted">{{ field.label }}</label>
                      <div class="relative">
                        <UInput v-model.number="draftQuotas[tier.tier_name][field.key]" type="number" size="sm"
                          class="w-full" />
                        <span v-if="unlimitedLabel(draftQuotas[tier.tier_name][field.key] as number)"
                          class="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-success pointer-events-none">
                          Unlimited
                        </span>
                      </div>
                      <p class="text-xs text-dimmed">{{ field.hint }}</p>
                    </div>
                  </div>

                  <template #footer>
                    <div class="flex justify-end">
                      <UButton :loading="tierSaving[tier.tier_name]" icon="i-lucide-save" label="Save" size="sm"
                        @click="saveTier(tier.tier_name)" />
                    </div>
                  </template>
                </UCard>
              </div>

              <p v-else class="text-dimmed text-sm text-center py-4">No tier definitions found.</p>
            </div>
          </template>
        </UTabs>
      </div>
    </template>
  </UDashboardPanel>
</template>
