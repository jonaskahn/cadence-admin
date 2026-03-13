<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type {
  FrameworkSupportedProvidersResponse,
  OrchestratorDefaults,
  OrchestratorResponse,
  PluginMetadataResponse,
  PluginSetting,
  PluginSettingsEntry
} from '~/types'
import { toPluginRefKey, toPluginUniquenessKey } from '~/utils'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const localePath = useLocalePath()
const auth = useAuth()
if (!auth.isAdmin.value) {
  await navigateTo(localePath('/orchestrators'))
}
const orchestrators = useOrchestrators()
const toast = useToast()
const orgId = computed(() => auth.currentOrgId.value || '')

const cloneId = computed(() => route.query.clone as string | undefined)

const cloneSource = ref<OrchestratorResponse | null>(null)

watch(
  [cloneId, orgId],
  async ([cid, oid]) => {
    if (!cid || !oid) {
      cloneSource.value = null
      return
    }
    try {
      cloneSource.value = await $fetch<OrchestratorResponse>(`/api/orgs/${oid}/orchestrators/${cid}`)
    } catch {
      cloneSource.value = null
    }
  },
  { immediate: true }
)

const { data: orgDefaults } = await useFetch<OrchestratorDefaults>(() => `/api/orgs/${orgId.value}/orchestrator-defaults`, { watch: [orgId] })

const { data: frameworks } = await useFetch<FrameworkSupportedProvidersResponse[]>('/api/frameworks')

const schema = computed(() =>
  z.object({
    name: z
      .string()
      .min(5, { message: t('orchestrators.create.nameMinLength') })
      .max(55),
    framework_type: z.string().min(1),
    mode: z.string().min(1),
    tier: z.enum(['hot', 'warm', 'cold'])
  })
)

type Schema = {
  name: string
  framework_type: string
  mode: string
  tier: 'hot' | 'warm' | 'cold'
}

const state = reactive<Partial<Schema>>({
  name: '',
  framework_type: 'langgraph',
  mode: 'supervisor',
  tier: 'cold'
})

const selectedPlugins = ref<PluginMetadataResponse[]>([])
const showPluginSelector = ref(false)
const loading = ref(false)
const createFormRef = ref()
const supervisorProviderRef = ref<{
  isValid: () => boolean
  getValue: () => Record<string, unknown>
} | null>(null)
const pluginSettingsRef = ref<{
  getValue: () => Record<string, PluginSettingsEntry>
  validate?: () => { valid: boolean; message?: string }
} | null>(null)

const currentFrameworkCaps = computed(() => frameworks.value?.find((fw) => fw.framework_type === state.framework_type))
const supportedProviders = computed(() => (currentFrameworkCaps.value?.supports_all ? null : (currentFrameworkCaps.value?.supported_providers ?? null)))
const supportedModes = computed(() => currentFrameworkCaps.value?.supported_modes ?? [])
const isSupervisor = computed(() => state.mode === 'supervisor' && supportedModes.value.includes('supervisor'))

const supervisorInitialValue = computed(
  () => (cloneSource.value?.config ?? (orgDefaults.value as unknown as Record<string, unknown>) ?? {}) as Record<string, unknown>
)

watch(currentFrameworkCaps, (caps) => {
  if (caps && state.mode && !caps.supported_modes.includes(state.mode)) {
    state.mode = caps.supported_modes[0] as Schema['mode'] | undefined
  }
})

const frameworkOptions = computed(() =>
  (frameworks.value ?? []).map((fw) => ({
    label: frameworkLabel(fw.framework_type),
    value: fw.framework_type
  }))
)

const modeOptions = computed(() => supportedModes.value.map((m) => ({ label: modeLabel(m), value: m })))

const tierOptions = computed(() => [
  { label: t('orchestrators.create.tierCold'), value: 'cold' },
  { label: t('orchestrators.create.tierWarm'), value: 'warm' },
  { label: t('orchestrators.create.tierHot'), value: 'hot' }
])

