<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const props = defineProps<{ orgId: string }>()
const emit = defineEmits<{ close: [] }>()
const toast = useToast()
const loading = ref(false)

const schema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  is_admin: z.boolean()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  user_id: '',
  is_admin: false
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await $fetch(`/api/orgs/${props.orgId}/members`, {
      method: 'POST',
      body: event.data
    })
    toast.add({ title: 'Member added', icon: 'i-lucide-check', color: 'success' })
    emit('close')
  } catch (err: unknown) {
    const msg = (err as { statusMessage?: string })?.statusMessage || 'Failed to add member'
    toast.add({ title: 'Error', description: msg, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-md">
    <template #header>
      <p class="font-semibold">Add Member</p>
    </template>

    <UForm :schema="schema" :state="state" class="flex flex-col gap-4" @submit="onSubmit">
      <UFormField label="User ID" name="user_id" description="The user's platform ID">
        <UInput v-model="state.user_id" placeholder="user_id" class="w-full" />
      </UFormField>

      <UFormField name="is_admin">
        <UCheckbox v-model="state.is_admin" label="Grant org_admin rights" />
      </UFormField>

      <div class="flex justify-end gap-2">
        <UButton label="Cancel" variant="ghost" color="neutral" @click="emit('close')" />
        <UButton type="submit" label="Add Member" :loading="loading" />
      </div>
    </UForm>
  </UCard>
</template>
