<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { PluginMetadataResponse } from '~/types'

const emit = defineEmits<{ close: [] }>()

const auth = useAuth()
const orchestrators = useOrchestrators()
const orgId = computed(() => auth.currentOrgId.value || '')

const { data: plugins } = await useFetch<PluginMetadataResponse[]>(
  () => `/api/orgs/${orgId.value}/plugins`
)

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  framework_type: z.enum(['langgraph', 'openai_agents', 'google_adk']),
  mode: z.enum(['supervisor', 'coordinator', 'handoff']),
  tier: z.enum(['hot', 'warm', 'cold']),
  active_plugins: z.array(z.string()).min(1, 'Select at least one plugin')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '',
  framework_type: 'langgraph',
  mode: 'supervisor',
  tier: 'cold',
  active_plugins: []
})

const loading = ref(false)

const pluginOptions = computed<{ label: string; value: string }[]>(() =>
  (plugins.value || [])
    .filter((p) => p.is_latest)
    .map((p) => ({
      label: `${p.name} (${p.pid})`,
      value: p.pid
    }))
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  const result = await orchestrators.create(event.data)
  loading.value = false
  if (result) {
    emit('close')
  }
}
</script>

<template>
  <UCard class="w-full max-w-lg">
    <template #header>
      <p class="font-semibold">Create Orchestrator</p>
    </template>

    <UForm :schema="schema" :state="state" class="flex flex-col gap-4" @submit="onSubmit">
      <UFormField label="Name" name="name">
        <UInput v-model="state.name" placeholder="e.g. customer-support" class="w-full" />
      </UFormField>

      <UFormField label="Framework" name="framework_type">
        <USelect
          v-model="state.framework_type"
          :items="[
            { label: 'LangGraph', value: 'langgraph' },
            { label: 'OpenAI Agents', value: 'openai_agents' },
            { label: 'Google ADK', value: 'google_adk' }
          ]"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Mode" name="mode">
        <USelect
          v-model="state.mode"
          :items="[
            { label: 'Supervisor', value: 'supervisor' },
            { label: 'Coordinator', value: 'coordinator' },
            { label: 'Handoff', value: 'handoff' }
          ]"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Initial Tier" name="tier">
        <USelect
          v-model="state.tier"
          :items="[
            { label: 'Cold (default)', value: 'cold' },
            { label: 'Warm', value: 'warm' },
            { label: 'Hot (load immediately)', value: 'hot' }
          ]"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Plugins" name="active_plugins">
        <USelectMenu
          v-model="state.active_plugins"
          :items="pluginOptions"
          value-key="value"
          multiple
          placeholder="Select plugins..."
          class="w-full"
        />
      </UFormField>

      <div class="flex justify-end gap-2 pt-2">
        <UButton label="Cancel" variant="ghost" color="neutral" @click="emit('close')" />
        <UButton type="submit" label="Create" :loading="loading" />
      </div>
    </UForm>
  </UCard>
</template>
