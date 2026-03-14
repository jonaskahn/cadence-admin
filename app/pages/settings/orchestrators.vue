<script lang="ts" setup>
import type { LLMConfigResponse, OrchestratorDefaults, ProviderModelResponse } from '~/types'

const auth = useAuth()
const toast = useToast()
const { t } = useI18n()
const orgId = computed(() => auth.currentOrgId.value || '')

function providerLabel(provider: string): string {
  const key = `providers.${provider}`
  const val = t(key)
  return val !== key ? val : provider
}

const { data: llmConfigs, pending: llmConfigsLoading } = await useApiFetch<LLMConfigResponse[]>(() => `/api/orgs/${orgId.value}/llm-configs`, {
  watch: [orgId]
})

const { data: defaults, refresh } = await useApiFetch<OrchestratorDefaults>(() => `/api/orgs/${orgId.value}/orchestrator-defaults`, { watch: [orgId] })

// --- Helpers ---

const modelsByProvider = ref<Record<string, { label: string; value: string }[]>>({})

function providerOf(configId: string | null | undefined): string | null {
  if (!configId) return null
  return llmConfigs.value?.find((c) => c.id === configId)?.provider ?? null
}

async function ensureModels(provider: string | null) {
  if (!provider || modelsByProvider.value[provider]) return
  try {
    const models = await $fetch<ProviderModelResponse[]>(`/api/providers/${provider}/models`)
    modelsByProvider.value = {
      ...modelsByProvider.value,
      [provider]: models.map((m) => ({
        label: m.aliases.length ? `${m.display_name} — ${m.model_id} (${m.aliases.join(', ')})` : `${m.display_name} — ${m.model_id}`,
        value: m.model_id
      }))
    }
  } catch {
    modelsByProvider.value = { ...modelsByProvider.value, [provider]: [] }
  }
}

// --- Form init directly from resolved data (avoids watch timing issues) ---

const initLlmConfigId = defaults.value?.default_llm_config_id != null ? String(defaults.value.default_llm_config_id) : null

const form = reactive({
  default_llm_config_id: initLlmConfigId as string | null,
  default_model_name: defaults.value?.default_model_name ?? (null as string | null),
  default_max_tokens: defaults.value?.default_max_tokens ?? (null as number | null),
  default_timeout: defaults.value?.default_timeout ?? (null as number | null)
})

const modelManual = ref(false)

// Load model list for the initially selected config
if (initLlmConfigId) {
  await ensureModels(providerOf(initLlmConfigId))
  if (!modelsByProvider.value[providerOf(initLlmConfigId) ?? '']?.length) {
    modelManual.value = true
  }
}

// --- Computed ---

const llmConfigOptions = computed(() => [
  { label: t('settings.none'), value: null },
  ...(llmConfigs.value || [])
    .filter((c) => !c.is_deleted && c.is_enabled !== false)
    .map((c) => ({
      label: `${c.name} (${providerLabel(c.provider)})`,
      value: c.id
    }))
])

const modelOptions = computed(() => {
  const provider = providerOf(form.default_llm_config_id)
  return provider ? (modelsByProvider.value[provider] ?? []) : []
})

// --- Watchers ---

// Prevent the llm_config_id watcher from wiping model_name during programmatic updates
let isLoadingDefaults = false

// User manually changes LLM config → reset model
watch(
  () => form.default_llm_config_id,
  async (id) => {
    if (isLoadingDefaults) return
    form.default_model_name = null
    modelManual.value = false
    const provider = providerOf(id)
    await ensureModels(provider)
    if (id && !modelOptions.value.length) modelManual.value = true
  }
)

// Sync form after save (refresh) or org switch — NO immediate: true since form is already initialized
watch(defaults, async (val) => {
  if (!val) return
  isLoadingDefaults = true
  form.default_llm_config_id = val.default_llm_config_id != null ? String(val.default_llm_config_id) : null
  form.default_model_name = val.default_model_name
  form.default_max_tokens = val.default_max_tokens
  form.default_timeout = val.default_timeout
  const provider = providerOf(form.default_llm_config_id)
  await ensureModels(provider)
  modelManual.value = !!(form.default_llm_config_id && !modelOptions.value.length)
  isLoadingDefaults = false
})