const alreadyAddedKeys = computed(() => selectedPlugins.value.map((p) => toPluginUniquenessKey((p.source as string) ?? 'org', p.pid, p.version)))

const pluginTableColumns = computed(() => [
  { accessorKey: 'name', header: t('orchestrators.create.pluginTableName') },
  { accessorKey: 'pid', header: t('orchestrators.create.pluginTablePid') },
  { accessorKey: 'version', header: t('orchestrators.create.pluginTableVersion') },
  { accessorKey: 'source', header: t('orchestrators.create.pluginTableSource') },
  { id: 'remove' }
])

const pluginTableData = computed(() =>
  selectedPlugins.value.map((p) => ({
    ...p,
    source: (p.source as string) === 'system' ? t('orchestrators.create.sourceSystem') : t('orchestrators.create.sourceOrg')
  }))
)

const pluginSettingsInitialValue = ref<Record<string, PluginSettingsEntry>>({})

function syncPluginSettingsInitialValue() {
  const current = pluginSettingsRef.value?.getValue() ?? {}
  const fromSelected = buildPluginSettingsFromSelected(selectedPlugins.value)
  const merged: Record<string, PluginSettingsEntry> = {}
  for (const key of Object.keys(fromSelected)) {
    const entry = current[key] ?? fromSelected[key]
    if (entry) merged[key] = entry
  }
  pluginSettingsInitialValue.value = merged
}

watch(selectedPlugins, () => syncPluginSettingsInitialValue(), { immediate: true, deep: true })

function frameworkLabel(fw: string): string {
  const labels: Record<string, string> = {
    langgraph: t('orchestrators.create.frameworkLangGraph'),
    google_adk: t('orchestrators.create.frameworkGoogleAdk'),
    openai_agents: t('orchestrators.create.frameworkOpenaiAgents')
  }
  return labels[fw] ?? fw
}

function modeLabel(mode: string): string {
  return mode.charAt(0).toUpperCase() + mode.slice(1).replace(/_/g, ' ')
}

function buildSettingsFromPlugin(plugin: PluginMetadataResponse): PluginSetting[] {
  const defaults = plugin.default_settings ?? {}
  const schema = plugin.settings_schema ?? []
  const keys = new Set([...Object.keys(defaults), ...schema.map((s) => s.key)])
  return Array.from(keys).map((key) => {
    const schemaItem = schema.find((s) => s.key === key)
    const value = defaults[key] ?? schemaItem?.default ?? null
    return { key, value }
  })
}

function buildPluginSettingsFromSelected(plugins: PluginMetadataResponse[]): Record<string, PluginSettingsEntry> {
  const result: Record<string, PluginSettingsEntry> = {}
  for (const p of plugins) {
    const source = (p.source as 'system' | 'org') ?? 'org'
    const refKey = toPluginRefKey(source, p.pid, p.version)
    result[refKey] = {
      id: p.pid,
      version: p.version,
      name: p.name,
      active: true,
      source,
      settings: buildSettingsFromPlugin(p),
      settings_schema: p.settings_schema ?? undefined
    }
  }
  return result
}

async function resolvePluginFromEntry(entry: PluginSettingsEntry, orgIdVal: string): Promise<PluginMetadataResponse | null> {
  const source = (entry.source ?? 'org') as 'system' | 'org'
  try {
    const versions = await $fetch<PluginMetadataResponse[]>(`/api/orgs/${orgIdVal}/plugins/${entry.id}/versions?source=${source}`)
    const match = versions.find((v) => v.version === entry.version)
    return match ?? null
  } catch {
    return null
  }
}

