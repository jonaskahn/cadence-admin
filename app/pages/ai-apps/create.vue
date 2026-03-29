<script lang="ts" setup>
import type { FormSubmitEvent, StepperItem } from '@nuxt/ui'
import * as z from 'zod'

import type { MonitoringConfig } from '~/components/ai-apps/AiAppMonitoringConfig.vue'
import type {
  FrameworkSupportedProvidersResponse,
  OrchestratorDefaults,
  OrchestratorResponse,
  PluginMetadataResponse,
  PluginSetting,
  PluginSettingsEntry
} from '~/types'
import { normalizeOrchestratorPoolTier, toPluginRefKey, toPluginUniquenessKey } from '~/utils'

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

const { data: orgDefaults } = await useFetch<OrchestratorDefaults>(
  () => `/api/orgs/${orgId.value}/orchestrator-defaults`,
  { watch: [orgId] }
)

const { data: frameworks } = await useFetch<FrameworkSupportedProvidersResponse[]>('/api/frameworks')

const schema = computed(() =>
  z.object({
    name: z
      .string()
      .min(5, { message: t('aiApps.create.nameMinLength') })
      .max(200),
    framework_type: z.string().min(1),
    mode: z.string().min(1),
    tier: z.enum(['hot', 'demand']),
    whoami: z.string().max(2000).optional()
  })
)

const basicsSchema = computed(() =>
  schema.value.pick({
    name: true,
    framework_type: true,
    mode: true,
    tier: true,
    whoami: true
  })
)

const currentStep = ref(0)

const stepperItems = computed<StepperItem[]>(() => [
  { title: t('aiApps.create.steps.setup'), icon: 'i-lucide-settings-2' },
  { title: t('aiApps.create.steps.orchestratorMode'), icon: 'i-lucide-network' },
  { title: t('aiApps.create.steps.plugins'), icon: 'i-lucide-plug' },
  { title: t('aiApps.create.steps.features'), icon: 'i-lucide-sparkles' },
  { title: t('aiApps.create.steps.review'), icon: 'i-lucide-check-circle' }
])

type Schema = {
  name: string
  framework_type: string
  mode: string
  tier: 'hot' | 'demand'
  whoami?: string
}

