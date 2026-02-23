<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { PluginMetadataResponse } from '~/types'

const emit = defineEmits<{ close: [] }>()

const auth = useAuth()
const orchestrators = useOrchestrators()
const toast = useToast()
const orgId = computed(() => auth.currentOrgId.value || '')

const { data: plugins } = await useFetch<PluginMetadataResponse[]>(
  () => `/api/orgs/${orgId.value}/plugins`
)

const schema = z.object({
  name: z.string().min(10, 'Name must be at least 10 characters').max(200),
  framework_type: z.enum(['langgraph', 'openai_agents', 'google_adk']),
  mode: z.enum(['supervisor', 'coordinator', 'handoff']),
  tier: z.enum(['hot', 'warm', 'cold']),
  active_plugin_ids: z.array(z.string()).min(1, 'Select at least one plugin')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '',
  framework_type: 'langgraph',
  mode: 'supervisor',
  tier: 'cold',
  active_plugin_ids: []
})

const loading = ref(false)

const supervisorSettingsRef = ref<{
  isValid: () => boolean
  getValue: () => Record<string, unknown>
} | null>(null)

const isLangGraphSupervisor = computed(
  () => state.framework_type === 'langgraph' && state.mode === 'supervisor'
)

const frameworkOptions = [
  { label: 'LangGraph', value: 'langgraph' },
  { label: 'OpenAI Agents (Not supported yet)', value: 'openai_agents' },
  { label: 'Google ADK (Not supported yet)', value: 'google_adk' }
]

const modeOptions = [
  { label: 'Supervisor', value: 'supervisor' },
  { label: 'Coordinator  (Not supported yet)', value: 'coordinator' },
  { label: 'Handoff  (Not supported yet)', value: 'handoff' }
]

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
  if (isLangGraphSupervisor.value && !supervisorSettingsRef.value?.isValid()) {
    toast.add({ title: 'Default LLM Config is required for Supervisor mode', color: 'error' })
    return
  }

  loading.value = true
  try {
    const config = isLangGraphSupervisor.value ? supervisorSettingsRef.value!.getValue() : undefined
    await orchestrators.create({ ...event.data, config } as Parameters<
      typeof orchestrators.create
    >[0])
    emit('close')
  } catch {
    // error is toast-handled in composable
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard :class="['w-full transition-all', isLangGraphSupervisor ? 'max-w-6xl' : 'max-w-xl']">
    <template #header>
      <p class="font-semibold">Create Orchestrator</p>
    </template>

    <UForm :schema="schema" :state="state" @submit="onSubmit">
      <div class="flex gap-6">
        <!-- Left: basic fields -->
        <div class="flex flex-col gap-4 w-80 shrink-0">
          <UFormField label="Name" name="name">
            <UInput v-model="state.name" placeholder="e.g. customer-support-agent" class="w-full" />
          </UFormField>

          <UFormField label="Framework" name="framework_type">
            <USelect v-model="state.framework_type" :items="frameworkOptions" class="w-full" />
          </UFormField>

          <UFormField label="Mode" name="mode">
            <USelect v-model="state.mode" :items="modeOptions" class="w-full" />
          </UFormField>

          <UFormField label="Initial Tier" name="tier">
            <USelect v-model="state.tier" :items="tierOptions" class="w-full" />
          </UFormField>

          <UFormField label="Plugins" name="active_plugins">
            <USelectMenu
              v-model="state.active_plugin_ids"
              :items="pluginOptions"
              value-key="value"
              multiple
              placeholder="Select plugins..."
              class="w-full"
            />
          </UFormField>
        </div>
        <USeparator orientation="vertical" class="h-full" />
        <template v-if="isLangGraphSupervisor">
          <div class="flex-1 min-w-0 flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
            <USeparator label="Settings" />
            <LangGraphSupervisorSettings ref="supervisorSettingsRef" :org-id="orgId" />
          </div>
        </template>
      </div>

      <div class="flex justify-end gap-2 pt-4 mt-4 border-t border-default">
        <UButton label="Cancel" variant="ghost" color="neutral" @click="emit('close')" />
        <UButton type="submit" label="Create" :loading="loading" />
      </div>
    </UForm>
  </UCard>
</template>
