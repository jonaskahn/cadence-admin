<script lang="ts" setup>
import type { PluginMetadataResponse } from '~/types'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  orgId: string
  alreadyAdded: string[]
  /** When true, only show plugins with is_scoped (for grounded mode) */
  filterScopedOnly?: boolean
  /** When true, exclude plugins with is_scoped (for supervisor mode) */
  filterNonScopedOnly?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'plugin-added': [plugin: PluginMetadataResponse]
}>()

const sourceFilter = ref<'all' | 'system' | 'org'>('all')
const searchQuery = ref('')

const plugins = ref<PluginMetadataResponse[]>([])
const pluginsStatus = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
const pluginsError = ref<Error | null>(null)

async function fetchPlugins() {
  if (!props.orgId) {
    pluginsStatus.value = 'error'
    pluginsError.value = new Error(t('aiApps.pluginSelector.selectOrgFirst'))
    plugins.value = []
    return
  }
  pluginsStatus.value = 'pending'
  pluginsError.value = null
  try {
    plugins.value = await $fetch<PluginMetadataResponse[]>(`/api/orgs/${props.orgId}/plugins`)
    pluginsStatus.value = 'success'
  } catch (e) {
    pluginsError.value = e instanceof Error ? e : new Error(String(e))
    pluginsStatus.value = 'error'
    plugins.value = []
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) fetchPlugins()
  }
)

const filteredPlugins = computed(() => {
  let list = plugins.value ?? []
  if (props.filterScopedOnly) {
    list = list.filter((p) => p.is_scoped === true)
  }
  if (props.filterNonScopedOnly) {
    list = list.filter((p) => p.is_scoped === false)
  }
  const bySource = sourceFilter.value === 'all' ? list : list.filter((p) => p.source === sourceFilter.value)
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return bySource
  return bySource.filter((p) => p.name.toLowerCase().includes(q) || p.pid.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q))
})

const sourceFilterItems = computed(() => [
  { label: t('plugins.all'), value: 'all' },
  { label: t('plugins.system'), value: 'system' },
  { label: t('plugins.org'), value: 'org' }
])

function onPluginAdded(plugin: PluginMetadataResponse) {
  emit('plugin-added', plugin)
}
</script>

<template>
  <USlideover
    :overlay="true"
    :open="open"
    :title="t('aiApps.pluginSelector.title')"
    side="top"
    close-icon="i-lucide-arrow-up"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="flex flex-col gap-4 h-full">
        <div class="flex flex-wrap gap-2">
          <USelect v-model="sourceFilter" :items="sourceFilterItems" label-key="label" value-key="value" class="w-32" />
          <UInput v-model="searchQuery" :placeholder="t('aiApps.pluginSelector.searchPlaceholder')" class="min-w-48" />
        </div>

        <div v-if="pluginsStatus === 'pending'" class="flex justify-center py-12">
          <UIcon class="size-8 animate-spin text-dimmed" name="i-lucide-loader-2" />
        </div>

        <UAlert v-else-if="pluginsError" color="error" :description="pluginsError.message" :title="t('aiApps.pluginSelector.failedLoad')" />

        <div v-else class="grid grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          <AiAppPluginSelectorCard
            v-for="plugin in filteredPlugins"
            :key="`${plugin.source}-${plugin.pid}`"
            :already-added="alreadyAdded"
            :org-id="orgId"
            :plugin="plugin"
            @plugin-added="onPluginAdded"
          />
        </div>

        <p v-if="pluginsStatus === 'success' && filteredPlugins.length === 0" class="py-8 text-center text-dimmed">
          {{ t('aiApps.pluginSelector.noPluginsMatch') }}
        </p>
      </div>
    </template>
  </USlideover>
</template>
