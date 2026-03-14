<script lang="ts" setup>
import type { PluginMetadataResponse, PluginSetting, PluginSettingsEntry } from '~/types'

const SENSITIVE_FIELD_PATTERN = /key|secret|password|token/i

type PluginSettings = Record<string, PluginSettingsEntry>
type FieldType = 'boolean' | 'number' | 'text' | 'json'

interface VersionEntry {
  specKey: string
  entry: PluginSettingsEntry
}

interface PluginGroup {
  groupKey: string
  pid: string
  name: string
  source: 'system' | 'org'
  versions: VersionEntry[]
}

function sourceLabel(source: string): string {
  return source === 'system' ? t('plugins.system') : t('plugins.org')
}

const props = defineProps<{
  initialValue: PluginSettings
  disabled?: boolean
  orgId?: string
}>()

const { t } = useI18n()
const auth = useAuth()
const resolvedOrgId = computed(() => props.orgId || auth.currentOrgId.value || '')

const local = ref<PluginSettings>(JSON.parse(JSON.stringify(props.initialValue ?? {})))

watch(
  () => props.initialValue,
  (val) => {
    local.value = JSON.parse(JSON.stringify(val ?? {}))
    initSelectedVersions()
    enrichMissingSchemas()
  }
)

const selectedVersionKey = reactive<Record<string, string>>({})

function initSelectedVersions() {
  for (const [specKey, entry] of Object.entries(local.value)) {
    const groupKey = `${entry.id}::${entry.source ?? 'system'}`
    if (!selectedVersionKey[groupKey] || entry.active) {
      selectedVersionKey[groupKey] = specKey
    }
  }
}

initSelectedVersions()

const expandedPlugins = ref<Record<string, boolean>>({})

onMounted(() => {
  const initial: Record<string, boolean> = {}
  for (const [_, entry] of Object.entries(local.value)) {
    const groupKey = `${entry.id}::${entry.source ?? 'system'}`
    if (entry.active) initial[groupKey] = true
  }
  expandedPlugins.value = initial
  enrichMissingSchemas()
})

async function enrichMissingSchemas() {
  if (!resolvedOrgId.value) return
  for (const [specKey, entry] of Object.entries(local.value)) {
    if (entry.settings_schema?.length || entry.settings.length === 0) continue
    const source = (entry.source ?? 'org') as 'system' | 'org'
    try {
      const versions = await $fetch<PluginMetadataResponse[]>(`/api/orgs/${resolvedOrgId.value}/plugins/${entry.id}/versions?source=${source}`)
      const match = versions.find((v) => v.version === entry.version)
      if (match?.settings_schema?.length) {
        local.value[specKey] = { ...local.value[specKey], settings_schema: match.settings_schema }
      }
    } catch {
      /* ignore */
    }
  }
}

function togglePlugin(groupKey: string) {
  expandedPlugins.value = { ...expandedPlugins.value, [groupKey]: !expandedPlugins.value[groupKey] }
}

function selectVersion(groupKey: string, specKey: string) {
  selectedVersionKey[groupKey] = specKey
}

function sortVersionsByActivity(versions: VersionEntry[]): VersionEntry[] {
  return [...versions].sort((a, b) => {
    if (a.entry.active && !b.entry.active) return -1
    if (!a.entry.active && b.entry.active) return 1
    return b.entry.version.localeCompare(a.entry.version, undefined, { numeric: true })
  })
}

const pluginGroups = computed<PluginGroup[]>(() => {
  const map = new Map<string, PluginGroup>()
  for (const [specKey, entry] of Object.entries(local.value)) {
    const pid = entry.id
    const source = (entry.source ?? 'system') as 'system' | 'org'
    const groupKey = `${pid}::${source}`
    if (!map.has(groupKey)) {
      map.set(groupKey, { groupKey, pid, name: entry.name, source, versions: [] })
    }
    map.get(groupKey)!.versions.push({ specKey, entry })
  }
  for (const group of map.values()) {
    group.versions = sortVersionsByActivity(group.versions)
  }
  return Array.from(map.values())
})

