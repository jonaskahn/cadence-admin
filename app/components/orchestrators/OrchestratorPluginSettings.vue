<script lang="ts" setup>
import type { PluginSetting, PluginSettingsEntry } from '~/types'

const SENSITIVE_FIELD_PATTERN = /key|secret|password|token/i

type PluginSettings = Record<string, PluginSettingsEntry>
type FieldType = 'boolean' | 'number' | 'text' | 'json'

interface VersionEntry {
  specKey: string
  entry: PluginSettingsEntry
}

interface PluginGroup {
  pid: string
  name: string
  versions: VersionEntry[]
}

const props = defineProps<{
  initialValue: PluginSettings
  disabled?: boolean
}>()

const emit = defineEmits<{
  activate: [pid: string, version: string]
}>()

const local = ref<PluginSettings>(JSON.parse(JSON.stringify(props.initialValue ?? {})))

watch(
  () => props.initialValue,
  (val) => {
    local.value = JSON.parse(JSON.stringify(val ?? {}))
    initSelectedVersions()
  }
)

const selectedVersionKey = reactive<Record<string, string>>({})

function initSelectedVersions() {
  for (const [specKey, entry] of Object.entries(local.value)) {
    const pid = entry.id
    if (!selectedVersionKey[pid] || entry.active) {
      selectedVersionKey[pid] = specKey
    }
  }
}

initSelectedVersions()

const expandedPlugins = ref<Record<string, boolean>>({})

onMounted(() => {
  const initial: Record<string, boolean> = {}
  for (const [_, entry] of Object.entries(local.value)) {
    if (entry.active) initial[entry.id] = true
  }
  expandedPlugins.value = initial
})

function togglePlugin(pid: string) {
  expandedPlugins.value = { ...expandedPlugins.value, [pid]: !expandedPlugins.value[pid] }
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
    if (!map.has(pid)) {
      map.set(pid, { pid, name: entry.name, versions: [] })
    }
    map.get(pid)!.versions.push({ specKey, entry })
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

function inferType(v: unknown): FieldType {
  if (typeof v === 'boolean') return 'boolean'
  if (typeof v === 'number') return 'number'
  if (v !== null && typeof v === 'object') return 'json'
  return 'text'
}

function isSensitive(key: string): boolean {
  return SENSITIVE_FIELD_PATTERN.test(key)
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

  const originalValue = props.initialValue?.[specKey]?.settings.find((s) => s.key === key)?.value
  setting.value = parseFieldValue(inferType(setting.value), raw, originalValue)
}

defineExpose({
  getValue: (): PluginSettings => JSON.parse(JSON.stringify(local.value))
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <p v-if="pluginGroups.length === 0" class="text-dimmed text-sm text-center py-2">No plugin settings configured.</p>

    <div v-for="group in pluginGroups" :key="group.pid" class="border border-default rounded-lg overflow-hidden">
      <button
        class="w-full px-4 py-2.5 bg-elevated/50 flex items-center justify-between hover:bg-elevated/80 transition-colors"
        type="button"
        @click="togglePlugin(group.pid)"
      >
        <div class="flex items-center gap-3">
          <div class="text-left">
            <p class="font-semibold text-sm">{{ group.name }}</p>
            <p class="font-mono text-xs text-dimmed mt-0.5">{{ group.pid }}</p>
          </div>
          <UBadge v-if="group.versions.some((v) => v.entry.active)" color="success" size="xs" variant="subtle"> Active </UBadge>
          <UBadge color="neutral" size="xs" variant="subtle"> {{ group.versions.length }} version{{ group.versions.length > 1 ? 's' : '' }} </UBadge>
        </div>
        <UIcon :name="expandedPlugins[group.pid] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4 text-dimmed shrink-0" />
      </button>

      <div v-show="expandedPlugins[group.pid]" class="border-t border-default">
        <div v-if="group.versions.length > 1" class="flex gap-0 border-b border-default overflow-x-auto">
          <button
            v-for="v in group.versions"
            :key="v.specKey"
            :class="
              selectedVersionKey[group.pid] === v.specKey ? 'border-primary text-primary font-medium' : 'border-transparent text-dimmed hover:text-default'
            "
            class="px-4 py-2 text-sm flex items-center gap-2 shrink-0 border-b-2 transition-colors"
            type="button"
            @click="selectedVersionKey[group.pid] = v.specKey"
          >
            v{{ v.entry.version }}
            <UBadge v-if="v.entry.active" color="success" size="xs" variant="subtle"> Active</UBadge>
          </button>
        </div>

        <template v-for="v in group.versions" :key="v.specKey">
          <div v-show="group.versions.length === 1 || selectedVersionKey[group.pid] === v.specKey" class="p-4 flex flex-col gap-3">
            <div v-if="group.versions.length === 1" class="flex items-center gap-2">
              <span class="text-xs text-dimmed font-mono">v{{ v.entry.version }}</span>
              <UBadge v-if="v.entry.active" color="success" size="xs" variant="subtle"> Active</UBadge>
            </div>

            <div v-if="!v.entry.active && !disabled" class="flex items-center justify-between p-3 bg-elevated/30 rounded-md border border-default">
              <p class="text-sm text-dimmed">This version is not active.</p>
              <UButton color="primary" icon="i-lucide-zap" label="Activate" size="xs" variant="outline" @click="emit('activate', group.pid, v.entry.version)" />
            </div>

            <p v-if="v.entry.settings.length === 0" class="text-dimmed text-sm">No settings for this version.</p>

            <template v-for="setting in v.entry.settings" :key="setting.key">
              <UFormField v-if="inferType(setting.value) === 'boolean'" :label="labelFromKey(setting.key)">
                <UCheckbox
                  :disabled="disabled || !v.entry.active"
                  :model-value="Boolean(setting.value)"
                  @update:model-value="onFieldUpdate(v.specKey, setting.key, $event)"
                />
              </UFormField>

              <UFormField v-else-if="inferType(setting.value) === 'number'" :label="labelFromKey(setting.key)">
                <UInput
                  :disabled="disabled || !v.entry.active"
                  :model-value="getDisplayValue(setting) as number"
                  class="w-full"
                  type="number"
                  @update:model-value="onFieldUpdate(v.specKey, setting.key, $event)"
                />
              </UFormField>

              <UFormField v-else-if="inferType(setting.value) === 'json'" :label="labelFromKey(setting.key)">
                <UTextarea
                  :disabled="disabled || !v.entry.active"
                  :model-value="getDisplayValue(setting) as string"
                  :rows="3"
                  class="font-mono text-xs w-full"
                  @update:model-value="onFieldUpdate(v.specKey, setting.key, $event)"
                />
              </UFormField>

              <UFormField v-else :label="labelFromKey(setting.key)">
                <UInput
                  :disabled="disabled || !v.entry.active"
                  :model-value="getDisplayValue(setting) as string"
                  :type="isSensitive(setting.key) ? 'password' : 'text'"
                  class="w-full"
                  @update:model-value="onFieldUpdate(v.specKey, setting.key, $event)"
                />
              </UFormField>
            </template>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
