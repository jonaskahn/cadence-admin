<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { getApiErrorMessage, LLM_PROVIDERS, providerLabel } from '~/utils'
import type { LLMConfigResponse } from '~/types'

const props = defineProps<{
  orgId: string
  initialValue?: LLMConfigResponse // present → edit mode
}>()
const emit = defineEmits<{ close: [] }>()
const toast = useToast()
const loading = ref(false)

const isEdit = computed(() => !!props.initialValue)
const provider = computed(() => (isEdit.value ? props.initialValue!.provider : state.provider))
const isAzure = computed(() => provider.value === 'azure')

const schema = computed(() =>
  z.object({
    name: z.string().min(1, 'Name is required'),
    ...(isEdit.value ? {} : { provider: z.string().min(1, 'Provider is required') }),
    api_key: isEdit.value ? z.string().optional() : z.string().min(1, 'API key is required'),
    base_url: z.string().optional(),
    api_version: z.string().optional()
  })
)

type Schema = z.output<ReturnType<typeof schema>>

const state = reactive<Record<string, string>>({
  name: props.initialValue?.name ?? '',
  provider: props.initialValue?.provider ?? 'openai',
  api_key: '',
  base_url: props.initialValue?.base_url ?? '',
  api_version: (props.initialValue?.additional_config?.api_version as string) ?? ''
})

async function submitEdit(data: Schema): Promise<void> {
  const body: Record<string, unknown> = { name: data.name, base_url: data.base_url || null }
  if (data.api_key) body.api_key = data.api_key
  if (isAzure.value) body.additional_config = data.api_version ? { api_version: data.api_version } : null
  await $fetch(`/api/orgs/${props.orgId}/llm-configs/${props.initialValue!.name}`, { method: 'PATCH', body })
  toast.add({ title: 'LLM config updated', icon: 'i-lucide-check', color: 'success' })
}

async function submitCreate(data: Schema): Promise<void> {
  const body: Record<string, unknown> = {
    name: data.name,
    provider: data.provider,
    api_key: data.api_key,
    base_url: data.base_url || null
  }
  if (isAzure.value && data.api_version) body.additional_config = { api_version: data.api_version }
  await $fetch(`/api/orgs/${props.orgId}/llm-configs`, { method: 'POST', body })
  toast.add({ title: 'LLM config added', icon: 'i-lucide-check', color: 'success' })
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    if (isEdit.value) await submitEdit(event.data)
    else await submitCreate(event.data)
    emit('close')
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, isEdit.value ? 'Failed to update config' : 'Failed to add config')
    toast.add({ title: 'Error', description: msg, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-lg">
    <template #header>
      <p class="font-semibold">
        {{ isEdit ? 'Edit LLM Configuration' : 'Add LLM Configuration' }}
      </p>
    </template>

    <UForm :schema="schema" :state="state" class="flex flex-col gap-4" @submit="onSubmit">
      <UFormField description="Unique name for this config (e.g. 'primary', 'fast')" label="Config Name" name="name">
        <UInput v-model="state.name" class="w-full" placeholder="primary" />
      </UFormField>

      <UFormField label="Provider" name="provider">
        <div v-if="isEdit" class="text-sm py-1.5 text-muted">
          {{ providerLabel(provider) }}
        </div>
        <USelect v-else v-model="state.provider" :items="LLM_PROVIDERS" class="w-full" />
      </UFormField>

      <UFormField :description="isEdit ? 'Leave empty to keep the existing key' : undefined" :required="!isEdit" label="API Key" name="api_key">
        <UInput v-model="state.api_key" class="w-full" placeholder="sk-..." type="password" />
      </UFormField>

      <UFormField description="Optional custom endpoint (required for LiteLLM)" label="Base URL" name="base_url">
        <UInput v-model="state.base_url" class="w-full" placeholder="https://..." />
      </UFormField>

      <UFormField v-if="isAzure" description="Azure OpenAI API version (e.g. 2024-02-01)" label="API Version" name="api_version">
        <UInput v-model="state.api_version" class="w-full" placeholder="2024-02-01" />
      </UFormField>

      <div class="flex justify-end gap-2">
        <UButton color="neutral" label="Cancel" variant="ghost" @click="emit('close')" />
        <UButton :label="isEdit ? 'Save Changes' : 'Add Config'" :loading="loading" type="submit" />
      </div>
    </UForm>
  </UCard>
</template>