function labelFromKey(key: string): string {
  const acronyms = new Set(['api', 'url', 'id', 'llm', 'ai', 'sdk', 'uri'])
  return key
    .split('_')
    .map((word) => (acronyms.has(word.toLowerCase()) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
}

function getLabel(entry: PluginSettingsEntry, key: string): string {
  const schemaItem = entry.settings_schema?.find((s) => s.key === key)
  return schemaItem?.name ?? labelFromKey(key)
}

function schemaTypeToFieldType(schemaType: string): FieldType {
  const t = schemaType?.toLowerCase() ?? ''
  if (t === 'bool' || t === 'boolean') return 'boolean'
  if (t === 'int' || t === 'integer') return 'number'
  if (t === 'float' || t === 'number') return 'number'
  if (t === 'json' || t === 'object') return 'json'
  return 'text'
}

function inferType(v: unknown): FieldType {
  if (typeof v === 'boolean') return 'boolean'
  if (typeof v === 'number') return 'number'
  if (v !== null && typeof v === 'object') return 'json'
  return 'text'
}

function getFieldType(entry: PluginSettingsEntry, setting: PluginSetting): FieldType {
  const schemaItem = entry.settings_schema?.find((s) => s.key === setting.key)
  if (schemaItem) return schemaTypeToFieldType(schemaItem.type)
  return inferType(setting.value)
}

function isSensitive(entry: PluginSettingsEntry, key: string): boolean {
  const schemaItem = entry.settings_schema?.find((s) => s.key === key)
  if (schemaItem) return schemaItem.sensitive
  return SENSITIVE_FIELD_PATTERN.test(key)
}

function getDescription(entry: PluginSettingsEntry, key: string): string | undefined {
  return entry.settings_schema?.find((s) => s.key === key)?.description
}

function isRequired(entry: PluginSettingsEntry, key: string): boolean {
  const schemaItem = entry.settings_schema?.find((s) => s.key === key)
  return schemaItem?.required ?? false
}

function getFieldError(entry: PluginSettingsEntry, setting: PluginSetting): string | undefined {
  if (!entry.active) return undefined
  if (!isRequired(entry, setting.key)) return undefined
  const fieldType = getFieldType(entry, setting)
  if (!isEmpty(setting.value, fieldType)) return undefined
  return t('orchestratorPlugin.required')
}

function getDisplayValue(setting: PluginSetting): string | number | boolean {
  const type = inferType(setting.value)
  if (type === 'json') return JSON.stringify(setting.value, null, 2)
  if (setting.value === null || setting.value === undefined) return ''
  return setting.value as string | number | boolean
}

function parseFieldValue(type: FieldType, raw: unknown, originalValue: unknown): unknown {
  if (type === 'number') {
    const n = Number(raw)
    return isNaN(n) ? 0 : n
  }
  if (type === 'text') {
    return originalValue === null && raw === '' ? null : raw
  }
  if (type === 'json') {
    try {
      return JSON.parse(raw as string)
    } catch {
      return raw
    }
  }
  return raw
}

function onFieldUpdate(specKey: string, key: string, raw: unknown) {
  const entry = local.value[specKey]
  if (!entry) return
  const setting = entry.settings.find((s) => s.key === key)
  if (!setting) return

  const fieldType = getFieldType(entry, setting)
  const originalValue = props.initialValue?.[specKey]?.settings.find((s) => s.key === key)?.value
  setting.value = parseFieldValue(fieldType, raw, originalValue)
}

function isEmpty(value: unknown, fieldType: FieldType): boolean {
  if (value === null || value === undefined) return true
  if (fieldType === 'text' && value === '') return true
  if (fieldType === 'json' && (value === '' || (typeof value === 'string' && value.trim() === ''))) return true
  return false
}

function validateRequired(): { valid: boolean; message?: string } {
  for (const [, entry] of Object.entries(local.value)) {
    if (!entry.active) continue
    for (const setting of entry.settings) {
      if (!isRequired(entry, setting.key)) continue
      const fieldType = getFieldType(entry, setting)
      if (isEmpty(setting.value, fieldType)) {
        const label = getLabel(entry, setting.key)
        return { valid: false, message: t('orchestratorPlugin.fieldRequired', { label }) }
      }
    }
  }
  return { valid: true }
}

defineExpose({
  getValue: (): PluginSettings => JSON.parse(JSON.stringify(local.value)),
  isValid: (): boolean => validateRequired().valid,
  validate: (): { valid: boolean; message?: string } => validateRequired()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <p v-if="pluginGroups.length === 0" class="text-dimmed text-sm text-center py-2">{{ t('orchestratorPlugin.noSettingsConfigured') }}</p>

    <div v-for="group in pluginGroups" :key="group.groupKey" class="border border-default rounded-lg overflow-hidden">
      <button
        class="w-full px-4 py-2.5 bg-elevated/50 flex items-center justify-between hover:bg-elevated/80 transition-colors"
        type="button"
        @click="togglePlugin(group.groupKey)"
      >
        <div class="flex items-center gap-3">
          <div class="text-left">
            <p class="font-semibold text-sm">{{ group.name }}</p>
            <p class="font-mono text-xs text-dimmed mt-0.5">{{ group.pid }} — {{ sourceLabel(group.source) }}</p>
          </div>
          <UBadge v-if="group.versions.some((v) => v.entry.active)" color="success" size="xs" variant="subtle">
            {{ t('orchestratorPlugin.active') }}
          </UBadge>
          <UBadge color="neutral" size="xs" variant="subtle"> {{ sourceLabel(group.source) }} </UBadge>
          <UBadge color="neutral" size="xs" variant="subtle">
            {{ group.versions.length }} {{ group.versions.length > 1 ? t('orchestratorPlugin.versions') : t('orchestratorPlugin.version') }}
          </UBadge>
        </div>
        <UIcon :name="expandedPlugins[group.groupKey] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4 text-dimmed shrink-0" />
      </button>

      <div v-show="expandedPlugins[group.groupKey]" class="border-t border-default">
        <div v-if="group.versions.length > 1" class="flex gap-0 border-b border-default overflow-x-auto">
          <button
            v-for="v in group.versions"
            :key="v.specKey"
            :class="
              selectedVersionKey[group.groupKey] === v.specKey ? 'border-primary text-primary font-medium' : 'border-transparent text-dimmed hover:text-default'
            "
            class="px-4 py-2 text-sm flex items-center gap-2 shrink-0 border-b-2 transition-colors"
            type="button"
            @click="selectVersion(group.groupKey, v.specKey)"
          >
            v{{ v.entry.version }}
            <UBadge v-if="v.entry.active" color="success" size="xs" variant="subtle">{{ t('orchestratorPlugin.active') }}</UBadge>
          </button>
        </div>

        <template v-for="v in group.versions" :key="v.specKey">
          <div v-show="group.versions.length === 1 || selectedVersionKey[group.groupKey] === v.specKey" class="p-4">
            <div v-if="group.versions.length === 1" class="flex items-center gap-2 mb-4">
              <span class="text-xs text-dimmed font-mono">v{{ v.entry.version }}</span>
              <UBadge v-if="v.entry.active" color="success" size="xs" variant="subtle">{{ t('orchestratorPlugin.active') }}</UBadge>
            </div>

            <p v-if="v.entry.settings.length === 0" class="text-dimmed text-sm">{{ t('orchestratorPlugin.noSettingsForVersion') }}</p>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              <template v-for="setting in v.entry.settings" :key="setting.key">
                <div v-if="getFieldType(v.entry, setting) === 'boolean'" class="sm:col-span-2 lg:col-span-1">
                  <UFormField
                    :description="getDescription(v.entry, setting.key)"
                    :error="getFieldError(v.entry, setting)"
                    :label="getLabel(v.entry, setting.key)"
                    :required="isRequired(v.entry, setting.key)"
                  >
                    <UCheckbox
                      :disabled="disabled || !v.entry.active"
                      :model-value="Boolean(setting.value)"
                      @update:model-value="onFieldUpdate(v.specKey, setting.key, $event)"
                    />
                  </UFormField>
                </div>

                <UFormField
                  v-else-if="getFieldType(v.entry, setting) === 'number'"
                  :description="getDescription(v.entry, setting.key)"
                  :error="getFieldError(v.entry, setting)"
                  :label="getLabel(v.entry, setting.key)"
                  :required="isRequired(v.entry, setting.key)"
                >
                  <UInput
                    :disabled="disabled || !v.entry.active"
                    :model-value="getDisplayValue(setting) as number"
                    class="w-full"
                    type="number"
                    @update:model-value="onFieldUpdate(v.specKey, setting.key, $event)"
                  />
                </UFormField>

                <div v-else-if="getFieldType(v.entry, setting) === 'json'" class="sm:col-span-2 lg:col-span-3">
                  <UFormField
                    :description="getDescription(v.entry, setting.key)"
                    :error="getFieldError(v.entry, setting)"
                    :label="getLabel(v.entry, setting.key)"
                    :required="isRequired(v.entry, setting.key)"
                  >
                    <UTextarea
                      :disabled="disabled || !v.entry.active"
                      :model-value="getDisplayValue(setting) as string"
                      :rows="3"
                      class="font-mono text-xs w-full"
                      @update:model-value="onFieldUpdate(v.specKey, setting.key, $event)"
                    />
                  </UFormField>
                </div>

                <UFormField
                  v-else
                  :description="getDescription(v.entry, setting.key)"
                  :error="getFieldError(v.entry, setting)"
                  :label="getLabel(v.entry, setting.key)"
                  :required="isRequired(v.entry, setting.key)"
                >
                  <UInput
                    :disabled="disabled || !v.entry.active"
                    :model-value="getDisplayValue(setting) as string"
                    :type="isSensitive(v.entry, setting.key) ? 'password' : 'text'"
                    class="w-full"
                    @update:model-value="onFieldUpdate(v.specKey, setting.key, $event)"
                  />
                </UFormField>
              </template>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
