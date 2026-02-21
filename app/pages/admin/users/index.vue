<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { UserMembershipResponse } from '~/types'
import { getApiErrorMessage } from '~/utils'

const toast = useToast()
const loading = ref(false)
const created = ref<UserMembershipResponse | null>(null)

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  password: z.string().min(6, 'Min 6 characters').optional().or(z.literal(''))
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  username: '',
  email: '',
  password: ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const result = await $fetch<UserMembershipResponse>('/api/admin/users', {
      method: 'POST',
      body: {
        username: event.data.username,
        email: event.data.email || null,
        password: event.data.password || null
      }
    })
    created.value = result
    state.username = ''
    state.email = ''
    state.password = ''
    toast.add({ title: 'User created', icon: 'i-lucide-check', color: 'success' })
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, 'Failed to create user')
    toast.add({ title: 'Error', description: msg, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="admin-users">
    <template #header>
      <UDashboardNavbar title="Create User">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 max-w-lg">
        <UCard>
          <template #header>
            <p class="font-semibold">Create Platform User</p>
            <p class="text-dimmed text-sm mt-1">
              Creates a user without org membership. Use org settings to add them to orgs.
            </p>
          </template>

          <UForm :schema="schema" :state="state" class="flex flex-col gap-4" @submit="onSubmit">
            <UFormField label="Username" name="username">
              <UInput v-model="state.username" placeholder="johndoe" class="w-full" />
            </UFormField>
            <UFormField label="Email" name="email">
              <UInput
                v-model="state.email"
                type="email"
                placeholder="john@example.com"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Password"
              name="password"
              description="Optional — user can set later"
            >
              <UInput v-model="state.password" type="password" class="w-full" />
            </UFormField>
            <UButton type="submit" label="Create User" :loading="loading" class="w-fit" />
          </UForm>
        </UCard>

        <UCard v-if="created" class="mt-4">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-check-circle" class="text-success" />
              <p class="font-semibold">User Created</p>
            </div>
          </template>
          <dl class="grid grid-cols-2 gap-3">
            <div>
              <dt class="text-dimmed text-sm">User ID</dt>
              <dd class="font-mono text-sm mt-1">
                {{ created.user_id }}
              </dd>
            </div>
            <div>
              <dt class="text-dimmed text-sm">Username</dt>
              <dd class="mt-1">
                {{ created.username }}
              </dd>
            </div>
          </dl>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