const state = reactive<Partial<Schema>>({
  name: '',
  framework_type: 'langgraph',
  mode: 'supervisor',
  tier: 'demand',
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

type ConversationStarterRow = { language: string; questions: string[] }
const conversationStarters = ref<ConversationStarterRow[]>([])

function buildStartersPayload(entries: ConversationStarterRow[]): Record<string, string[]> {
  return Object.fromEntries(
    entries
      .filter((e) => e.questions.some((q) => q.trim()))
      .map((e) => [
        e.language,
        e.questions
          .map((q) => q.trim())
          .filter(Boolean)
          .slice(0, 5)
      ])
  )
}

const conversationStartersReviewCount = computed(
  () => conversationStarters.value.filter((s) => s.questions.some((q) => q.trim())).length
)

const currentFrameworkCaps = computed(() => frameworks.value?.find((fw) => fw.framework_type === state.framework_type))
const supportedProviders = computed(() =>
  currentFrameworkCaps.value?.supports_all ? null : (currentFrameworkCaps.value?.supported_providers ?? null)
)
const supportedModes = computed(() => currentFrameworkCaps.value?.supported_modes ?? [])
const isSupervisor = computed(() => state.mode === 'supervisor' && supportedModes.value.includes('supervisor'))
const isGrounded = computed(() => state.mode === 'grounded' && supportedModes.value.includes('grounded'))

const hasOrchestratorModeConfig = computed(
  () => (isSupervisor.value && (!!cloneSource.value || orgDefaults.value !== null)) || isGrounded.value
)

const supervisorInitialValue = computed(
  () =>
    (cloneSource.value?.config ?? (orgDefaults.value as unknown as Record<string, unknown>) ?? {}) as Record<
      string,
      unknown
    >
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
  { label: t('aiApps.create.tierDemand'), value: 'demand' },
  { label: t('aiApps.create.tierHot'), value: 'hot' }
])

const tierLabelForReview = computed(() => {
  const v = state.tier
  const opt = tierOptions.value.find((o) => o.value === v)
  return opt?.label ?? String(v ?? '')
})

const REVIEW_PLUGINS_MAX = 6

const reviewOrchestratorPayload = computed(() => orchestratorConfigProviderRef.value?.getValue() ?? null)

const reviewModeConfig = computed(() => {
  const mc = reviewOrchestratorPayload.value?.mode_config
  return (mc && typeof mc === 'object' ? mc : {}) as Record<string, unknown>
})

const reviewFollowUpEnabled = computed(() => Boolean(reviewModeConfig.value.enabled_suggestion))
const reviewAutoCompactEnabled = computed(() => Boolean(reviewModeConfig.value.enabled_auto_compact))

const reviewPluginsPreview = computed(() => {
  const list = selectedPlugins.value
  return {
    shown: list.slice(0, REVIEW_PLUGINS_MAX),
    rest: Math.max(0, list.length - REVIEW_PLUGINS_MAX)
  }
})

const groundedScopePreview = computed(() => {
  const raw = groundedConfig.value.scope_rules
  const s = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim()
  if (!s) return ''
  if (s.length <= 120) return s
  return `${s.slice(0, 120)}…`
})

function pluginSourceLabel(source: string | undefined): string {
  const s = (source ?? 'org') as 'system' | 'org'
  return s === 'system' ? t('aiApps.create.sourceSystem') : t('aiApps.create.sourceOrg')
}

const alreadyAddedKeys = computed(() =>
  selectedPlugins.value.map((p) => toPluginUniquenessKey((p.source as string) ?? 'org', p.pid))
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

async function resolvePluginFromEntry(
  entry: PluginSettingsEntry,
  orgIdVal: string
): Promise<PluginMetadataResponse | null> {
  const source = (entry.source ?? 'org') as 'system' | 'org'
  try {
    const versions = await $fetch<PluginMetadataResponse[]>(
      `/api/orgs/${orgIdVal}/plugins/${entry.id}/versions?source=${source}`
    )
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
  state.tier = normalizeOrchestratorPoolTier(source.tier ?? 'demand')
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
  const cs = (source.config as Record<string, unknown> | undefined)?.conversation_starters as
    | Record<string, string[]>
    | undefined
  if (cs && typeof cs === 'object') {
    conversationStarters.value = Object.entries(cs).map(([language, questions]) => ({
      language,
      questions: Array.isArray(questions) ? [...questions] : ['']
    }))
  } else {
    conversationStarters.value = []
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
  const startersPayload = buildStartersPayload(conversationStarters.value)
  const config = {
    ...(baseConfig ?? {}),
    monitoring: monitoringConfig.value,
    ...(Object.keys(startersPayload).length > 0 ? { conversation_starters: startersPayload } : {})
  }
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

function validateBasicsStep(): boolean {
  const parsed = basicsSchema.value.safeParse(state)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    toast.add({ title: first?.message ?? t('common.required'), color: 'error' })
    return false
  }
  return true
}

function validateConfigStep(): boolean {
  if (!orchestratorConfigProviderRef.value?.isValid()) {
    toast.add({ title: t('aiApps.create.llmConfigRequired'), color: 'error' })
    return false
  }
  return true
}

function validateSetupStep(): boolean {
  if (!validateBasicsStep()) return false
  return validateConfigStep()
}

function validatePluginsStep(): boolean {
  if (selectedPlugins.value.length === 0) {
    toast.add({ title: t('aiApps.create.selectPluginRequired'), color: 'error' })
    return false
  }
  if (isGrounded.value && selectedPlugins.value.length !== 1) {
    toast.add({ title: t('aiApps.grounded.singlePluginHint'), color: 'error' })
    return false
  }
  const pluginValidation = pluginSettingsRef.value?.validate?.()
  if (pluginValidation && !pluginValidation.valid) {
    toast.add({ title: pluginValidation.message ?? t('aiApps.create.pluginValidationFailed'), color: 'error' })
    return false
  }
  return true
}

function validateFeaturesStep(): boolean {
  const monitoringValidation = monitoringConfigRef.value?.validate?.()
  if (monitoringValidation && !monitoringValidation.valid) {
    toast.add({ title: monitoringValidation.message ?? t('aiApps.edit.langfuseFieldsRequired'), color: 'error' })
    return false
  }
  return true
}

function goNext() {
  if (currentStep.value === 0) {
    if (!validateSetupStep()) return
    if (!hasOrchestratorModeConfig.value) {
      currentStep.value = 2
      return
    }
  } else if (currentStep.value === 2) {
    if (!validatePluginsStep()) return
  } else if (currentStep.value === 3) {
    if (!validateFeaturesStep()) return
  }
  if (currentStep.value < 4) {
    currentStep.value += 1
  }
}

function goBack() {
  if (currentStep.value === 0) return
  if (currentStep.value === 2 && !hasOrchestratorModeConfig.value) {
    currentStep.value = 0
    return
  }
  currentStep.value -= 1
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (currentStep.value !== 4) {
    return
  }
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
  <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
    <UDashboardPanel id="ai-app-create" :ui="{ body: 'min-w-0 overflow-auto' }">
      <template #header>
        <UDashboardNavbar>
          <template #title>
            <span class="inline-flex flex-wrap items-center gap-2">
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
        <div class="flex w-full min-w-0 flex-col gap-6 p-6 pb-28">
          <UStepper v-model="currentStep" :items="stepperItems" class="w-full" color="primary" disabled linear />

          <UForm ref="createFormRef" :schema="schema" :state="state" @submit="onSubmit">
            <div class="flex w-full flex-col gap-8">
              <LangGraphAiAppConfigProvider
                ref="orchestratorConfigProviderRef"
                :initial-value="supervisorInitialValue"
                :org-id="orgId"
                :supported-providers="supportedProviders"
                :mode="state.mode"
                :grounded-mode-config="groundedConfig"
                :orchestrator-defaults="orgDefaults"
                require-default-llm
              >
                <!-- Step 1: Setup — one row, three columns on large screens -->
                <div
                  v-show="currentStep === 0"
                  class="grid w-full min-w-0 grid-cols-1 items-stretch gap-8 lg:grid-cols-3"
                >
                  <UCard variant="soft" class="flex h-full min-w-0 flex-col">
                    <template #header>
                      <div class="flex items-center gap-2">
                        <p class="font-semibold">{{ t('aiApps.create.basic') }}</p>
                        <InfoPopover
                          title-key="info.aiAppSections.createBasic.title"
                          description-key="info.aiAppSections.createBasic.description"
                        />
                      </div>
                    </template>
                    <div class="flex min-h-0 flex-1 flex-col gap-4">
                      <UFormField :label="t('dashboard.name')" name="name" required>
                        <UInput v-model="state.name" class="w-full" :placeholder="t('aiApps.create.namePlaceholder')" />
                      </UFormField>
                      <UFormField :label="t('aiApps.create.whoami')" name="whoami">
                        <UTextarea
                          v-model="state.whoami"
                          class="w-full"
                          :placeholder="t('aiApps.create.whoamiPlaceholder')"
                          :rows="3"
                        />
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

                  <UCard variant="soft" class="flex h-full min-w-0 flex-col">
                    <template #header>
                      <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-cpu" />
                        <span class="font-semibold">{{ t('aiApps.create.llmConfig') }}</span>
                        <InfoPopover
                          title-key="info.aiAppSections.llmConfig.title"
                          description-key="info.aiAppSections.llmConfig.description"
                        />
                      </div>
                    </template>
                    <div class="min-h-0 flex-1 overflow-auto">
                      <LangGraphDefaultLLMConfig />
                    </div>
                  </UCard>

                  <UCard variant="soft" class="flex h-full min-w-0 flex-col">
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
                    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-auto">
                      <LLMContextSettings />
                    </div>
                  </UCard>
                </div>

                <!-- Step 2: Orchestrator mode (supervisor / grounded) -->
                <div v-show="currentStep === 1" class="flex w-full flex-col gap-8">
                  <LangGraphSupervisorSection
                    v-if="isSupervisor && (cloneSource || orgDefaults !== null)"
                    hide-header
                  />

                  <LangGraphGroundedSection v-if="isGrounded" v-model="groundedConfig" hide-header />
                </div>

                <!-- Step 3: Plugins -->
                <div v-show="currentStep === 2" class="flex w-full flex-col gap-8">
                  <UCard variant="soft" class="w-full min-w-0">
                    <template #header>
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <UIcon name="i-lucide-plug" />
                          <span class="font-semibold">{{ t('aiApps.plugins') }}</span>
                          <InfoPopover
                            title-key="info.aiAppSections.createPlugins.title"
                            description-key="info.aiAppSections.createPlugins.description"
                          />
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

                    <div
                      v-if="selectedPlugins.length === 0"
                      class="flex flex-col items-center justify-center gap-3 py-12 text-center"
                    >
                      <UIcon name="i-lucide-plug-2" class="text-dimmed text-4xl" />
                      <div>
                        <p class="font-medium">{{ t('aiApps.create.pluginsEmpty') }}</p>
                        <p class="text-dimmed text-sm">{{ t('aiApps.create.pluginsEmptyDesc') }}</p>
                      </div>
                      <UButton :label="t('aiApps.create.addFirstPlugin')" @click="openPluginSelector" />
                    </div>

                    <template v-else>
                      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                        <div
                          v-if="!isGrounded || selectedPlugins.length < 1"
                          class="border-accented border-dottedtext-dimmed hover:text-default flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed transition-colors"
                          @click="openPluginSelector"
                        >
                          <UIcon name="i-lucide-plus-circle" class="text-2xl" />
                          <span class="text-sm">{{ t('aiApps.create.browsePlugins') }}</span>
                        </div>
                      </div>

                      <USeparator :label="t('aiApps.create.pluginSettings')" class="mt-6 mb-2" />
                      <AiAppPluginSettings
                        ref="pluginSettingsRef"
                        :initial-value="pluginSettingsInitialValue"
                        :org-id="orgId"
                      />
                    </template>
                  </UCard>
                </div>

                <!-- Step 4: Features -->
                <div v-show="currentStep === 3" class="flex w-full flex-col gap-8">
                  <div class="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
                    <AiAppCollapsibleFeatureCard
                      v-model:enabled="monitoringConfig.enabled"
                      :section-label="t('aiApps.featureCards.monitoring')"
                    >
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

                  <div class="mt-2 flex items-center gap-3">
                    <USeparator class="flex-1" />
                    <span class="text-dimmed shrink-0 text-xs tracking-wider uppercase">
                      {{ t('aiApps.conversationStarters.title') }}
                    </span>
                    <USeparator class="flex-1" />
                  </div>
                  <UCard variant="soft" class="w-full min-w-0">
                    <template #header>
                      <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-message-square-plus" />
                        <span class="font-semibold">{{ t('aiApps.conversationStarters.title') }}</span>
                      </div>
                    </template>
                    <ConversationStartersEditor v-model="conversationStarters" />
                  </UCard>
                </div>

                <!-- Step 5: Review -->
                <div v-show="currentStep === 4" class="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
                  <UCard variant="soft" class="min-w-0">
                    <template #header>
                      <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-settings-2" />
                        <span class="font-semibold">{{ t('aiApps.create.reviewSetupSection') }}</span>
                      </div>
                    </template>
                    <dl class="grid gap-4">
                      <div class="min-w-0">
                        <dt class="text-dimmed text-xs tracking-wide uppercase">{{ t('dashboard.name') }}</dt>
                        <dd class="mt-0.5 font-medium break-words">{{ state.name || t('common.empty') }}</dd>
                      </div>
                      <div class="min-w-0">
                        <dt class="text-dimmed text-xs tracking-wide uppercase">{{ t('dashboard.framework') }}</dt>
                        <dd class="mt-0.5 font-medium">{{ frameworkLabel(state.framework_type ?? '') }}</dd>
                      </div>
                      <div class="min-w-0">
                        <dt class="text-dimmed text-xs tracking-wide uppercase">{{ t('dashboard.mode') }}</dt>
                        <dd class="mt-0.5 font-medium">{{ modeLabel(state.mode ?? '') }}</dd>
                      </div>
                      <div class="min-w-0">
                        <dt class="text-dimmed text-xs tracking-wide uppercase">
                          {{ t('aiApps.create.initialTier') }}
                        </dt>
                        <dd class="mt-0.5 font-medium">{{ tierLabelForReview }}</dd>
                      </div>
                      <div class="min-w-0">
                        <dt class="text-dimmed text-xs tracking-wide uppercase">
                          {{ t('aiApps.create.reviewIdentity') }}
                        </dt>
                        <dd class="text-dimmed mt-0.5 font-medium break-words whitespace-pre-wrap">
                          {{ state.whoami?.trim() ? state.whoami : t('common.empty') }}
                        </dd>
                      </div>
                    </dl>
                  </UCard>

                  <UCard variant="soft" class="min-w-0">
                    <template #header>
                      <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-network" />
                        <span class="font-semibold">{{ t('aiApps.create.reviewOrchestratorSection') }}</span>
                      </div>
                    </template>
                    <div v-if="!hasOrchestratorModeConfig" class="text-dimmed text-sm">
                      {{ t('aiApps.create.reviewOrchestratorNA') }}
                    </div>
                    <dl v-else class="grid gap-4">
                      <div class="flex min-w-0 flex-wrap items-center gap-2">
                        <dt class="text-dimmed w-full text-xs tracking-wide uppercase">{{ t('dashboard.mode') }}</dt>
                        <dd class="mt-0.5">
                          <UBadge v-if="isSupervisor" color="primary" variant="subtle">
                            {{ modeLabel('supervisor') }}
                          </UBadge>
                          <UBadge v-else-if="isGrounded" color="primary" variant="subtle">
                            {{ modeLabel('grounded') }}
                          </UBadge>
                        </dd>
                      </div>
                      <div v-if="isGrounded" class="min-w-0">
                        <dt class="text-dimmed text-xs tracking-wide uppercase">
                          {{ t('aiApps.grounded.scopeRules') }}
                        </dt>
                        <dd
                          class="text-dimmed mt-0.5 text-sm font-medium break-words whitespace-pre-wrap"
                          :class="groundedScopePreview ? '' : 'italic'"
                        >
                          {{ groundedScopePreview || t('common.empty') }}
                        </dd>
                      </div>
                    </dl>
                  </UCard>

                  <UCard variant="soft" class="min-w-0">
                    <template #header>
                      <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-plug" />
                        <span class="font-semibold">{{ t('aiApps.create.reviewPluginsSection') }}</span>
                        <UBadge color="neutral" size="xs" variant="subtle">
                          {{ selectedPlugins.length }}
                        </UBadge>
                      </div>
                    </template>
                    <div v-if="selectedPlugins.length === 0" class="text-dimmed text-sm">
                      {{ t('common.empty') }}
                    </div>
                    <ul v-else class="flex flex-col gap-3">
                      <li
                        v-for="p in reviewPluginsPreview.shown"
                        :key="toPluginUniquenessKey(String(p.source ?? 'org'), p.pid)"
                        class="flex min-w-0 flex-wrap items-center gap-2"
                      >
                        <span class="truncate font-medium">{{ p.name }}</span>
                        <UBadge color="neutral" size="xs" variant="outline">{{ p.version }}</UBadge>
                        <UBadge color="neutral" size="xs" variant="subtle">
                          {{ t('aiApps.create.reviewPluginSource', { source: pluginSourceLabel(p.source) }) }}
                        </UBadge>
                      </li>
                      <li v-if="reviewPluginsPreview.rest > 0" class="text-dimmed text-sm">
                        {{ t('aiApps.create.reviewPluginsMore', { count: reviewPluginsPreview.rest }) }}
                      </li>
                    </ul>
                  </UCard>

                  <UCard variant="soft" class="min-w-0">
                    <template #header>
                      <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-sparkles" />
                        <span class="font-semibold">{{ t('aiApps.create.reviewFeaturesSection') }}</span>
                      </div>
                    </template>
                    <dl class="grid gap-4">
                      <div class="min-w-0">
                        <dt class="text-dimmed text-xs tracking-wide uppercase">
                          {{ t('aiApps.featureCards.monitoring') }}
                        </dt>
                        <dd class="mt-0.5 flex flex-wrap items-center gap-2 font-medium">
                          <UBadge :color="monitoringConfig.enabled ? 'success' : 'neutral'" size="xs" variant="subtle">
                            {{
                              monitoringConfig.enabled
                                ? t('aiApps.create.reviewMonitoringOn')
                                : t('aiApps.create.reviewMonitoringOff')
                            }}
                          </UBadge>
                          <span v-if="monitoringConfig.enabled" class="text-dimmed text-sm">
                            {{ monitoringConfig.provider }}
                          </span>
                        </dd>
                      </div>
                      <template v-if="state.framework_type === 'langgraph'">
                        <div class="min-w-0">
                          <dt class="text-dimmed text-xs tracking-wide uppercase">
                            {{ t('aiApps.featureCards.followUpSuggestions') }}
                          </dt>
                          <dd class="mt-0.5">
                            <UBadge :color="reviewFollowUpEnabled ? 'success' : 'neutral'" size="xs" variant="subtle">
                              {{ reviewFollowUpEnabled ? t('common.enabled') : t('common.disabled') }}
                            </UBadge>
                          </dd>
                        </div>
                        <div class="min-w-0">
                          <dt class="text-dimmed text-xs tracking-wide uppercase">
                            {{ t('aiApps.featureCards.autoCompactMessage') }}
                          </dt>
                          <dd class="mt-0.5">
                            <UBadge
                              :color="reviewAutoCompactEnabled ? 'success' : 'neutral'"
                              size="xs"
                              variant="subtle"
                            >
                              {{ reviewAutoCompactEnabled ? t('common.enabled') : t('common.disabled') }}
                            </UBadge>
                          </dd>
                        </div>
                      </template>
                      <div v-else class="text-dimmed min-w-0 text-sm">
                        {{ t('aiApps.create.reviewFeaturesAdditional', { count: 2 }) }}
                      </div>
                      <div class="min-w-0">
                        <dt class="text-dimmed text-xs tracking-wide uppercase">
                          {{ t('aiApps.conversationStarters.title') }}
                        </dt>
                        <dd class="mt-0.5">
                          <UBadge v-if="conversationStartersReviewCount > 0" color="success" size="xs" variant="subtle">
                            {{
                              t('aiApps.conversationStarters.reviewSummary', {
                                count: conversationStartersReviewCount
                              })
                            }}
                          </UBadge>
                          <span v-else class="text-dimmed text-sm">{{ t('common.empty') }}</span>
                        </dd>
                      </div>
                    </dl>
                  </UCard>
                </div>
              </LangGraphAiAppConfigProvider>
            </div>

            <div class="pointer-events-none sticky bottom-0 z-10 -mx-6 mt-4 flex justify-end px-6 pt-4 pb-6">
              <div
                class="border-accented bg-default/95 supports-backdrop-filter:bg-default/80 pointer-events-auto inline-flex max-w-[min(100%,42rem)] flex-wrap items-center justify-end gap-2 rounded-4xl border border-dotted px-4 py-3 shadow-lg backdrop-blur"
              >
                <UButton color="neutral" :label="t('common.cancel')" :to="localePath('/ai-apps')" variant="ghost" />
                <UButton
                  v-if="currentStep > 0"
                  color="neutral"
                  leading-icon="i-lucide-arrow-left"
                  :label="t('aiApps.create.back')"
                  type="button"
                  @click="goBack"
                />
                <UButton
                  v-if="currentStep < 4"
                  trailing-icon="i-lucide-arrow-right"
                  color="primary"
                  :label="t('aiApps.create.next')"
                  type="button"
                  @click="goNext"
                />
                <ConfirmActionPopover
                  v-if="currentStep === 4"
                  label-key="common.create"
                  confirm-title-key="common.addConfirmTitle"
                  confirm-message-key="common.addConfirmMessage"
                  confirm-label-key="common.addConfirmFriendly"
                  :loading="loading"
                  size="lg"
                  :on-confirm="() => createFormRef?.$el?.requestSubmit?.()"
                />
              </div>
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
