<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { AboutMeResponse } from '~/types'

const toast = useToast()

const { data: me, refresh: refreshMe } = await useFetch<AboutMeResponse>('/api/me')

// --- Profile edit form ---
const profileSchema = z.object({
  display_name: z.string().max(255).optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional()
})
type ProfileSchema = z.output<typeof profileSchema>

const profileState = reactive<Partial<ProfileSchema>>({
  display_name: me.value?.display_name ?? '',
  email: me.value?.email ?? ''
})

const savingProfile = ref(false)

async function onProfileSubmit(event: FormSubmitEvent<ProfileSchema>) {
  savingProfile.value = true
  try {
    await $fetch('/api/me/profile', {
      method: 'PATCH',
      body: {
        display_name: event.data.display_name || null,
        email: event.data.email || null
      }
    })
    await refreshMe()
    toast.add({ title: 'Profile updated', icon: 'i-lucide-check', color: 'success' })
  } catch (err: any) {
    const msg = err?.data?.detail || 'Failed to save profile'
    toast.add({ title: msg, color: 'error' })
  } finally {
    savingProfile.value = false
  }
}

// --- Password form ---
const passwordSchema = z.object({
  current_password: z.string().min(1, 'Required'),
  new_password: z.string().min(8, 'Minimum 8 characters')
})
type PasswordSchema = z.output<typeof passwordSchema>

const passwordState = reactive<Partial<PasswordSchema>>({
  current_password: '',
  new_password: ''
})

const changingPassword = ref(false)

async function onPasswordSubmit(event: FormSubmitEvent<PasswordSchema>) {
  changingPassword.value = true
  try {
    await $fetch('/api/me/profile', {
      method: 'PATCH',
      body: {
        current_password: event.data.current_password,
        new_password: event.data.new_password
      }
    })
    passwordState.current_password = ''
    passwordState.new_password = ''
    toast.add({ title: 'Password updated', icon: 'i-lucide-check', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to update password', description: 'Check your current password', color: 'error' })
  } finally {
    changingPassword.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="profile">
    <template #header>
      <UDashboardNavbar title="Profile">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-6 p-6 lg:max-w-2xl mx-auto w-full">
        <!-- Read-only account info -->
        <UCard>
          <template #header>
            <p class="font-semibold">Account</p>
          </template>
          <dl class="grid grid-cols-2 gap-4">
            <div>
              <dt class="text-dimmed text-sm">Username</dt>
              <dd class="font-medium mt-1">{{ me?.username || '—' }}</dd>
            </div>
            <div>
              <dt class="text-dimmed text-sm">User ID</dt>
              <dd class="font-mono text-sm mt-1">{{ me?.user_id || '—' }}</dd>
            </div>
            <div>
              <dt class="text-dimmed text-sm">Role</dt>
              <dd class="mt-1">
                <UBadge :color="me?.is_sys_admin ? 'error' : 'neutral'" size="sm" variant="subtle">
                  {{ me?.is_sys_admin ? 'SYS_ADMIN' : 'USER' }}
                </UBadge>
              </dd>
            </div>
          </dl>
        </UCard>

        <!-- Editable profile fields -->
        <UCard>
          <template #header>
            <p class="font-semibold">Profile</p>
          </template>
          <UForm :schema="profileSchema" :state="profileState" class="flex flex-col gap-4" @submit="onProfileSubmit">
            <UFormField label="Display Name" name="display_name">
              <UInput v-model="profileState.display_name" class="w-full" placeholder="Your name" />
            </UFormField>
            <UFormField label="Email" name="email">
              <UInput v-model="profileState.email" class="w-full" placeholder="you@example.com" type="email" />
            </UFormField>
            <UButton :loading="savingProfile" class="w-fit" label="Save Profile" type="submit" />
          </UForm>
        </UCard>

        <!-- Change password -->
        <UCard>
          <template #header>
            <p class="font-semibold">Change Password</p>
          </template>
          <UForm :schema="passwordSchema" :state="passwordState" class="flex flex-col gap-4" @submit="onPasswordSubmit">
            <UFormField label="Current Password" name="current_password">
              <UInput v-model="passwordState.current_password" class="w-full" type="password" />
            </UFormField>
            <UFormField label="New Password" name="new_password">
              <UInput v-model="passwordState.new_password" class="w-full" type="password" />
            </UFormField>
            <UButton :loading="changingPassword" class="w-fit" label="Update Password" type="submit" />
          </UForm>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
