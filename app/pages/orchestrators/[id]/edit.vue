<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { FrameworkSupportedProvidersResponse, LLMConfigResponse, OrchestratorResponse } from '~/types'
import { providerLabel } from '~/utils'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const localePath = useLocalePath()
const auth = useAuth()
const orchestrators = useOrchestrators()
const toast = useToast()
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
    tier: z.enum(['hot', 'warm', 'cold'])
  })
)

type Schema = { name: string; tier: 'hot' | 'warm' | 'cold' }

const name = ref('')
const tier = ref<'hot' | 'warm' | 'cold'>('cold')
const loading = ref(false)
const orchestratorEditFormRef = ref<{ $el?: { requestSubmit?: () => void } } | null>(null)
const supervisorProviderRef = ref<{
  isValid: () => boolean
  getValue: () => Record<string, unknown>
} | null>(null)

const tierOptions = computed(() => [
  { label: t('orchestrators.edit.tierCold'), value: 'cold' },
  { label: t('orchestrators.edit.tierWarm'), value: 'warm' },
  { label: t('orchestrators.edit.tierHot'), value: 'hot' }
])

const { data: llmConfigs } = useFetch<LLMConfigResponse[]>(() => `/api/orgs/${orgId.value}/llm-configs`, { watch: [orgId] })

const defaultLlmConfigId = ref<string | undefined>(undefined)

const { data: frameworkCapabilities } = await useFetch<FrameworkSupportedProvidersResponse>(
  () => `/api/frameworks/${orchestrator.value?.framework_type ?? 'langgraph'}/supported-providers`,
  { watch: [() => orchestrator.value?.framework_type] }
)

const supportedProviders = computed(() => (frameworkCapabilities.value?.supports_all ? null : (frameworkCapabilities.value?.supported_providers ?? null)))
const supportedModes = computed(() => frameworkCapabilities.value?.supported_modes ?? [])
const isSupervisor = computed(() => orchestrator.value?.mode === 'supervisor' && supportedModes.value.includes('supervisor'))

const llmConfigOptions = computed(() => {
  const configs = llmConfigs.value ?? []
  const currentId = orchestrator.value?.config?.default_llm_config_id
  return configs
    .filter((c) => !c.is_deleted && (c.is_enabled !== false || c.id === currentId))
    .map((c) => ({
      label: c.is_enabled === false ? `${c.name} (${providerLabel(c.provider)}) — ${t('common.disabled')}` : `${c.name} (${providerLabel(c.provider)})`,
      value: c.id
    }))
})

watch(
  orchestrator,
  (o) => {
    if (!o) return
    name.value = o.name
    tier.value = o.tier as 'hot' | 'warm' | 'cold'
    defaultLlmConfigId.value = o.config?.default_llm_config_id != null ? String(o.config.default_llm_config_id) : undefined
  },
  { immediate: true }
)

async function patchMetadata(payload: Pick<Schema, 'name' | 'tier'>) {
  await orchestrators.updateMetadata(instanceId, payload)
}

async function patchConfig(config: Record<string, unknown>) {
  await orchestrators.updateConfig(instanceId, config)
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (isSupervisor.value && !supervisorProviderRef.value?.isValid()) {
    toast.add({ title: t('orchestrators.edit.llmConfigRequired'), color: 'error' })
    return
  }

  loading.value = true
  try {
    await patchMetadata({ name: event.data.name, tier: event.data.tier })

    if (isSupervisor.value && supervisorProviderRef.value) {
      await patchConfig(supervisorProviderRef.value.getValue())
    } else if (!isSupervisor.value && defaultLlmConfigId.value !== undefined) {
      await orchestrators.updateMetadata(instanceId, {
        default_llm_config_id: defaultLlmConfigId.value || null
      })
    }

    await router.push(localePath(`/orchestrators/${instanceId}`))
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
        <UForm ref="orchestratorEditFormRef" :schema="schema" :state="{ name, tier }" @submit="onSubmit">
          <div class="flex flex-col gap-8 w-full">
            <UCard class="min-w-0 w-full">
              <template #header>
                <div class="flex items-center gap-2">
                  <p class="font-semibold">{{ t('orchestrators.edit.basic') }}</p>
                  <InfoPopover title-key="info.orchestratorSections.editBasic.title" description-key="info.orchestratorSections.editBasic.description" />
                </div>
              </template>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <UFormField :label="t('dashboard.name')" name="name" required>
                  <UInput v-model="name" class="w-full" :placeholder="t('orchestrators.edit.namePlaceholder')" />
                </UFormField>
                <UFormField :label="t('dashboard.tier')" name="tier">
                  <USelect v-model="tier" :items="tierOptions" class="w-full" />
                </UFormField>
                <UFormField :description="t('orchestrators.edit.immutableAfterCreation')" :label="t('dashboard.framework')">
                  <UInput :model-value="orchestrator.framework_type" class="w-full" disabled />
                </UFormField>
                <UFormField :description="t('orchestrators.edit.immutableAfterCreation')" :label="t('dashboard.mode')">
                  <UInput :model-value="orchestrator.mode" class="w-full" disabled />
                </UFormField>
                <UFormField
                  v-if="!isSupervisor"
                  :description="t('orchestrators.edit.llmConfigForOrchestrator')"
                  :label="t('settings.defaultLlmConfig')"
                  class="sm:col-span-2"
                >
                  <USelect
                    v-model="defaultLlmConfigId"
                    :items="llmConfigOptions"
                    class="w-full"
                    :placeholder="t('orchestrators.edit.placeholderSelectConfig')"
                  />
                </UFormField>
              </div>
            </UCard>

            <template v-if="isSupervisor">
              <USeparator :label="t('orchestrators.create.supervisorSettings')" />
              <LangGraphSupervisorProvider
                ref="supervisorProviderRef"
                :initial-value="orchestrator.config"
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