// --- Save ---

const saving = ref(false)

function toggleModelManual() {
  modelManual.value = !modelManual.value
  form.default_model_name = null
}

async function save() {
  saving.value = true
  try {
    await $fetch(`/api/orgs/${orgId.value}/orchestrator-defaults`, {
      method: 'PUT',
      body: {
        default_llm_config_id: form.default_llm_config_id ? String(form.default_llm_config_id) : null,
        default_model_name: form.default_model_name || null,
        default_max_tokens: form.default_max_tokens || null,
        default_timeout: form.default_timeout || null
      }
    })
    await refresh()
    toast.add({ title: t('settings.defaultsSaved'), icon: 'i-lucide-check', color: 'success' })
  } catch {
    toast.add({ title: t('settings.failedSaveDefaults'), color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 pt-4">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <p class="font-semibold">{{ t('settings.orchestratorSettings') }}</p>
              <InfoPopover title-key="info.settings.orchestrators.title" description-key="info.settings.orchestrators.description" />
            </div>
            <p class="text-dimmed text-sm">{{ t('settings.orchestratorSettingsDescription') }}</p>
          </div>
        </div>
      </template>
      <div class="flex flex-col gap-5">
        <UFormField :description="t('settings.defaultLlmConfigDescription')" :label="t('settings.defaultLlmConfig')">
          <USelect
            v-model="form.default_llm_config_id"
            :disabled="llmConfigsLoading || !auth.isAdmin.value"
            :items="llmConfigOptions"
            :loading="llmConfigsLoading"
            class="w-full"
            label-key="label"
            :placeholder="t('settings.none')"
            value-key="value"
          />
        </UFormField>

        <UFormField v-if="form.default_llm_config_id" :description="t('settings.defaultModelDescription')" :label="t('settings.defaultModelName')">
          <div class="flex gap-2 items-center w-full">
            <UInput
              v-if="modelManual"
              v-model="form.default_model_name"
              class="flex-1"
              :disabled="!auth.isAdmin.value"
              :placeholder="t('settings.modelPlaceholder')"
            />
            <USelect
              v-else
              v-model="form.default_model_name"
              :items="modelOptions"
              class="flex-1"
              :disabled="!auth.isAdmin.value"
              :placeholder="t('settings.selectModel')"
            />
            <UButton
              :icon="modelManual ? 'i-lucide-list' : 'i-lucide-pencil'"
              :title="modelManual ? t('settings.selectFromList') : t('settings.enterManually')"
              :disabled="!auth.isAdmin.value"
              color="neutral"
              size="sm"
              variant="outline"
              @click="toggleModelManual"
            />
          </div>
        </UFormField>

        <UFormField :label="t('settings.defaultMaxTokens')">
          <UInput
            v-model.number="form.default_max_tokens"
            class="w-full"
            :disabled="!auth.isAdmin.value"
            :placeholder="t('settings.placeholder4096')"
            type="number"
          />
        </UFormField>

        <UFormField :label="t('settings.defaultTimeout')">
          <UInput
            v-model.number="form.default_timeout"
            class="w-full"
            :disabled="!auth.isAdmin.value"
            :placeholder="t('settings.placeholder60')"
            type="number"
          />
        </UFormField>

        <div v-if="auth.isAdmin.value" class="flex justify-end pt-2">
          <ConfirmActionPopover
            label-key="common.save"
            icon="i-lucide-save"
            confirm-title-key="settings.saveOrchestratorDefaultsTitle"
            confirm-message-key="settings.saveOrchestratorDefaultsMessage"
            confirm-label-key="common.saveConfirmFriendly"
            :loading="saving"
            :on-confirm="save"
          />
        </div>
      </div>
    </UCard>
  </div>
</template>
