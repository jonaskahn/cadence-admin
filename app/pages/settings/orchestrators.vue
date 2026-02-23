<script lang="ts" setup>
import type { LLMConfigResponse, OrchestratorDefaults, ProviderModelResponse } from '~/types'
import { providerLabel } from '~/utils'

const auth = useAuth()
const toast = useToast()
const orgId = computed(() => auth.currentOrgId.value || '')

const { data: llmConfigs, pending: llmConfigsLoading } = await useFetch<LLMConfigResponse[]>(() => `/api/orgs/${orgId.value}/llm-configs`, { watch: [orgId] })

const { data: defaults, refresh } = await useFetch<OrchestratorDefaults>(() => `/api/orgs/${orgId.value}/orchestrator-defaults`, { watch: [orgId] })

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
  { label: 'None', value: null },
  ...(llmConfigs.value || []).map((c) => ({
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

async function save() {
  saving.value = true
  try {
    await $fetch(`/api/orgs/${orgId.value}/orchestrator-defaults`, {
      method: 'PUT',
      body: {
        default_llm_config_id: form.default_llm_config_id ? Number(form.default_llm_config_id) : null,
        default_model_name: form.default_model_name || null,
        default_max_tokens: form.default_max_tokens || null,
        default_timeout: form.default_timeout || null
      }
    })
    await refresh()
    toast.add({ title: 'Defaults saved', icon: 'i-lucide-check', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to save defaults', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <UPageCard
      description="Default values pre-filled when creating a new orchestrator instance. Existing instances are not affected when these change."
      orientation="horizontal"
      title="Global Orchestrator Settings"
      variant="naked"
    />
    <UCard>
      <div class="flex flex-col gap-5">
        <UFormField description="Pre-fills the LLM config dropdown on new instances." label="Default LLM Config">
          <USelect
            v-model="form.default_llm_config_id"
            :disabled="llmConfigsLoading"
            :items="llmConfigOptions"
            :loading="llmConfigsLoading"
            class="w-full"
            label-key="label"
            placeholder="None"
            value-key="value"
          />
        </UFormField>

        <UFormField v-if="form.default_llm_config_id" description="Pre-fills the model dropdown on new instances." label="Default Model Name">
          <div class="flex gap-2 items-center w-full">
            <UInput v-if="modelManual" v-model="form.default_model_name" class="flex-1" placeholder="e.g. gpt-4o, gemini-2.0-flash" />
            <USelect v-else v-model="form.default_model_name" :items="modelOptions" class="flex-1" placeholder="Select model…" />
            <UButton
              :icon="modelManual ? 'i-lucide-list' : 'i-lucide-pencil'"
              :title="modelManual ? 'Select from list' : 'Enter manually'"
              color="neutral"
              size="sm"
              variant="ghost"
              @click="modelManual = !modelManual; form.default_model_name = null"
            />
          </div>
        </UFormField>

        <UFormField label="Default Max Tokens">
          <UInput v-model.number="form.default_max_tokens" class="w-full" placeholder="e.g. 4096" type="number" />
        </UFormField>

        <UFormField label="Default Node Execution Timeout (seconds)">
          <UInput v-model.number="form.default_timeout" class="w-full" placeholder="e.g. 60" type="number" />
        </UFormField>

        <div class="flex justify-end pt-2">
          <UButton :loading="saving" icon="i-lucide-save" label="Save Defaults" @click="save" />
        </div>
      </div>
    </UCard>
  </div>
</template>