async function initFromClone(source: OrchestratorResponse | null) {
  if (!source || !orgId.value) return
  state.name = t('orchestrators.create.copyOf', { name: source.name })
  state.framework_type = (source.framework_type as Schema['framework_type']) ?? 'langgraph'
  state.mode = (source.mode as Schema['mode']) ?? 'supervisor'
  state.tier = (source.tier as Schema['tier']) ?? 'cold'
  const entries = (Object.values(source.plugin_settings ?? {}) as PluginSettingsEntry[]).filter((e) => e.active)
  const resolved: PluginMetadataResponse[] = []
  for (const e of entries) {
    const plugin = await resolvePluginFromEntry(e, orgId.value)
    if (plugin) {
      resolved.push({
        ...plugin,
        default_settings: e.settings.reduce((acc: Record<string, unknown>, s) => {
          acc[s.key] = s.value
          return acc
        }, {})
      })
    }
  }
  selectedPlugins.value = resolved
}

watch(
  [cloneSource, orgId],
  ([src]) => {
    if (src) initFromClone(src as OrchestratorResponse)
  },
  { immediate: true }
)

function onPluginAdded(plugin: PluginMetadataResponse) {
  const key = toPluginUniquenessKey((plugin.source as string) ?? 'org', plugin.pid, plugin.version)
  if (alreadyAddedKeys.value.includes(key)) return
  selectedPlugins.value = [...selectedPlugins.value, plugin]
}

function removePlugin(index: number) {
  selectedPlugins.value = selectedPlugins.value.filter((_, i) => i !== index)
}

async function createOrchestrator(data: Schema) {
  const activePluginIds = selectedPlugins.value.map((p) => p.id)
  const config = isSupervisor.value ? supervisorProviderRef.value?.getValue() : undefined
  return orchestrators.create({
    ...data,
    active_plugin_ids: activePluginIds,
    config
  })
}

