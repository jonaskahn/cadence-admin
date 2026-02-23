<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { getApiErrorMessage } from '~/utils'

definePageMeta({ layout: 'auth' })

const auth = useAuth()
const toast = useToast()
const loading = ref(false)

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  username: '',
  password: ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const ok = await auth.login(event.data.username, event.data.password)
    if (!ok) {
      toast.add({ title: 'Login failed', color: 'error', icon: 'i-lucide-x-circle' })
    } else if (auth.isSysAdmin.value) {
      await navigateTo('/admin/orgs')
    } else if (auth.orgList.value.length === 0) {
      toast.add({
        title: 'No organizations available',
        color: 'warning',
        icon: 'i-lucide-alert-triangle'
      })
    } else {
      await navigateTo('/org-select')
    }
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, 'Invalid credentials')
    toast.add({
      title: 'Login failed',
      description: msg,
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="w-md">
    <template #header>
      <div class="flex flex-col items-center gap-2 py-2">
        <h1 class="text-2xl font-bold">Cadence</h1>
        <p class="text-dimmed text-sm">AI Orchestration Platform</p>
      </div>
    </template>

    <UForm
      method="post"
      :schema="schema"
      :state="state"
      class="flex flex-col gap-4"
      @submit="onSubmit"
    >
      <UFormField label="Username" name="username">
        <UInput
          v-model="state.username"
          placeholder="Enter username"
          autocomplete="username"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Password" name="password">
        <UInput
          v-model="state.password"
          type="password"
          placeholder="Enter password"
          autocomplete="current-password"
          class="w-full"
        />
      </UFormField>

      <UButton type="submit" label="Sign in" block :loading="loading" />
    </UForm>
  </UCard>
</template>
