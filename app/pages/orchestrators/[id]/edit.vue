<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { FrameworkSupportedProvidersResponse, OrchestratorResponse } from '~/types'
import type { MonitoringConfig } from '~/components/orchestrators/OrchestratorMonitoringConfig.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const localePath = useLocalePath()
const auth = useAuth()
const orchestrators = useOrchestrators()
const toast = useToast()
const { withOverlay } = useLoadingOverlay()
const orgId = computed(() => auth.currentOrgId.value || '')
const instanceId = route.params.id as string
if (!auth.isAdmin.value) {
  await navigateTo(localePath(`/orchestrators/${instanceId}`))
}

const {
  data: orchestrator,
  status,
  error
} = await useFetch<OrchestratorResponse>(() => `/api/orgs/${orgId.value}/orchestrators/${instanceId}`, { watch: [orgId] })

const schema = computed(() =>
  z.object({
    name: z
      .string()
      .min(10, { message: t('orchestrators.edit.nameMinLength') })
      .max(200, { message: t('orchestrators.edit.nameMaxLength') }),
    tier: z.enum(['hot', 'warm', 'cold']),
    whoami: z.string().max(2000).optional()
  })
)

type Schema = { name: string; tier: 'hot' | 'warm' | 'cold'; whoami?: string }

const name = ref('')
const tier = ref<'hot' | 'warm' | 'cold'>('cold')
const whoami = ref('')
const monitoringConfig = ref<MonitoringConfig>({
  enabled: false,
  provider: 'langfuse',
  langfuse: { secret_key: '', public_key: '', host: '' }
})
const loading = ref(false)
const orchestratorEditFormRef = ref<{ $el?: { requestSubmit?: () => void } } | null>(null)
const monitoringConfigRef = ref<{ validate?: () => { valid: boolean; message?: string } } | null>(null)
const supervisorProviderRef = ref<{
  isValid: () => boolean
  getValue: () => Record<string, unknown>
} | null>(null)

const tierOptions = computed(() => [
  { label: t('orchestrators.edit.tierCold'), value: 'cold' },
  { label: t('orchestrators.edit.tierWarm'), value: 'warm' },
  { label: t('orchestrators.edit.tierHot'), value: 'hot' }
])

const { data: frameworkCapabilities } = await useFetch<FrameworkSupportedProvidersResponse>(
  () => `/api/frameworks/${orchestrator.value?.framework_type ?? 'langgraph'}/supported-providers`,
  { watch: [() => orchestrator.value?.framework_type] }
)

const supportedProviders = computed(() => (frameworkCapabilities.value?.supports_all ? null : (frameworkCapabilities.value?.supported_providers ?? null)))
const supportedModes = computed(() => frameworkCapabilities.value?.supported_modes ?? [])
const isSupervisor = computed(() => orchestrator.value?.mode === 'supervisor' && supportedModes.value.includes('supervisor'))
const isGrounded = computed(() => orchestrator.value?.mode === 'grounded' && supportedModes.value.includes('grounded'))

const groundedConfigRef = ref<{ getValue: () => Record<string, unknown> } | null>(null)
const groundedConfig = ref<Record<string, unknown>>({
  scope_rules: '',
  max_tool_rounds: 5,
  enabled_validator: true
})

watch(
  orchestrator,
  (o) => {
    if (!o) return
    name.value = o.name
    tier.value = o.tier as 'hot' | 'warm' | 'cold'
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
    const modeConfig = (o.config as Record<string, unknown> | undefined)?.mode_config as Record<string, unknown> | undefined
    if (modeConfig) {
      groundedConfig.value = {
        scope_rules: modeConfig.scope_rules ?? '',
        max_tool_rounds: modeConfig.max_tool_rounds ?? 5,
        enabled_validator: modeConfig.enabled_validator ?? true
      }
    }
  },
  { immediate: true }
)

