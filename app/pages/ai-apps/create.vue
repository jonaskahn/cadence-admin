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
import type { MonitoringConfig } from '~/components/ai-apps/AiAppMonitoringConfig.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const localePath = useLocalePath()
const auth = useAuth()
if (!auth.isAdmin.value) {
  await navigateTo(localePath('/ai-apps'))
}
const aiAppStore = useAiApps()
const toast = useToast()
const { withOverlay } = useLoadingOverlay()
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
      .min(5, { message: t('aiApps.create.nameMinLength') })
      .max(200),
    framework_type: z.string().min(1),
    mode: z.string().min(1),
    tier: z.enum(['hot', 'warm', 'cold']),
    whoami: z.string().max(2000).optional()
  })
)

type Schema = {
  name: string
  framework_type: string
  mode: string
  tier: 'hot' | 'warm' | 'cold'
  whoami?: string
}

const state = reactive<Partial<Schema>>({
  name: '',
  framework_type: 'langgraph',
  mode: 'supervisor',
  tier: 'cold',
  whoami: ''
})

const monitoringConfig = ref<MonitoringConfig>({
  enabled: false,
  provider: 'langfuse',
  langfuse: { secret_key: '', public_key: '', host: '' }
})

const selectedPlugins = ref<PluginMetadataResponse[]>([])
const showPluginSelector = ref(false)
const loading = ref(false)

function openPluginSelector() {
  showPluginSelector.value = true
}
const createFormRef = ref()
const monitoringConfigRef = ref<{ validate?: () => { valid: boolean; message?: string } } | null>(null)
const orchestratorConfigProviderRef = ref<{
  isValid: () => boolean
  getValue: () => Record<string, unknown>
} | null>(null)
const pluginSettingsRef = ref<{
  getValue: () => Record<string, PluginSettingsEntry>
  validate?: () => { valid: boolean; message?: string }
} | null>(null)
const groundedConfig = ref<Record<string, unknown>>({
  scope_rules: ''
})

const currentFrameworkCaps = computed(() => frameworks.value?.find((fw) => fw.framework_type === state.framework_type))
const supportedProviders = computed(() => (currentFrameworkCaps.value?.supports_all ? null : (currentFrameworkCaps.value?.supported_providers ?? null)))
const supportedModes = computed(() => currentFrameworkCaps.value?.supported_modes ?? [])
const isSupervisor = computed(() => state.mode === 'supervisor' && supportedModes.value.includes('supervisor'))
const isGrounded = computed(() => state.mode === 'grounded' && supportedModes.value.includes('grounded'))

const supervisorInitialValue = computed(
  () => (cloneSource.value?.config ?? (orgDefaults.value as unknown as Record<string, unknown>) ?? {}) as Record<string, unknown>
)

watch(currentFrameworkCaps, (caps) => {
  if (caps && state.mode && !caps.supported_modes.includes(state.mode)) {
    state.mode = caps.supported_modes[0] as Schema['mode'] | undefined
  }
})

watch(
  () => state.mode,
  (_newMode, oldMode) => {
    if (oldMode !== undefined) {
      selectedPlugins.value = []
    }
  }
)

const frameworkOptions = computed(() =>
  (frameworks.value ?? [])
    .filter((fw) => (fw.supported_modes?.length ?? 0) > 0)
    .map((fw) => ({
      label: frameworkLabel(fw.framework_type),
      value: fw.framework_type
    }))
)

watch(
  () => frameworkOptions.value,
  (opts) => {
    if (opts.length && !opts.some((o) => o.value === state.framework_type)) {
      state.framework_type = opts[0]!.value
    }
  },
  { immediate: true }
)

const modeOptions = computed(() => supportedModes.value.map((m) => ({ label: modeLabel(m), value: m })))

const tierOptions = computed(() => [
  { label: t('aiApps.create.tierCold'), value: 'cold' },
  { label: t('aiApps.create.tierWarm'), value: 'warm' },
  { label: t('aiApps.create.tierHot'), value: 'hot' }
])

