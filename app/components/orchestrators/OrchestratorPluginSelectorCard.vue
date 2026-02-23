<script lang="ts" setup>
import type { PluginMetadataResponse, SystemPluginResponse } from '~/types'

const { t } = useI18n()

type PluginVersionItem = PluginMetadataResponse | SystemPluginResponse

const props = defineProps<{
  plugin: PluginMetadataResponse
  orgId: string
  alreadyAdded: string[]
}>()

const emit = defineEmits<{
  'plugin-added': [plugin: PluginMetadataResponse]
}>()

const source = computed(() => (props.plugin.source as 'system' | 'org') ?? 'org')

const { versions, loading, error, fetchVersions } = usePluginVersions(
  computed(() => props.plugin.pid),
  source,
  computed(() => props.orgId),
  computed(() => false)
)

const selectedVersion = ref<PluginVersionItem | null>(null)

const versionOptions = computed(() =>
  versions.value.map((v) => ({
    label: `v${v.version}`,
    value: v.version
  }))
)

const selectedVersionOption = computed({
  get: () => selectedVersion.value?.version ?? '',
  set: (val: string) => {
    const found = versions.value.find((v) => v.version === val)
    selectedVersion.value = found ?? null
  }
})

const displayPlugin = computed(() => {
  const v = selectedVersion.value
  if (!v) return props.plugin
  const base = { ...v }
  if (!('source' in base) || base.source === undefined) {
    return { ...base, source: props.plugin.source } as PluginMetadataResponse
  }
  return base as PluginMetadataResponse
})

function pluginKey(plugin: PluginVersionItem): string {
  const s = 'source' in plugin && plugin.source ? plugin.source : props.plugin.source
  return `${s}::${plugin.pid}::${plugin.version}`
}

const isAlreadyAdded = computed(() => {
  const v = selectedVersion.value
  if (!v) return true
  return props.alreadyAdded.includes(pluginKey(v))
})

function onAdd() {
  const v = selectedVersion.value
  if (!v || isAlreadyAdded.value) return
  const withSource = 'source' in v && v.source ? v : { ...v, source: props.plugin.source }
  emit('plugin-added', withSource as PluginMetadataResponse)
}

onMounted(() => {
  fetchVersions()
})

watch(
  versions,
  (v) => {
    if (v.length > 0 && !selectedVersion.value) {
      const latest = v.find((x) => (x as PluginMetadataResponse).is_latest === true)
      selectedVersion.value = latest ?? v[0] ?? null
    }
  },
  { immediate: true }
)
</script>

<template>
  <UCard class="flex flex-col h-full ring-0">
    <div class="flex flex-col gap-3">
      <PluginCard :plugin="displayPlugin" :source="source" @select="() => {}" />

      <div v-if="loading" class="flex justify-center py-2">
        <UIcon class="size-5 animate-spin text-dimmed" name="i-lucide-loader-2" />
      </div>

      <UAlert v-else-if="error" color="error" :description="error.message" size="sm" :title="t('orchestrators.pluginSelector.failedLoadVersions')" />

      <div v-else class="flex flex-wrap items-center gap-2">
        <USelect
          v-model="selectedVersionOption"
          :items="versionOptions"
          label-key="label"
          :placeholder="t('orchestrators.pluginSelector.version')"
          size="xs"
          value-key="value"
          class="w-24"
        />
        <UButton :disabled="isAlreadyAdded" icon="i-lucide-plus" size="xs" :title="t('orchestrators.pluginSelector.addPlugin')" @click="onAdd">
          {{ t('orchestrators.pluginSelector.add') }}
        </UButton>
      </div>
    </div>
  </UCard>
</template>
