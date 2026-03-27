<script lang="ts" setup>
import { NON_OVERRIDABLE_SETTING_KEYS, SETTINGS_GROUPS } from '~/constants'

const { settings, editValues, overridableValues, saving, saveSetting } = useAdminSettings()
const { t } = useI18n()

const EXCLUDED_KEY_PREFIXES = ['tier.', 'otel.', 'oauth.']
const EXCLUDED_KEYS = new Set(['access_token_ttl_seconds', 'refresh_token_ttl_seconds'])

function isExcluded(key: string): boolean {
  if (EXCLUDED_KEYS.has(key)) return true
  return EXCLUDED_KEY_PREFIXES.some((p) => key.startsWith(p))
}

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

const allGroups = computed(() => {
  if (!settings.value) return []

  const filtered = settings.value.filter((s) => !isExcluded(s.key))
  const byKey = Object.fromEntries(filtered.map((s) => [s.key, s]))
  const assigned = new Set(Object.values(SETTINGS_GROUPS).flat())

  const named = Object.entries(SETTINGS_GROUPS)
    .map(([groupKey, keys]) => ({
      label: SETTINGS_GROUP_KEYS[groupKey] ? t(SETTINGS_GROUP_KEYS[groupKey]) : groupKey,
      items: keys.flatMap((k) => (byKey[k] ? [byKey[k]] : []))
    }))
    .filter((g) => g.items.length > 0)

  const other = filtered.filter((s) => !assigned.has(s.key))
  if (other.length) named.push({ label: t('common.other'), items: other })

  return named
})
</script>

<template>
  <div class="flex flex-col gap-6 pt-4">
    <UAlert color="info" icon="i-lucide-radio" :title="t('admin.platformDefaults')" variant="subtle" />

    <UCard v-for="group in allGroups" :key="group.label" variant="soft">
      <template #header>
        <p class="text-sm font-semibold">{{ group.label }}</p>
      </template>
      <div class="divide-default flex flex-col divide-y">
        <SettingRow
          v-for="setting in group.items"
          :key="setting.key"
          :setting="setting"
          :model-value="editValues[setting.key]"
          :overridable="overridableValues[setting.key] ?? false"
          :show-overridable-toggle="!NON_OVERRIDABLE_SETTING_KEYS.has(setting.key)"
          :saving="saving[setting.key] ?? false"
          @update:model-value="editValues[setting.key] = $event"
          @update:overridable="overridableValues[setting.key] = $event"
          @save="saveSetting(setting.key)"
        />
      </div>
    </UCard>

    <p v-if="!settings?.length" class="text-dimmed py-4 text-center text-sm">{{ t('admin.noGlobalSettings') }}</p>
  </div>
</template>