const alreadyAddedKeys = computed(() => selectedPlugins.value.map((p) => toPluginUniquenessKey((p.source as string) ?? 'org', p.pid)))

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
    langgraph: t('aiApps.create.frameworkLangGraph'),
    google_adk: t('aiApps.create.frameworkGoogleAdk'),
    openai_agents: t('aiApps.create.frameworkOpenaiAgents')
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
      logo_image: p.logo_image ?? undefined,
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
  state.name = t('aiApps.create.copyOf', { name: source.name })
  state.framework_type = (source.framework_type as Schema['framework_type']) ?? 'langgraph'
  state.mode = (source.mode as Schema['mode']) ?? 'supervisor'
  state.tier = (source.tier as Schema['tier']) ?? 'cold'
  state.whoami = (source as { whoami?: string }).whoami ?? ''
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
  const mc = (source.config as Record<string, unknown> | undefined)?.mode_config as Record<string, unknown> | undefined
  if (mc && state.mode === 'grounded') {
    groundedConfig.value = { scope_rules: mc.scope_rules ?? '' }
  }
}

watch(
  [cloneSource, orgId],
  ([src]) => {
    if (src) initFromClone(src as OrchestratorResponse)
  },
  { immediate: true }
)

function onPluginAdded(plugin: PluginMetadataResponse) {
  const key = toPluginUniquenessKey((plugin.source as string) ?? 'org', plugin.pid)
  if (alreadyAddedKeys.value.includes(key)) return
  selectedPlugins.value = [...selectedPlugins.value, plugin]
}

function removePlugin(index: number) {
  selectedPlugins.value = selectedPlugins.value.filter((_, i) => i !== index)
}

async function createAiApp(data: Schema) {
  const activePluginIds = selectedPlugins.value.map((p) => p.id)
  const baseConfig = orchestratorConfigProviderRef.value?.getValue()
  const config = { ...(baseConfig ?? {}), monitoring: monitoringConfig.value }
  return aiAppStore.create({
    ...data,
    whoami: data.whoami || undefined,
    active_plugin_ids: activePluginIds,
    config
  })
}