async function patchMetadata(payload: Pick<Schema, 'name' | 'tier'> & { whoami?: string }) {
  await orchestrators.updateMetadata(instanceId, payload)
}

async function patchConfig(config: Record<string, unknown>) {
  await orchestrators.updateConfig(instanceId, config)
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!supervisorProviderRef.value?.isValid()) {
    toast.add({ title: t('orchestrators.edit.llmConfigRequired'), color: 'error' })
    return
  }
  const monitoringValidation = monitoringConfigRef.value?.validate?.()
  if (monitoringValidation && !monitoringValidation.valid) {
    toast.add({ title: monitoringValidation.message ?? t('orchestrators.edit.langfuseFieldsRequired'), color: 'error' })
    return
  }

  loading.value = true
  try {
    await withOverlay(async () => {
      await patchMetadata({ name: event.data.name, tier: event.data.tier, whoami: whoami.value || undefined })
      const supervisorConfig = supervisorProviderRef.value?.getValue()
      await patchConfig({ ...(supervisorConfig ?? {}), monitoring: monitoringConfig.value })
      await router.push(localePath(`/orchestrators/${instanceId}`))
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-w-0 flex-1 flex flex-col overflow-hidden">
    <UDashboardPanel :id="`orchestrator-edit-${instanceId}`" :ui="{ body: 'min-w-0' }">
      <template #header>
        <UDashboardNavbar :title="orchestrator?.name ?? t('orchestrators.edit.title')">
          <template #leading>
            <UButton icon="i-lucide-arrow-left" :to="localePath(`/orchestrators/${instanceId}`)" variant="outline" />
          </template>
          <template #right>
            <InfoPopover title-key="info.pages.orchestrators.title" description-key="info.pages.orchestrators.description" />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div v-if="status === 'pending'" class="p-6 w-full">
          <div class="flex flex-col gap-4">
            <USkeleton class="h-10 w-full" />
            <USkeleton class="h-10 w-full" />
            <USkeleton class="h-32 w-full" />
          </div>
        </div>

        <UAlert v-else-if="error" color="error" :description="error.message" :title="t('orchestrators.edit.failedLoad')" class="m-6" />

        <div v-else-if="orchestrator" class="p-6 min-w-0 w-full">
          <UForm ref="orchestratorEditFormRef" :schema="schema" :state="{ name, tier, whoami }" @submit="onSubmit">
            <div class="flex flex-col gap-8 w-full">
              <!-- Provider wraps Basic + Additional Settings + LLM Config + Supervisor Config -->
              <LangGraphSupervisorProvider
                ref="supervisorProviderRef"
                :initial-value="orchestrator.config"
                :org-id="orgId"
                :supported-providers="supportedProviders"
                :mode="orchestrator.mode"
                :grounded-mode-config="groundedConfig"
              >
                <div class="flex flex-col gap-8 w-full">
                  <!-- 3-column grid: Basic, Additional Settings, LLM Config -->
                  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                    <!-- Section Basic -->
                    <UCard class="min-w-0 h-full">
                      <template #header>
                        <div class="flex items-center gap-2">
                          <p class="font-semibold">{{ t('orchestrators.edit.basic') }}</p>
                          <InfoPopover
                            title-key="info.orchestratorSections.editBasic.title"
                            description-key="info.orchestratorSections.editBasic.description"
                          />
                        </div>
                      </template>
                      <div class="flex flex-col gap-4">
                        <UFormField :label="t('dashboard.name')" name="name" required>
                          <UInput v-model="name" class="w-full" :placeholder="t('orchestrators.edit.namePlaceholder')" />
                        </UFormField>
                        <UFormField :label="t('orchestrators.create.whoami')" name="whoami">
                          <UTextarea v-model="whoami" class="w-full" :placeholder="t('orchestrators.create.whoamiPlaceholder')" :rows="3" />
                        </UFormField>
                        <UFormField :label="t('dashboard.tier')" name="tier">
                          <USelect v-model="tier" :items="tierOptions" class="w-full" />
                        </UFormField>
                        <UFormField :description="t('orchestrators.edit.immutableAfterCreation')">
                          <template #label>
                            <div class="flex items-center gap-1">
                              <span>{{ t('dashboard.framework') }}</span>
                              <UIcon name="i-lucide-lock" class="text-xs text-dimmed" />
                            </div>
                          </template>
                          <UInput :model-value="orchestrator.framework_type" class="w-full" disabled />
                        </UFormField>
                        <UFormField :description="t('orchestrators.edit.immutableAfterCreation')">
                          <template #label>
                            <div class="flex items-center gap-1">
                              <span>{{ t('dashboard.mode') }}</span>
                              <UIcon name="i-lucide-lock" class="text-xs text-dimmed" />
                            </div>
                          </template>
                          <UInput :model-value="orchestrator.mode" class="w-full" disabled />
                        </UFormField>
                      </div>
                    </UCard>

                    <UCard class="min-w-0 h-full">
                      <template #header>
                        <div class="flex items-center gap-2">
                          <UIcon name="i-lucide-cpu" />
                          <span class="font-semibold">{{ t('orchestrators.create.llmConfig') }}</span>
                          <InfoPopover
                            title-key="info.orchestratorSections.llmConfig.title"
                            description-key="info.orchestratorSections.llmConfig.description"
                          />
                        </div>
                      </template>
                      <LangGraphDefaultLLMConfig />
                    </UCard>

                    <UCard class="min-w-0 h-full">
                      <template #header>
                        <div class="flex items-center gap-2">
                          <UIcon name="i-lucide-sliders" />
                          <span class="font-semibold">{{ t('orchestrators.additionalSettings') }}</span>
                          <InfoPopover
                            title-key="info.orchestratorSections.additionalSettings.title"
                            description-key="info.orchestratorSections.additionalSettings.description"
                          />
                        </div>
                      </template>

                      <div class="flex flex-col gap-4">
                        <LLMContextSettings />
                        <OrchestratorMonitoringConfig ref="monitoringConfigRef" v-model="monitoringConfig" />
                      </div>
                    </UCard>
                  </div>

                  <!-- Supervisor Config card (supervisor only, full width) -->
                  <UCard v-if="isSupervisor" class="min-w-0 w-full">
                    <template #header>
                      <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-settings-2" />
                        <p class="font-semibold">{{ t('orchestrators.create.supervisorSettings') }}</p>
                        <InfoPopover
                          title-key="info.orchestratorSections.supervisorLlmConfig.title"
                          description-key="info.orchestratorSections.supervisorLlmConfig.description"
                        />
                      </div>
                    </template>

                    <div class="flex flex-col gap-4">
                      <LangGraphSupervisorLLMConfig />
                      <LangGraphSupervisorNodeConfig />
                    </div>
                  </UCard>

                  <!-- Grounded Mode Settings card (grounded only) -->
                  <UCard v-if="isGrounded" class="min-w-0 w-full">
                    <template #header>
                      <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-anchor" />
                        <p class="font-semibold">{{ t('orchestrators.grounded.settingsTitle') }}</p>
                      </div>
                    </template>
                    <GroundedModeSettings ref="groundedConfigRef" v-model="groundedConfig" />
                  </UCard>
                </div>
              </LangGraphSupervisorProvider>
            </div>

            <div class="flex justify-end gap-2 pt-6 mt-6 border-t border-default">
              <UButton color="neutral" :label="t('common.cancel')" :to="localePath(`/orchestrators/${instanceId}`)" variant="outline" />
              <ConfirmActionPopover
                label-key="common.save"
                confirm-title-key="common.saveConfirmTitle"
                confirm-message-key="common.saveConfirmMessage"
                confirm-label-key="common.saveConfirmFriendly"
                :loading="loading"
                :on-confirm="() => orchestratorEditFormRef?.$el?.requestSubmit?.()"
              />
            </div>
          </UForm>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
