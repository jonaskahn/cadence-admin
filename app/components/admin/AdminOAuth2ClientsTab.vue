<script lang="ts" setup>
import type { OAuth2ClientCreateRequest, OAuth2ClientResponse } from '~/types'
import { getApiErrorMessage } from '~/utils'

const toast = useToast()
const { t } = useI18n()
const { withOverlay } = useLoadingOverlay()

const { data: clients, refresh } = await useApiFetch<OAuth2ClientResponse[]>('/api/admin/oauth2/clients')

const showRegister = ref(false)
const saving = ref(false)

const form = reactive({
  client_id: '',
  name: '',
  client_type: 'confidential' as 'public' | 'confidential',
  is_first_party: false,
  redirect_uris_text: '',
  grant_password: false,
  grant_refresh_token: false,
  grant_authorization_code: false,
  scopes_text: '',
  client_secret: ''
})

function resetForm() {
  form.client_id = ''
  form.name = ''
  form.client_type = 'confidential'
  form.is_first_party = false
  form.redirect_uris_text = ''
  form.grant_password = false
  form.grant_refresh_token = false
  form.grant_authorization_code = false
  form.scopes_text = ''
  form.client_secret = ''
}

function openRegister() {
  resetForm()
  showRegister.value = true
}

function grantLabel(g: string): string {
  const map: Record<string, string> = {
    password: t('admin.grantTypePassword'),
    refresh_token: t('admin.grantTypeRefresh'),
    authorization_code: t('admin.grantTypeAuthCode')
  }
  return map[g] ?? g
}

function linesToList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

async function submitRegister() {
  saving.value = true
  try {
    const allowed_grant_types: string[] = []
    if (form.grant_password) allowed_grant_types.push('password')
    if (form.grant_refresh_token) allowed_grant_types.push('refresh_token')
    if (form.grant_authorization_code) allowed_grant_types.push('authorization_code')

    const body: OAuth2ClientCreateRequest = {
      client_id: form.client_id.trim(),
      name: form.name.trim(),
      client_type: form.client_type,
      is_first_party: form.is_first_party,
      redirect_uris: linesToList(form.redirect_uris_text),
      allowed_grant_types,
      allowed_scopes: linesToList(form.scopes_text),
      client_secret: form.client_secret.trim() || undefined
    }

    await withOverlay(async () => {
      await $fetch('/api/admin/oauth2/clients', { method: 'POST', body })
      toast.add({ title: t('admin.oauth2ClientCreated'), icon: 'i-lucide-check', color: 'success' })
      showRegister.value = false
      await refresh()
    })
  } catch (err: unknown) {
    toast.add({
      title: t('admin.oauth2ClientCreateFailed'),
      description: getApiErrorMessage(err, ''),
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
  } finally {
    saving.value = false
  }
}

const clientTypeItems = computed(() => [
  { label: t('admin.oauth2Public'), value: 'public' },
  { label: t('admin.oauth2Confidential'), value: 'confidential' }
])

const columns = computed(() => [
  { accessorKey: 'client_id', header: t('admin.oauth2AppClientId') },
  { accessorKey: 'name', header: t('admin.oauth2AppName') },
  { accessorKey: 'client_type', header: t('admin.oauth2ClientType') },
  { accessorKey: 'is_first_party', header: t('admin.oauth2FirstParty') },
  { accessorKey: 'allowed_grant_types', header: t('admin.oauth2Grants') },
  { accessorKey: 'is_active', header: t('admin.status') }
])
</script>

<template>
  <div class="flex flex-col gap-6 pt-4">
    <UAlert
      color="info"
      icon="i-lucide-radar"
      :title="t('admin.oauth2ClientsTab')"
      :description="t('admin.oauth2ClientsTabDescription')"
      variant="subtle"
    />

    <div class="flex justify-end">
      <UButton icon="i-lucide-plus" :label="t('admin.registerOAuthClient')" @click="openRegister" />
    </div>

    <UCard v-if="clients?.length" variant="soft">
      <UTable :data="clients || []" :columns="columns">
        <template #is_first_party-cell="{ row }">
          <UBadge v-if="row.original.is_first_party" color="primary" variant="subtle">{{ t('common.enabled') }}</UBadge>
          <span v-else class="text-muted text-sm">—</span>
        </template>
        <template #allowed_grant_types-cell="{ row }">
          <div class="flex flex-wrap gap-1">
            <UBadge
              v-for="g in row.original.allowed_grant_types"
              :key="g"
              color="neutral"
              variant="subtle"
              class="text-xs"
            >
              {{ grantLabel(g) }}
            </UBadge>
          </div>
        </template>
        <template #is_active-cell="{ row }">
          <UBadge :color="row.original.is_active ? 'success' : 'error'" variant="subtle">
            {{ row.original.is_active ? t('admin.oauth2Active') : t('admin.oauth2Inactive') }}
          </UBadge>
        </template>
      </UTable>
    </UCard>
    <p v-else class="text-muted text-sm">{{ t('common.empty') }}</p>

    <UModal v-model:open="showRegister" :title="t('admin.registerOAuthClient')" :ui="{ content: 'sm:max-w-lg' }">
      <template #content>
        <div class="flex flex-col gap-4 p-4 sm:p-6">
          <UFormField :label="t('admin.oauth2AppClientId')" required>
            <UInput v-model="form.client_id" class="w-full font-mono" autocomplete="off" />
          </UFormField>
          <UFormField :label="t('admin.oauth2AppName')" required>
            <UInput v-model="form.name" class="w-full" />
          </UFormField>
          <UFormField :label="t('admin.oauth2ClientType')" required>
            <USelect v-model="form.client_type" :items="clientTypeItems" value-key="value" class="w-full" />
          </UFormField>
          <UFormField :label="t('admin.oauth2FirstParty')">
            <USwitch v-model="form.is_first_party" />
          </UFormField>
          <UFormField :label="t('admin.oauth2RedirectUris')" :description="t('admin.oauth2RedirectUrisHint')">
            <UTextarea v-model="form.redirect_uris_text" :rows="4" class="w-full font-mono text-sm" />
          </UFormField>
          <UFormField :label="t('admin.oauth2GrantTypes')">
            <div class="flex flex-col gap-2">
              <UCheckbox v-model="form.grant_password" :label="t('admin.grantPassword')" />
              <UCheckbox v-model="form.grant_refresh_token" :label="t('admin.grantRefreshToken')" />
              <UCheckbox v-model="form.grant_authorization_code" :label="t('admin.grantAuthCode')" />
            </div>
          </UFormField>
          <UFormField :label="t('admin.oauth2ScopesOptional')" :description="t('admin.oauth2ScopesHint')">
            <UTextarea v-model="form.scopes_text" :rows="3" class="w-full font-mono text-sm" />
          </UFormField>
          <UFormField :label="t('admin.clientSecret')" :description="t('admin.oauth2SecretHint')">
            <UInput v-model="form.client_secret" type="password" class="w-full" autocomplete="new-password" />
          </UFormField>
          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="subtle" :label="t('common.cancel')" @click="showRegister = false" />
            <UButton :loading="saving" :label="t('admin.registerOAuthClient')" @click="submitRegister" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
