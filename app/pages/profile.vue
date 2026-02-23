<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { AboutMeResponse } from '~/types'

const toast = useToast()
const { t } = useI18n()

const { data: me, refresh: refreshMe } = await useFetch<AboutMeResponse>('/api/me')

// --- Profile edit form ---
const profileSchema = z.object({
  display_name: z.string().max(255).optional(),
  email: z
    .string()
    .email({ error: () => t('common.invalidEmail') })
    .or(z.literal(''))
    .optional()
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
    toast.add({ title: t('profile.profileUpdated'), icon: 'i-lucide-check', color: 'success' })
  } catch (err: unknown) {
    const msg = (err as { data?: { detail?: string } })?.data?.detail || t('profile.failedSaveProfile')
    toast.add({ title: msg, color: 'error' })
  } finally {
    savingProfile.value = false
  }
}

// --- Password form ---
const passwordSchema = z.object({
  current_password: z.string().min(1, { error: () => t('common.required') }),
  new_password: z.string().min(8, { error: () => t('profile.min8Chars') })
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
    toast.add({ title: t('profile.passwordUpdated'), icon: 'i-lucide-check', color: 'success' })
  } catch {
    toast.add({ title: t('profile.failedUpdatePassword'), description: t('profile.checkCurrentPassword'), color: 'error' })
  } finally {
    changingPassword.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="profile">
    <template #header>
      <UDashboardNavbar :title="t('profile.title')">
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
            <p class="font-semibold">{{ t('profile.account') }}</p>
          </template>
          <dl class="grid grid-cols-2 gap-4">
            <div>
              <dt class="text-dimmed text-sm">{{ t('auth.username') }}</dt>
              <dd class="font-medium mt-1">{{ me?.username || t('common.empty') }}</dd>
            </div>
            <div>
              <dt class="text-dimmed text-sm">{{ t('profile.userId') }}</dt>
              <dd class="font-mono text-sm mt-1">{{ me?.user_id || t('common.empty') }}</dd>
            </div>
            <div>
              <dt class="text-dimmed text-sm">{{ t('profile.role') }}</dt>
              <dd class="mt-1">
                <UBadge :color="me?.is_sys_admin ? 'error' : 'neutral'" size="sm" variant="subtle">
                  {{ me?.is_sys_admin ? t('profile.roleSysAdmin') : t('profile.roleUser') }}
                </UBadge>
              </dd>
            </div>
          </dl>
        </UCard>

        <!-- Editable profile fields -->
        <UCard>
          <template #header>
            <p class="font-semibold">{{ t('profile.profile') }}</p>
          </template>
          <UForm :schema="profileSchema" :state="profileState" class="flex flex-col gap-4" @submit="onProfileSubmit">
            <UFormField :label="t('profile.displayName')" name="display_name">
              <UInput v-model="profileState.display_name" class="w-full" :placeholder="t('profile.yourName')" />
            </UFormField>
            <UFormField :label="t('profile.email')" name="email">
              <UInput v-model="profileState.email" class="w-full" :placeholder="t('profile.emailPlaceholder')" type="email" />
            </UFormField>
            <UButton :loading="savingProfile" class="w-fit" :label="t('profile.saveProfile')" type="submit" />
          </UForm>
        </UCard>

        <!-- Change password -->
        <UCard>
          <template #header>
            <p class="font-semibold">{{ t('profile.changePassword') }}</p>
          </template>
          <UForm :schema="passwordSchema" :state="passwordState" class="flex flex-col gap-4" @submit="onPasswordSubmit">
            <UFormField :label="t('profile.currentPassword')" name="current_password">
              <UInput v-model="passwordState.current_password" class="w-full" type="password" />
            </UFormField>
            <UFormField :label="t('profile.newPassword')" name="new_password">
              <UInput v-model="passwordState.new_password" class="w-full" type="password" />
            </UFormField>
            <UButton :loading="changingPassword" class="w-fit" :label="t('profile.updatePassword')" type="submit" />
          </UForm>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