async function saveInitialPluginSettings(instanceId: string) {
  const settings = pluginSettingsRef.value?.getValue()
  if (!settings || Object.keys(settings).length === 0) return
  await orchestrators.updatePluginSettings(instanceId, settings)
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (selectedPlugins.value.length === 0) {
    toast.add({ title: t('orchestrators.create.selectPluginRequired'), color: 'error' })
    return
  }
  if (isSupervisor.value && !supervisorProviderRef.value?.isValid()) {
    toast.add({ title: t('orchestrators.create.llmConfigRequired'), color: 'error' })
    return
  }
  const pluginValidation = pluginSettingsRef.value?.validate?.()
  if (pluginValidation && !pluginValidation.valid) {
    toast.add({ title: pluginValidation.message ?? t('orchestrators.create.pluginValidationFailed'), color: 'error' })
    return
  }

  loading.value = true
  try {
    const orchestrator = await createOrchestrator(event.data as Schema)
    await saveInitialPluginSettings(orchestrator.instance_id)
    await router.push(localePath(`/orchestrators/${orchestrator.instance_id}`))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-w-0 flex-1 flex flex-col overflow-hidden">
    <UDashboardPanel id="orchestrator-create" :ui="{ body: 'min-w-0 overflow-auto' }">
      <template #header>
        <UDashboardNavbar :title="t('orchestrators.create.title')">
          <template #leading>
            <UButton icon="i-lucide-arrow-left" :to="localePath('/orchestrators')" variant="outline" />
          </template>
          <template #right>
            <InfoPopover title-key="info.pages.orchestrators.title" description-key="info.pages.orchestrators.description" />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="p-6 min-w-0 w-full">
          <UForm ref="createFormRef" :schema="schema" :state="state" @submit="onSubmit">
            <div class="flex flex-col gap-8 w-full">
              <!-- Section 1: Basic -->
              <UCard class="min-w-0 w-full">
                <template #header>
                  <div class="flex items-center gap-2">
                    <p class="font-semibold">{{ t('orchestrators.create.basic') }}</p>
                    <InfoPopover title-key="info.orchestratorSections.createBasic.title" description-key="info.orchestratorSections.createBasic.description" />
                  </div>
                </template>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <UFormField :label="t('dashboard.name')" name="name" required>
                    <UInput v-model="state.name" class="w-full" :placeholder="t('orchestrators.create.namePlaceholder')" />
                  </UFormField>
                  <UFormField :label="t('dashboard.framework')" name="framework_type" required>
                    <USelect v-model="state.framework_type" :items="frameworkOptions" class="w-full" />
                  </UFormField>
                  <UFormField :label="t('dashboard.mode')" name="mode" required>
                    <USelect v-model="state.mode" :items="modeOptions" class="w-full" />
                  </UFormField>
                  <UFormField :label="t('orchestrators.create.initialTier')" name="tier">
                    <USelect v-model="state.tier" :items="tierOptions" class="w-full" />
                  </UFormField>
                </div>
              </UCard>

              <!-- Section 2: Plugins -->
              <div class="flex flex-col gap-4 min-w-0 w-full">
                <div class="flex items-center gap-3">
                  <USeparator :label="t('orchestrators.create.plugins')" class="flex-1" />
                  <InfoPopover title-key="info.orchestratorSections.createPlugins.title" description-key="info.orchestratorSections.createPlugins.description" />
                  <UButton icon="i-lucide-plus" :label="t('orchestrators.create.addPlugin')" size="sm" variant="outline" @click="showPluginSelector = true" />
                </div>
                <UTable :columns="pluginTableColumns" :data="pluginTableData" class="w-full min-w-0">
                  <template #remove-cell="{ row }">
                    <UButton color="error" icon="i-lucide-trash-2" size="xs" variant="outline" @click="removePlugin(row.index)" />
                  </template>
                </UTable>
                <div v-if="selectedPlugins.length > 0" class="w-full">
                  <OrchestratorPluginSettings ref="pluginSettingsRef" :initial-value="pluginSettingsInitialValue" :org-id="orgId" />
                </div>
                <p v-else class="text-dimmed text-sm py-4">{{ t('orchestrators.create.addPluginHint') }}</p>
              </div>

              <!-- Section 3 & 4: Supervisor Settings (when supervisor) -->
              <template v-if="isSupervisor && (cloneSource || orgDefaults !== null)">
                <USeparator :label="t('orchestrators.create.supervisorSettings')" />
                <LangGraphSupervisorProvider
                  ref="supervisorProviderRef"
                  :initial-value="supervisorInitialValue"
                  :org-id="orgId"
                  :supported-providers="supportedProviders"
                >
                  <UCard class="min-w-0 w-full">
                    <template #header>
                      <div class="flex items-center gap-2">
                        <p class="font-semibold">{{ t('orchestrators.create.llmConfig') }}</p>
                        <InfoPopover title-key="info.orchestratorSections.supervisorLlmConfig.title" description-key="info.orchestratorSections.supervisorLlmConfig.description" />
                      </div>
                    </template>
                    <LangGraphSupervisorLLMConfig />
                  </UCard>
                  <UCard class="min-w-0 w-full">
                    <template #header>
                      <div class="flex items-center gap-2">
                        <p class="font-semibold">{{ t('orchestrators.create.nodeConfig') }}</p>
                        <InfoPopover title-key="info.orchestratorSections.nodeConfig.title" description-key="info.orchestratorSections.nodeConfig.description" />
                      </div>
                    </template>
                    <LangGraphSupervisorNodeConfig />
                  </UCard>
                </LangGraphSupervisorProvider>
              </template>
            </div>

            <div class="flex justify-end gap-2 pt-6 mt-6 border-t border-default">
              <UButton color="neutral" :label="t('common.cancel')" :to="localePath('/orchestrators')" variant="outline" />
              <ConfirmActionPopover
                label-key="common.create"
                confirm-title-key="common.addConfirmTitle"
                confirm-message-key="common.addConfirmMessage"
                confirm-label-key="common.addConfirmFriendly"
                :loading="loading"
                :on-confirm="() => createFormRef?.$el?.requestSubmit?.()"
              />
            </div>
          </UForm>
        </div>
      </template>
    </UDashboardPanel>

    <OrchestratorPluginSelectorModal
      :open="showPluginSelector"
      :already-added="alreadyAddedKeys"
      :org-id="orgId"
      @plugin-added="onPluginAdded"
      @update:open="showPluginSelector = $event"
    />
  </div>
</template>
