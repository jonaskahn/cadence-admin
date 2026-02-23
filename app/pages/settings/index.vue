<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { TenantSettingResponse } from '~/types'

const auth = useAuth()
const toast = useToast()
const orgId = computed(() => auth.currentOrgId.value || '')

const { data: settings, refresh: refreshSettings } = await useFetch<TenantSettingResponse[]>(
  () => `/api/orgs/${orgId.value}/settings`,
  { watch: [orgId] }
)

const newKey = ref('')
const newValue = ref('')
const savingSetting = ref(false)

async function addSetting() {
  if (!newKey.value) return
  savingSetting.value = true
  try {
    await $fetch(`/api/orgs/${orgId.value}/settings`, {
      method: 'POST',
      body: { key: newKey.value, value: newValue.value }
    })
    newKey.value = ''
    newValue.value = ''
    await refreshSettings()
    toast.add({ title: 'Setting saved', icon: 'i-lucide-check', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to save setting', color: 'error' })
  } finally {
    savingSetting.value = false
  }
}

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Required'),
  new_password: z.string().min(6, 'Minimum 6 characters')
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
    toast.add({
      title: 'Failed to update password',
      description: 'Check your current password',
      color: 'error'
    })
  } finally {
    changingPassword.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <UPageCard title="Organization" variant="subtle">
      <dl class="grid grid-cols-2 gap-4">
        <div>
          <dt class="text-dimmed text-sm">Organization ID</dt>
          <dd class="font-mono text-sm mt-1">
            {{ orgId }}
          </dd>
        </div>
        <div>
          <dt class="text-dimmed text-sm">Your Role</dt>
          <dd class="mt-1">
            <UBadge variant="subtle" size="sm">
              {{ auth.currentOrg.value?.role || '—' }}
            </UBadge>
          </dd>
        </div>
      </dl>
    </UPageCard>

    <UPageCard
      title="Organization Settings"
      description="Override platform defaults for this organization."
      variant="subtle"
    >
      <div class="flex flex-col gap-3">
        <div
          v-for="setting in settings"
          :key="setting.key"
          class="flex items-center justify-between py-2 border-b border-default last:border-0"
        >
          <div>
            <p class="font-medium text-sm">
              {{ setting.key }}
            </p>
            <p class="text-dimmed text-xs">
              {{ setting.value_type }}
            </p>
          </div>
          <p class="text-sm">
            {{ String(setting.value) }}
          </p>
        </div>

        <p v-if="!settings?.length" class="text-dimmed text-sm text-center py-2">
          No settings configured.
        </p>

        <USeparator class="my-2" />

        <div class="flex gap-2 items-end">
          <UFormField label="Key" class="flex-1">
            <UInput v-model="newKey" placeholder="setting.key" class="w-full" />
          </UFormField>
          <UFormField label="Value" class="flex-1">
            <UInput v-model="newValue" placeholder="value" class="w-full" />
          </UFormField>
          <UButton label="Set" :loading="savingSetting" :disabled="!newKey" @click="addSetting" />
        </div>
      </div>
    </UPageCard>

    <UPageCard title="Change Password" description="Update your login password." variant="subtle">
      <UForm
        :schema="passwordSchema"
        :state="passwordState"
        class="flex flex-col gap-4"
        @submit="onPasswordSubmit"
      >
        <UFormField label="Current Password" name="current_password">
          <UInput v-model="passwordState.current_password" type="password" class="w-full" />
        </UFormField>
        <UFormField label="New Password" name="new_password">
          <UInput v-model="passwordState.new_password" type="password" class="w-full" />
        </UFormField>
        <UButton type="submit" label="Update Password" :loading="changingPassword" class="w-fit" />
      </UForm>
    </UPageCard>
  </div>
</template>
