<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

import type { MonitoringConfig } from '~/components/ai-apps/AiAppMonitoringConfig.vue'
import type { FrameworkSupportedProvidersResponse, OrchestratorDefaults, OrchestratorResponse } from '~/types'
import { normalizeOrchestratorPoolTier } from '~/utils'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const localePath = useLocalePath()
const auth = useAuth()
const aiAppStore = useAiApps()
const toast = useToast()
const { withOverlay } = useLoadingOverlay()
const orgId = computed(() => auth.currentOrgId.value || '')
const instanceId = route.params.id as string
if (!auth.isAdmin.value) {
  await navigateTo(localePath(`/ai-apps/${instanceId}`))
}

const {
  data: aiApp,
  status,
  error
} = await useFetch<OrchestratorResponse>(() => `/api/orgs/${orgId.value}/orchestrators/${instanceId}`, {
  watch: [orgId]
})

const schema = computed(() =>
  z.object({
    name: z
      .string()
      .min(10, { message: t('aiApps.edit.nameMinLength') })
      .max(200, { message: t('aiApps.edit.nameMaxLength') }),
    tier: z.enum(['hot', 'cold']),
    whoami: z.string().max(2000).optional()
  })
)

type Schema = { name: string; tier: 'hot' | 'cold'; whoami?: string }

const name = ref('')
const tier = ref<'hot' | 'cold'>('cold')
const whoami = ref('')
const monitoringConfig = ref<MonitoringConfig>({
  enabled: false,
  provider: 'langfuse',
  langfuse: { secret_key: '', public_key: '', host: '' }
})

const loading = ref(false)
const orchestratorEditFormRef = ref<{ $el?: { requestSubmit?: () => void } } | null>(null)
const monitoringConfigRef = ref<{ validate?: () => { valid: boolean; message?: string } } | null>(null)
const orchestratorConfigProviderRef = ref<{
  isValid: () => boolean
  getValue: () => Record<string, unknown>
} | null>(null)

const tierOptions = computed(() => [
  { label: t('aiApps.edit.tierCold'), value: 'cold' },
  { label: t('aiApps.edit.tierHot'), value: 'hot' }
])

const { data: frameworkCapabilities } = await useFetch<FrameworkSupportedProvidersResponse>(
  () => `/api/frameworks/${aiApp.value?.framework_type ?? 'langgraph'}/supported-providers`,
  { watch: [() => aiApp.value?.framework_type] }
)

const { data: orchestratorDefaults } = await useFetch<OrchestratorDefaults>(
  () => `/api/orgs/${orgId.value}/orchestrator-defaults`,
  {
    watch: [orgId]
  }
)

const supportedProviders = computed(() =>
  frameworkCapabilities.value?.supports_all ? null : (frameworkCapabilities.value?.supported_providers ?? null)
)
const supportedModes = computed(() => frameworkCapabilities.value?.supported_modes ?? [])
const isSupervisor = computed(() => aiApp.value?.mode === 'supervisor' && supportedModes.value.includes('supervisor'))
const isGrounded = computed(() => aiApp.value?.mode === 'grounded' && supportedModes.value.includes('grounded'))

const groundedConfig = ref<Record<string, unknown>>({
  scope_rules: ''
})

const startersModel = ref<{ language: string; questions: string[] }[]>([])

watch(
  aiApp,
  (o) => {
    if (!o) return
    name.value = o.name
    tier.value = normalizeOrchestratorPoolTier(o.tier)
    whoami.value = o.whoami ?? ''
    const existing = (o.config as Record<string, unknown> | undefined)?.monitoring as MonitoringConfig | undefined
    if (existing) {
      monitoringConfig.value = {
        enabled: existing.enabled ?? false,
        provider: existing.provider ?? 'langfuse',
        langfuse: {
          secret_key: existing.langfuse?.secret_key ?? '',
          public_key: existing.langfuse?.public_key ?? '',
          host: existing.langfuse?.host ?? ''
        }
      }
    }
    const modeConfig = (o.config as Record<string, unknown> | undefined)?.mode_config as
      | Record<string, unknown>
      | undefined
    if (modeConfig) {
      groundedConfig.value = {
        scope_rules: modeConfig.scope_rules ?? ''
      }
    }
    const cs = (o.config as Record<string, unknown> | undefined)?.conversation_starters as
      | Record<string, string[]>
      | undefined
    if (cs && typeof cs === 'object' && Object.keys(cs).length > 0) {
      startersModel.value = Object.entries(cs).map(([language, questions]) => ({
        language,
        questions: Array.isArray(questions) && questions.length > 0 ? [...questions] : ['']
      }))
    } else {
      startersModel.value = []
    }
  },
  { immediate: true }
)

