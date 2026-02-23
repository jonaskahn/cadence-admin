<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { FrameworkSupportedProvidersResponse, OrchestratorDefaults, OrchestratorResponse, PluginMetadataResponse } from '~/types'

const props = defineProps<{
  cloneSource?: OrchestratorResponse | null
}>()

const emit = defineEmits<{ close: [] }>()

const auth = useAuth()
const orchestrators = useOrchestrators()
const toast = useToast()
const orgId = computed(() => auth.currentOrgId.value || '')

const { data: plugins } = await useFetch<PluginMetadataResponse[]>(() => `/api/orgs/${orgId.value}/plugins`)

const { data: orgDefaults } = await useFetch<OrchestratorDefaults>(() => `/api/orgs/${orgId.value}/orchestrator-defaults`, { watch: [orgId] })

const supervisorInitialValue = computed(() => props.cloneSource?.config ?? orgDefaults.value ?? {})

const schema = z.object({
  name: z.string().min(10, 'Name must be at least 10 characters').max(200),
  framework_type: z.string().min(1),
  mode: z.string().min(1),
  tier: z.enum(['hot', 'warm', 'cold']),
  active_plugin_ids: z.array(z.string()).min(1, 'Select at least one plugin')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: props.cloneSource ? `Copy of ${props.cloneSource.name}` : '',
  framework_type: (props.cloneSource?.framework_type as Schema['framework_type']) ?? 'langgraph',
  mode: (props.cloneSource?.mode as Schema['mode']) ?? 'supervisor',
  tier: (props.cloneSource?.tier as Schema['tier']) ?? 'cold',
  active_plugin_ids: []
})

const loading = ref(false)

const supervisorSettingsRef = ref<{
  isValid: () => boolean
  getValue: () => Record<string, unknown>
} | null>(null)

const { data: frameworks } = await useFetch<FrameworkSupportedProvidersResponse[]>('/api/frameworks')

const currentFrameworkCaps = computed(() => frameworks.value?.find((fw) => fw.framework_type === state.framework_type))

const supportedProviders = computed(() => (currentFrameworkCaps.value?.supports_all ? null : (currentFrameworkCaps.value?.supported_providers ?? null)))
const supportedModes = computed(() => currentFrameworkCaps.value?.supported_modes ?? [])

const isSupervisor = computed(() => state.mode === 'supervisor' && supportedModes.value.includes('supervisor'))

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

function frameworkLabel(fw: string): string {
  const labels: Record<string, string> = {
    langgraph: 'LangGraph',
    google_adk: 'Google ADK',
    openai_agents: 'OpenAI Agents'
  }
  return labels[fw] ?? fw
}

function modeLabel(mode: string): string {
  return mode.charAt(0).toUpperCase() + mode.slice(1).replace(/_/g, ' ')
}

const tierOptions = [
  { label: 'Cold (default)', value: 'cold' },
  { label: 'Warm', value: 'warm' },
  { label: 'Hot (load immediately)', value: 'hot' }
]

const pluginOptions = computed<{ label: string; value: string }[]>(() =>
  (plugins.value || []).map((p) => ({
    label: `${p.name} ${p.version} (${p.pid})`,
    value: p.id
  }))
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (isSupervisor.value && !supervisorSettingsRef.value?.isValid()) {
    toast.add({ title: 'Default LLM Config is required for Supervisor mode', color: 'error' })
    return
  }

  loading.value = true
  try {
    const config = isSupervisor.value ? supervisorSettingsRef.value!.getValue() : undefined
    await orchestrators.create({ ...event.data, config } as Parameters<typeof orchestrators.create>[0])
    emit('close')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard :class="['w-full transition-all', isSupervisor ? 'max-w-6xl' : 'max-w-xl']">
    <template #header>
      <p class="font-semibold">Create Orchestrator</p>
    </template>

    <UForm :schema="schema" :state="state" @submit="onSubmit">
      <div class="flex flex-col min-w-0 gap-4 max-h-[80vh] overflow-y-auto">
        <USeparator label="Info" />
        <div class="flex flex-col gap-4 w-lg shrink-0">
          <UFormField label="Name" name="name" required>
            <UInput v-model="state.name" class="w-full" placeholder="e.g. customer-support-agent" />
          </UFormField>

          <UFormField label="Framework" name="framework_type" required>
            <USelect v-model="state.framework_type" :items="frameworkOptions" class="w-full" />
          </UFormField>

          <UFormField label="Mode" name="mode" required>
            <USelect v-model="state.mode" :items="modeOptions" class="w-full" />
          </UFormField>

          <UFormField label="Initial Tier" name="tier">
            <USelect v-model="state.tier" :items="tierOptions" class="w-full" />
          </UFormField>

          <UFormField label="Plugins" name="active_plugin_ids" required>
            <USelectMenu v-model="state.active_plugin_ids" :items="pluginOptions" class="w-full" multiple placeholder="Select plugins..." value-key="value" />
          </UFormField>
          <template v-if="isSupervisor">
            <USeparator label="Settings" />
            <LangGraphSupervisorSettings
              v-if="cloneSource || orgDefaults !== null"
              ref="supervisorSettingsRef"
              :initial-value="supervisorInitialValue"
              :org-id="orgId"
              :supported-providers="supportedProviders"
            />
          </template>
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-4 mt-4 border-t border-default">
        <UButton color="neutral" label="Cancel" variant="ghost" @click="emit('close')" />
        <UButton :loading="loading" label="Create" type="submit" />
      </div>
    </UForm>
  </UCard>
</template>