async function saveInitialPluginSettings(instanceId: string) {
  const settings = pluginSettingsRef.value?.getValue()
  if (!settings || Object.keys(settings).length === 0) return
  await aiAppStore.updatePluginSettings(instanceId, settings)
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (selectedPlugins.value.length === 0) {
    toast.add({ title: t('aiApps.create.selectPluginRequired'), color: 'error' })
    return
  }
  if (isGrounded.value && selectedPlugins.value.length !== 1) {
    toast.add({ title: t('aiApps.grounded.singlePluginHint'), color: 'error' })
    return
  }
  if (!orchestratorConfigProviderRef.value?.isValid()) {
    toast.add({ title: t('aiApps.create.llmConfigRequired'), color: 'error' })
    return
  }
  const pluginValidation = pluginSettingsRef.value?.validate?.()
  if (pluginValidation && !pluginValidation.valid) {
    toast.add({ title: pluginValidation.message ?? t('aiApps.create.pluginValidationFailed'), color: 'error' })
    return
  }
  const monitoringValidation = monitoringConfigRef.value?.validate?.()
  if (monitoringValidation && !monitoringValidation.valid) {
    toast.add({ title: monitoringValidation.message ?? t('aiApps.edit.langfuseFieldsRequired'), color: 'error' })
    return
  }

  loading.value = true
  try {
    await withOverlay(async () => {
      const created = await createAiApp(event.data as Schema)
      await saveInitialPluginSettings(created.instance_id)
      await router.push(localePath(`/ai-apps/${created.instance_id}`))
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-w-0 flex-1 flex flex-col overflow-hidden">
    <UDashboardPanel id="ai-app-create" :ui="{ body: 'min-w-0 overflow-auto' }">
      <template #header>
        <UDashboardNavbar>
          <template #title>
            <span class="inline-flex items-center gap-2 flex-wrap">
              <span>{{ t('aiApps.create.title') }}</span>
              <UBadge color="neutral" size="xs" variant="subtle">{{ t('aiApps.legacyBadge') }}</UBadge>
            </span>
          </template>
          <template #leading>
            <UButton icon="i-lucide-arrow-left" :to="localePath('/ai-apps')" />
          </template>
          <template #right>
            <InfoPopover title-key="info.pages.aiApps.title" description-key="info.pages.aiApps.description" />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="p-6 min-w-0 w-full">
          <UForm ref="createFormRef" :schema="schema" :state="state" @submit="onSubmit">
            <div class="flex flex-col gap-8 w-full">
              <LangGraphAiAppConfigProvider
                ref="orchestratorConfigProviderRef"
                :initial-value="supervisorInitialValue"
                :org-id="orgId"
                :supported-providers="supportedProviders"
                :mode="state.mode"
                :grounded-mode-config="groundedConfig"
                :orchestrator-defaults="orgDefaults"
              >
                <div class="flex flex-col gap-8 w-full">
                  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                    <!-- Section Basic -->
                    <UCard variant="soft" class="min-w-0 h-full">
                      <template #header>
                        <div class="flex items-center gap-2">
                          <p class="font-semibold">{{ t('aiApps.create.basic') }}</p>
                          <InfoPopover title-key="info.aiAppSections.createBasic.title" description-key="info.aiAppSections.createBasic.description" />
                        </div>
                      </template>
                      <div class="flex flex-col gap-4">
                        <UFormField :label="t('dashboard.name')" name="name" required>
                          <UInput v-model="state.name" class="w-full" :placeholder="t('aiApps.create.namePlaceholder')" />
                        </UFormField>
                        <UFormField :label="t('aiApps.create.whoami')" name="whoami">
                          <UTextarea v-model="state.whoami" class="w-full" :placeholder="t('aiApps.create.whoamiPlaceholder')" :rows="3" />
                        </UFormField>
                        <UFormField :label="t('dashboard.framework')" name="framework_type" required>
                          <USelect v-model="state.framework_type" :items="frameworkOptions" class="w-full" />
                        </UFormField>
                        <UFormField :label="t('dashboard.mode')" name="mode" required>
                          <USelect v-model="state.mode" :items="modeOptions" class="w-full" />
                        </UFormField>
                        <UFormField :label="t('aiApps.create.initialTier')" name="tier">
                          <USelect v-model="state.tier" :items="tierOptions" class="w-full" />
                        </UFormField>
                      </div>
                    </UCard>

                    <UCard variant="soft" class="min-w-0 h-full">
                      <template #header>
                        <div class="flex items-center gap-2">
                          <UIcon name="i-lucide-cpu" />
                          <span class="font-semibold">{{ t('aiApps.create.llmConfig') }}</span>
                          <InfoPopover title-key="info.aiAppSections.llmConfig.title" description-key="info.aiAppSections.llmConfig.description" />
                        </div>
                      </template>
                      <LangGraphDefaultLLMConfig />
                    </UCard>

                    <UCard variant="soft" class="min-w-0 h-full">
                      <template #header>
                        <div class="flex items-center gap-2">
                          <UIcon name="i-lucide-sliders" />
                          <span class="font-semibold">{{ t('aiApps.additionalSettings') }}</span>
                          <InfoPopover
                            title-key="info.aiAppSections.additionalSettings.title"
                            description-key="info.aiAppSections.additionalSettings.description"
                          />
                        </div>
                      </template>

                      <div class="flex flex-col gap-4">
                        <LLMContextSettings />
                      </div>
                    </UCard>
                  </div>

                  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                    <AiAppCollapsibleFeatureCard v-model:enabled="monitoringConfig.enabled" :section-label="t('aiApps.featureCards.monitoring')">
                      <template #header>
                        <UIcon name="i-lucide-activity" />
                        <span class="font-semibold">{{ t('aiApps.featureCards.monitoring') }}</span>
                      </template>
                      <AiAppMonitoringConfig ref="monitoringConfigRef" v-model="monitoringConfig" hide-header-switch />
                    </AiAppCollapsibleFeatureCard>

                    <LangGraphAiAppFeatureCard
                      v-if="state.framework_type === 'langgraph'"
                      feature="suggestion"
                      :section-label="t('aiApps.featureCards.followUpSuggestions')"
                    >
                      <template #header>
                        <UIcon name="i-lucide-lightbulb" />
                        <span class="font-semibold">{{ t('aiApps.featureCards.followUpSuggestions') }}</span>
                      </template>
                    </LangGraphAiAppFeatureCard>

                    <LangGraphAiAppFeatureCard
                      v-if="state.framework_type === 'langgraph'"
                      feature="autocompact"
                      :section-label="t('aiApps.featureCards.autoCompactMessage')"
                    >
                      <template #header>
                        <UIcon name="i-lucide-minimize-2" />
                        <span class="font-semibold">{{ t('aiApps.featureCards.autoCompactMessage') }}</span>
                      </template>
                    </LangGraphAiAppFeatureCard>
                  </div>

                  <!-- Section Plugins -->
                  <UCard variant="soft" class="min-w-0 w-full">
                    <template #header>
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <UIcon name="i-lucide-plug" />
                          <span class="font-semibold">{{ t('aiApps.plugins') }}</span>
                          <InfoPopover title-key="info.aiAppSections.createPlugins.title" description-key="info.aiAppSections.createPlugins.description" />
                        </div>
                        <UButton
                          icon="i-lucide-plus"
                          :label="t('aiApps.create.addPlugin')"
                          color="primary"
                          :disabled="isGrounded && selectedPlugins.length >= 1"
                          @click="openPluginSelector"
                        />
                      </div>
                    </template>

                    <!-- Empty state -->
                    <div v-if="selectedPlugins.length === 0" class="flex flex-col items-center justify-center py-12 gap-3 text-center">
                      <UIcon name="i-lucide-plug-2" class="text-4xl text-dimmed" />
                      <div>
                        <p class="font-medium">{{ t('aiApps.create.pluginsEmpty') }}</p>
                        <p class="text-sm text-dimmed">{{ t('aiApps.create.pluginsEmptyDesc') }}</p>
                      </div>
                      <UButton :label="t('aiApps.create.addFirstPlugin')" @click="openPluginSelector" />
                    </div>

                    <!-- Plugin grid -->
                    <template v-else>
                      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <AiAppPluginCard
                          v-for="(plugin, index) in selectedPlugins"
                          :key="toPluginUniquenessKey(String(plugin.source ?? 'org'), plugin.pid)"
                          :plugin="{
                            id: plugin.id,
                            name: plugin.name,
                            pid: plugin.pid,
                            source: plugin.source ?? 'org',
                            logo: plugin.logo_image,
                            version: plugin.version
                          }"
                          :interactive="true"
                          @remove="removePlugin(index)"
                        />
                        <!-- Ghost card: browse more (hidden when grounded and one plugin) -->
                        <div
                          v-if="!isGrounded || selectedPlugins.length < 1"
                          class="flex flex-col items-center justify-center gap-2 min-h-[120px] border border-dashed border-default rounded-lg text-dimmed hover:text-default cursor-pointer transition-colors"
                          @click="openPluginSelector"
                        >
                          <UIcon name="i-lucide-plus-circle" class="text-2xl" />
                          <span class="text-sm">{{ t('aiApps.create.browsePlugins') }}</span>
                        </div>
                      </div>

                      <!-- Plugin settings accordion -->
                      <USeparator :label="t('aiApps.create.pluginSettings')" class="mt-6 mb-2" />
                      <AiAppPluginSettings ref="pluginSettingsRef" :initial-value="pluginSettingsInitialValue" :org-id="orgId" />
                    </template>
                  </UCard>

                  <LangGraphSupervisorSection v-if="isSupervisor && (cloneSource || orgDefaults !== null)" />

                  <LangGraphGroundedSection v-if="isGrounded" v-model="groundedConfig" />
                </div>
              </LangGraphAiAppConfigProvider>
            </div>

            <div class="flex justify-end gap-2 pt-6 mt-6 border-t border-default">
              <UButton color="neutral" :label="t('common.cancel')" :to="localePath('/ai-apps')" variant="ghost" />
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

    <AiAppPluginSelectorModal
      :open="showPluginSelector"
      :already-added="alreadyAddedKeys"
      :org-id="orgId"
      :filter-scoped-only="isGrounded"
      :filter-non-scoped-only="isSupervisor"
      @plugin-added="onPluginAdded"
      @update:open="showPluginSelector = $event"
    />
  </div>
</template>
