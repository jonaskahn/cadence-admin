<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { getApiErrorMessage } from '~/utils'

const props = defineProps<{ orgId: string }>()
const emit = defineEmits<{ close: [] }>()
const toast = useToast()
const { findUser } = useUserSearch()
const loading = ref(false)

const schema = z.object({
  identifier: z.string().min(1, 'Email, username or user ID is required'),
  is_admin: z.boolean()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  identifier: '',
  is_admin: false
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const user = await findUser(event.data.identifier)
    if (!user) {
      toast.add({
        title: 'User not found',
        description: 'No user matched that email, username, or ID.',
        color: 'warning'
      })
      return
    }
    await $fetch(`/api/orgs/${props.orgId}/users`, {
      method: 'POST',
      body: { user_id: user.user_id, is_admin: event.data.is_admin }
    })
    toast.add({ title: 'Member added', icon: 'i-lucide-check', color: 'success' })
    emit('close')
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, 'Failed to add member')
    toast.add({ title: 'Error', description: msg, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-lg">
    <template #header>
      <p class="font-semibold">Add Member</p>
    </template>

    <UForm :schema="schema" :state="state" class="flex flex-col gap-4" @submit="onSubmit">
      <UFormField
        label="User"
        name="identifier"
        description="Enter the user's email, username, or user ID"
      >
        <UInput
          v-model="state.identifier"
          placeholder="email, username, or user ID"
          class="w-full"
        />
      </UFormField>

      <UFormField name="is_admin">
        <UCheckbox v-model="state.is_admin" label="Grant admin rights" />
      </UFormField>

      <div class="flex justify-end gap-2">
        <UButton label="Cancel" variant="ghost" color="neutral" @click="emit('close')" />
        <UButton type="submit" label="Add Member" :loading="loading" />
      </div>
    </UForm>
  </UCard>
</template>
