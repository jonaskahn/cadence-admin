<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { FrameworkSupportedProvidersResponse, LLMConfigResponse, OrchestratorResponse } from '~/types'
import { providerLabel } from '~/utils'

const props = defineProps<{
  orchestrator: OrchestratorResponse
}>()

const emit = defineEmits<{ close: []; updated: [] }>()

const auth = useAuth()
const orchestrators = useOrchestrators()
const toast = useToast()
const orgId = computed(() => auth.currentOrgId.value || '')

const loading = ref(false)

const schema = z.object({
  name: z.string().min(10, 'Name must be at least 10 characters').max(200, 'Name must be at most 200 characters'),
  tier: z.enum(['hot', 'warm', 'cold'])
})
type Schema = z.output<typeof schema>

const name = ref(props.orchestrator.name)
const tier = ref<'hot' | 'warm' | 'cold'>(props.orchestrator.tier as 'hot' | 'warm' | 'cold')

const tierOptions = [
  { label: 'Cold', value: 'cold' },
  { label: 'Warm', value: 'warm' },
  { label: 'Hot (load immediately)', value: 'hot' }
]

const isSupervisor = computed(() => props.orchestrator.mode === 'supervisor' && supportedModes.value.includes('supervisor'))

const supervisorSettingsRef = ref<{
  isValid: () => boolean
  getValue: () => Record<string, unknown>
} | null>(null)

const { data: llmConfigs } = useFetch<LLMConfigResponse[]>(() => `/api/orgs/${orgId.value}/llm-configs`)

const llmConfigOptions = computed(() =>
  (llmConfigs.value ?? []).map((c) => ({
    label: `${c.name} (${providerLabel(c.provider)})`,
    value: c.id
  }))
)

const defaultLlmConfigId = ref<string | undefined>(
  props.orchestrator.config.default_llm_config_id != null ? String(props.orchestrator.config.default_llm_config_id) : undefined
)

const { data: frameworkCapabilities } = await useFetch<FrameworkSupportedProvidersResponse>(
  `/api/frameworks/${props.orchestrator.framework_type}/supported-providers`
)

const supportedProviders = computed(() => (frameworkCapabilities.value?.supports_all ? null : (frameworkCapabilities.value?.supported_providers ?? null)))
const supportedModes = computed(() => frameworkCapabilities.value?.supported_modes ?? [])

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (isSupervisor.value && !supervisorSettingsRef.value?.isValid()) {
    toast.add({ title: 'Default LLM Config is required', color: 'error' })
    return
  }

  loading.value = true
  try {
    await orchestrators.updateMetadata(props.orchestrator.instance_id, {
      name: event.data.name,
      tier: event.data.tier
    })

    if (isSupervisor.value && supervisorSettingsRef.value) {
      await orchestrators.updateConfig(props.orchestrator.instance_id, supervisorSettingsRef.value.getValue())
    } else if (!isSupervisor.value && defaultLlmConfigId.value !== undefined) {
      await orchestrators.updateMetadata(props.orchestrator.instance_id, {
        default_llm_config_id: defaultLlmConfigId.value ? parseInt(defaultLlmConfigId.value, 10) : null
      })
    }

    emit('updated')
    emit('close')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard :class="['w-full transition-all', isSupervisor ? 'max-w-6xl' : 'max-w-xl']">
    <template #header>
      <p class="font-semibold">Edit Orchestrator</p>
    </template>

    <UForm :schema="schema" :state="{ name, tier }" @submit="onSubmit">
      <div class="flex flex-col min-w-0 gap-4 max-h-[80vh] overflow-y-auto">
        <USeparator label="Info" />
        <div class="flex flex-col gap-4 w-lg shrink-0">
          <UFormField label="Name" name="name" required>
            <UInput v-model="name" class="w-full" placeholder="Instance name" />
          </UFormField>

          <UFormField label="Tier" name="tier">
            <USelect v-model="tier" :items="tierOptions" class="w-full" />
          </UFormField>

          <UFormField description="Immutable after creation" label="Framework">
            <UInput :model-value="orchestrator.framework_type" class="w-full" disabled />
          </UFormField>

          <UFormField description="Immutable after creation" label="Mode">
            <UInput :model-value="orchestrator.mode" class="w-full" disabled />
          </UFormField>

          <UFormField v-if="!isSupervisor" description="LLM config for this orchestrator" label="Default LLM Config">
            <USelect v-model="defaultLlmConfigId" :items="llmConfigOptions" class="w-full" placeholder="Select LLM config…" />
          </UFormField>

          <template v-if="isSupervisor">
            <USeparator label="Settings" />
            <LangGraphSupervisorSettings
              ref="supervisorSettingsRef"
              :initial-value="orchestrator.config"
              :org-id="orgId"
              :supported-providers="supportedProviders"
            />
          </template>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-4 mt-4 border-t border-default">
        <UButton color="neutral" label="Cancel" variant="ghost" @click="emit('close')" />
        <UButton :loading="loading" label="Save" type="submit" />
      </div>
    </UForm>
  </UCard>
</template>