async function patchMetadata(payload: Pick<Schema, 'name' | 'tier'> & { whoami?: string }) {
  await aiAppStore.updateMetadata(instanceId, payload)
}

async function patchConfig(config: Record<string, unknown>) {
  await aiAppStore.updateConfig(instanceId, config)
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!orchestratorConfigProviderRef.value?.isValid()) {
    toast.add({ title: t('aiApps.edit.llmConfigRequired'), color: 'error' })
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
      await patchMetadata({ name: event.data.name, tier: event.data.tier, whoami: whoami.value || undefined })
      const orchestratorFormConfig = orchestratorConfigProviderRef.value?.getValue()
      const startersPayload = Object.fromEntries(
        startersModel.value
          .filter((e) => e.questions.some((q) => q.trim()))
          .map((e) => [
            e.language,
            e.questions
              .map((q) => q.trim())
              .filter(Boolean)
              .slice(0, 5)
          ])
      )
      await patchConfig({
        ...(orchestratorFormConfig ?? {}),
        monitoring: monitoringConfig.value,
        conversation_starters: startersPayload
      })
      await router.push(localePath(`/ai-apps/${instanceId}`))
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
    <UDashboardPanel :id="`ai-app-edit-${instanceId}`" :ui="{ body: 'min-w-0' }">
      <template #header>
        <UDashboardNavbar>
          <template #title>
            <span class="inline-flex min-w-0 flex-wrap items-center gap-2">
              <span class="truncate">{{ aiApp?.name ?? t('aiApps.edit.title') }}</span>
              <UBadge color="neutral" class="shrink-0" size="xs" variant="subtle">{{ t('aiApps.legacyBadge') }}</UBadge>
            </span>
          </template>
          <template #leading>
            <UButton icon="i-lucide-arrow-left" :to="localePath(`/ai-apps/${instanceId}`)" />
          </template>
          <template #right>
            <InfoPopover title-key="info.pages.aiApps.title" description-key="info.pages.aiApps.description" />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div v-if="status === 'pending'" class="w-full p-6">
          <div class="flex flex-col gap-4">
            <USkeleton class="h-10 w-full" />
            <USkeleton class="h-10 w-full" />
            <USkeleton class="h-32 w-full" />
          </div>
        </div>

        <UAlert
          v-else-if="error"
          color="error"
          :description="error.message"
          :title="t('aiApps.edit.failedLoad')"
          class="m-6"
        />

        <div v-else-if="aiApp" class="w-full min-w-0 p-6 pb-28">
          <UForm ref="orchestratorEditFormRef" :schema="schema" :state="{ name, tier, whoami }" @submit="onSubmit">
            <div class="flex w-full flex-col gap-8">
              <!-- Provider wraps Basic + Additional Settings + LLM Config + Supervisor Config -->
              <LangGraphAiAppConfigProvider
                ref="orchestratorConfigProviderRef"
                :initial-value="aiApp.config"
                :org-id="orgId"
                :supported-providers="supportedProviders"
                :mode="aiApp.mode"
                :grounded-mode-config="groundedConfig"
                :orchestrator-defaults="orchestratorDefaults"
                require-default-llm
              >
                <div class="flex w-full flex-col gap-8">
                  <div class="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
                    <!-- Section Basic -->
                    <UCard variant="soft" class="h-full min-w-0">
                      <template #header>
                        <div class="flex items-center gap-2">
                          <p class="font-semibold">{{ t('aiApps.edit.basic') }}</p>
                          <InfoPopover
                            title-key="info.aiAppSections.editBasic.title"
                            description-key="info.aiAppSections.editBasic.description"
                          />
                        </div>
                      </template>
                      <div class="flex flex-col gap-4">
                        <UFormField :label="t('dashboard.name')" name="name" required>
                          <UInput v-model="name" class="w-full" :placeholder="t('aiApps.edit.namePlaceholder')" />
                        </UFormField>
                        <UFormField :label="t('aiApps.create.whoami')" name="whoami">
                          <UTextarea
                            v-model="whoami"
                            class="w-full"
                            :placeholder="t('aiApps.create.whoamiPlaceholder')"
                            :rows="3"
                          />
                        </UFormField>
                        <UFormField :label="t('dashboard.tier')" name="tier">
                          <USelect v-model="tier" :items="tierOptions" class="w-full" />
                        </UFormField>
                        <UFormField :description="t('aiApps.edit.immutableAfterCreation')">
                          <template #label>
                            <div class="flex items-center gap-1">
                              <span>{{ t('dashboard.framework') }}</span>
                              <UIcon name="i-lucide-lock" class="text-dimmed text-xs" />
                            </div>
                          </template>
                          <UInput :model-value="aiApp.framework_type" class="w-full" disabled />
                        </UFormField>
                        <UFormField :description="t('aiApps.edit.immutableAfterCreation')">
                          <template #label>
                            <div class="flex items-center gap-1">
                              <span>{{ t('dashboard.mode') }}</span>
                              <UIcon name="i-lucide-lock" class="text-dimmed text-xs" />
                            </div>
                          </template>
                          <UInput :model-value="aiApp.mode" class="w-full" disabled />
                        </UFormField>
                      </div>
                    </UCard>

                    <UCard variant="soft" class="h-full min-w-0">
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
                      <LangGraphDefaultLLMConfig />
                    </UCard>

                    <UCard variant="soft" class="h-full min-w-0">
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

                  <div class="my-2 flex items-center gap-3">
                    <USeparator class="flex-1" />
                    <span class="text-dimmed shrink-0 text-xs tracking-wider uppercase">
                      {{ t('aiApps.create.reviewFeaturesSection') }}
                    </span>
                    <USeparator class="flex-1" />
                  </div>

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
                      v-if="aiApp.framework_type === 'langgraph'"
                      feature="suggestion"
                      :section-label="t('aiApps.featureCards.followUpSuggestions')"
                    >
                      <template #header>
                        <UIcon name="i-lucide-lightbulb" />
                        <span class="font-semibold">{{ t('aiApps.featureCards.followUpSuggestions') }}</span>
                      </template>
                    </LangGraphAiAppFeatureCard>

                    <LangGraphAiAppFeatureCard
                      v-if="aiApp.framework_type === 'langgraph'"
                      feature="autocompact"
                      :section-label="t('aiApps.featureCards.autoCompactMessage')"
                    >
                      <template #header>
                        <UIcon name="i-lucide-minimize-2" />
                        <span class="font-semibold">{{ t('aiApps.featureCards.autoCompactMessage') }}</span>
                      </template>
                    </LangGraphAiAppFeatureCard>
                  </div>

                  <div class="my-2 flex items-center gap-3">
                    <USeparator class="flex-1" />
                    <span class="text-dimmed shrink-0 text-xs tracking-wider uppercase">
                      {{ t('aiApps.create.reviewOrchestratorSection') }}
                    </span>
                    <USeparator class="flex-1" />
                  </div>

                  <LangGraphSupervisorSection v-if="isSupervisor" hide-header />

                  <LangGraphGroundedSection v-if="isGrounded" v-model="groundedConfig" hide-header />

                  <div class="my-2 flex items-center gap-3">
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
                    <ConversationStartersEditor v-model="startersModel" />
                  </UCard>
                </div>
              </LangGraphAiAppConfigProvider>
            </div>

            <div class="pointer-events-none sticky bottom-0 z-10 -mx-6 mt-4 flex justify-end px-6 pt-4 pb-6">
              <div
                class="border-accented border-dottedbg-default/95 supports-backdrop-filter:bg-default/80 pointer-events-auto inline-flex max-w-[min(100%,42rem)] flex-wrap items-center justify-end gap-2 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur"
              >
                <UButton
                  color="neutral"
                  :label="t('common.cancel')"
                  :to="localePath(`/ai-apps/${instanceId}`)"
                  variant="ghost"
                />
                <ConfirmActionPopover
                  label-key="common.save"
                  confirm-title-key="common.saveConfirmTitle"
                  confirm-message-key="common.saveConfirmMessage"
                  confirm-label-key="common.saveConfirmFriendly"
                  :loading="loading"
                  size="lg"
                  :on-confirm="() => orchestratorEditFormRef?.$el?.requestSubmit?.()"
                />
              </div>
            </div>
          </UForm>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
