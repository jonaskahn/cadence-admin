<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { getApiErrorMessage, LLM_PROVIDERS } from '~/utils'

const props = defineProps<{ orgId: string }>()
const emit = defineEmits<{ close: [] }>()
const toast = useToast()
const loading = ref(false)

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  provider: z.string().min(1, 'Provider is required'),
  api_key: z.string().min(1, 'API key is required'),
  base_url: z.string().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '',
  provider: 'openai',
  api_key: '',
  base_url: ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await $fetch(`/api/orgs/${props.orgId}/llm-configs`, {
      method: 'POST',
      body: {
        ...event.data,
        base_url: event.data.base_url || null
      }
    })
    toast.add({ title: 'LLM config added', icon: 'i-lucide-check', color: 'success' })
    emit('close')
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, 'Failed to add config')
    toast.add({ title: 'Error', description: msg, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-lg">
    <template #header>
      <p class="font-semibold">Add LLM Configuration</p>
    </template>

    <UForm :schema="schema" :state="state" class="flex flex-col gap-4" @submit="onSubmit">
      <UFormField
        label="Config Name"
        name="name"
        description="Unique name for this config (e.g. 'primary', 'fast')"
      >
        <UInput v-model="state.name" placeholder="primary" class="w-full" />
      </UFormField>

      <UFormField label="Provider" name="provider">
        <USelect v-model="state.provider" :items="LLM_PROVIDERS" class="w-full" />
      </UFormField>

      <UFormField label="API Key" name="api_key">
        <UInput v-model="state.api_key" type="password" placeholder="sk-..." class="w-full" />
      </UFormField>

      <UFormField
        label="Base URL"
        name="base_url"
        description="Optional custom endpoint (required for openai_compatible)"
      >
        <UInput v-model="state.base_url" placeholder="https://..." class="w-full" />
      </UFormField>

      <div class="flex justify-end gap-2">
        <UButton label="Cancel" variant="ghost" color="neutral" @click="emit('close')" />
        <UButton type="submit" label="Add Config" :loading="loading" />
      </div>
    </UForm>
  </UCard>
</template>
