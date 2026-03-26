<script lang="ts" setup>
const { settings, editValues, overridableValues, saving, saveMultiple } = useAdminSettings()
const { t } = useI18n()

const tokenSettings = computed(() =>
  (settings.value ?? []).filter((s) => ['access_token_ttl_seconds', 'refresh_token_ttl_seconds'].includes(s.key))
)

const googleEnabled = computed(() => {
  const v = editValues.value['oauth.google.enabled']
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return ['true', '1', 'yes', 'on'].includes(v.toLowerCase())
  return Boolean(v)
})

const githubEnabled = computed(() => {
  const v = editValues.value['oauth.github.enabled']
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return ['true', '1', 'yes', 'on'].includes(v.toLowerCase())
  return Boolean(v)
})

const oauth2Enabled = computed(() => {
  const v = editValues.value['oauth.oauth2.enabled']
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return ['true', '1', 'yes', 'on'].includes(v.toLowerCase())
  return Boolean(v)
})

const GOOGLE_ORDER = ['oauth.google.enabled', 'oauth.google.client_id', 'oauth.google.client_secret']
const googleSettings = computed(() =>
  (settings.value ?? [])
    .filter((s) => GOOGLE_ORDER.includes(s.key))
    .sort((a, b) => GOOGLE_ORDER.indexOf(a.key) - GOOGLE_ORDER.indexOf(b.key))
)

const GITHUB_ORDER = ['oauth.github.enabled', 'oauth.github.client_id', 'oauth.github.client_secret']
const githubSettings = computed(() =>
  (settings.value ?? [])
    .filter((s) => GITHUB_ORDER.includes(s.key))
    .sort((a, b) => GITHUB_ORDER.indexOf(a.key) - GITHUB_ORDER.indexOf(b.key))
)

const oauth2Settings = computed(() => {
  const ORDER = [
    'oauth.oauth2.enabled',
    'oauth.oauth2.client_id',
    'oauth.oauth2.client_secret',
    'oauth.oauth2.authorization_url',
    'oauth.oauth2.token_url',
    'oauth.oauth2.userinfo_url',
    'oauth.oauth2.scopes'
  ]
  return (settings.value ?? [])
    .filter((s) => ORDER.includes(s.key))
    .sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key))
})

const TOKEN_KEYS = ['access_token_ttl_seconds', 'refresh_token_ttl_seconds']
const GOOGLE_KEYS = ['oauth.google.enabled', 'oauth.google.client_id', 'oauth.google.client_secret']
const GITHUB_KEYS = ['oauth.github.enabled', 'oauth.github.client_id', 'oauth.github.client_secret']
const OAUTH2_KEYS = [
  'oauth.oauth2.enabled',
  'oauth.oauth2.client_id',
  'oauth.oauth2.client_secret',
  'oauth.oauth2.authorization_url',
  'oauth.oauth2.token_url',
  'oauth.oauth2.userinfo_url',
  'oauth.oauth2.scopes'
]

const tokenSaving = computed(() => TOKEN_KEYS.some((k) => saving.value[k]))
const googleSaving = computed(() => GOOGLE_KEYS.some((k) => saving.value[k]))
const githubSaving = computed(() => GITHUB_KEYS.some((k) => saving.value[k]))
const oauth2Saving = computed(() => OAUTH2_KEYS.some((k) => saving.value[k]))

function isEmpty(v: unknown): boolean {
  if (v == null) return true
  if (typeof v === 'string') return !v.trim()
  return false
}

const googleMissingCreds = computed(
  () =>
    googleEnabled.value &&
    (isEmpty(editValues.value['oauth.google.client_id']) || isEmpty(editValues.value['oauth.google.client_secret']))
)
const githubMissingCreds = computed(
  () =>
    githubEnabled.value &&
    (isEmpty(editValues.value['oauth.github.client_id']) || isEmpty(editValues.value['oauth.github.client_secret']))
)
const oauth2MissingCreds = computed(
  () =>
    oauth2Enabled.value &&
    (isEmpty(editValues.value['oauth.oauth2.client_id']) ||
      isEmpty(editValues.value['oauth.oauth2.client_secret']) ||
      isEmpty(editValues.value['oauth.oauth2.authorization_url']) ||
      isEmpty(editValues.value['oauth.oauth2.token_url']) ||
      isEmpty(editValues.value['oauth.oauth2.userinfo_url']))
)
</script>

<template>
  <div class="flex flex-col gap-6 pt-4">
    <UAlert
      color="info"
      icon="i-lucide-shield"
      :title="t('admin.authentication')"
      :description="t('admin.authConfigDescription')"
      variant="subtle"
    />

    <!-- Token Security -->
    <UCard variant="soft">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-key-round" class="size-5 text-primary" />
          <p class="font-semibold text-sm">{{ t('admin.tokenSecurity') }}</p>
        </div>
      </template>
      <div class="flex flex-col divide-y divide-default">
        <SettingRow
          v-for="setting in tokenSettings"
          :key="setting.key"
          :setting="setting"
          :model-value="editValues[setting.key]"
          :overridable="overridableValues[setting.key] ?? false"
          :show-overridable-toggle="false"
          :saving="tokenSaving"
          :hide-save="true"
          @update:model-value="editValues[setting.key] = $event"
          @update:overridable="overridableValues[setting.key] = $event"
        />
      </div>
      <template #footer>
        <div class="flex justify-end">
          <ConfirmActionPopover
            label-key="common.save"
            size="sm"
            confirm-title-key="common.saveConfirmTitle"
            confirm-message-key="common.saveConfirmMessage"
            confirm-label-key="common.saveConfirmFriendly"
            :loading="tokenSaving"
            :on-confirm="() => saveMultiple(TOKEN_KEYS)"
          />
        </div>
      </template>
    </UCard>

    <!-- Google OAuth -->
    <UCard variant="soft">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-simple-icons-google" class="size-5 text-primary" />
          <p class="font-semibold text-sm">{{ t('admin.googleOAuth') }}</p>
        </div>
      </template>
      <UAlert
        v-if="googleMissingCreds"
        color="warning"
        icon="i-lucide-alert-triangle"
        :title="t('admin.authCredentialsRequired')"
        variant="subtle"
        class="mb-4"
      />
      <div class="flex flex-col divide-y divide-default">
        <SettingRow
          v-for="setting in googleSettings"
          v-show="setting.key === 'oauth.google.enabled' || googleEnabled"
          :key="setting.key"
          :setting="setting"
          :model-value="editValues[setting.key]"
          :overridable="overridableValues[setting.key] ?? false"
          :show-overridable-toggle="false"
          :saving="googleSaving"
          :hide-save="true"
          @update:model-value="editValues[setting.key] = $event"
          @update:overridable="overridableValues[setting.key] = $event"
        />
      </div>
      <template #footer>
        <div class="flex justify-end">
          <ConfirmActionPopover
            label-key="common.save"
            size="sm"
            confirm-title-key="common.saveConfirmTitle"
            confirm-message-key="common.saveConfirmMessage"
            confirm-label-key="common.saveConfirmFriendly"
            :loading="googleSaving"
            :on-confirm="() => saveMultiple(GOOGLE_KEYS)"
          />
        </div>
      </template>
    </UCard>

    <!-- GitHub OAuth -->
    <UCard variant="soft">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-simple-icons-github" class="size-5 text-primary" />
          <p class="font-semibold text-sm">{{ t('admin.githubOAuth') }}</p>
        </div>
      </template>
      <UAlert
        v-if="githubMissingCreds"
        color="warning"
        icon="i-lucide-alert-triangle"
        :title="t('admin.authCredentialsRequired')"
        variant="subtle"
        class="mb-4"
      />
      <div class="flex flex-col divide-y divide-default">
        <SettingRow
          v-for="setting in githubSettings"
          v-show="setting.key === 'oauth.github.enabled' || githubEnabled"
          :key="setting.key"
          :setting="setting"
          :model-value="editValues[setting.key]"
          :overridable="overridableValues[setting.key] ?? false"
          :show-overridable-toggle="false"
          :saving="githubSaving"
          :hide-save="true"
          @update:model-value="editValues[setting.key] = $event"
          @update:overridable="overridableValues[setting.key] = $event"
        />
      </div>
      <template #footer>
        <div class="flex justify-end">
          <ConfirmActionPopover
            label-key="common.save"
            size="sm"
            confirm-title-key="common.saveConfirmTitle"
            confirm-message-key="common.saveConfirmMessage"
            confirm-label-key="common.saveConfirmFriendly"
            :loading="githubSaving"
            :on-confirm="() => saveMultiple(GITHUB_KEYS)"
          />
        </div>
      </template>
    </UCard>

    <!-- Generic OAuth2 -->
    <UCard variant="soft">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-key-round" class="size-5 text-primary" />
          <p class="font-semibold text-sm">{{ t('admin.genericOAuth2') }}</p>
        </div>
      </template>
      <UAlert
        v-if="oauth2MissingCreds"
        color="warning"
        icon="i-lucide-alert-triangle"
        :title="t('admin.authCredentialsRequired')"
        variant="subtle"
        class="mb-4"
      />
      <div class="flex flex-col divide-y divide-default">
        <SettingRow
          v-for="setting in oauth2Settings"
          v-show="setting.key === 'oauth.oauth2.enabled' || oauth2Enabled"
          :key="setting.key"
          :setting="setting"
          :model-value="editValues[setting.key]"
          :overridable="overridableValues[setting.key] ?? false"
          :show-overridable-toggle="false"
          :saving="oauth2Saving"
          :hide-save="true"
          @update:model-value="editValues[setting.key] = $event"
          @update:overridable="overridableValues[setting.key] = $event"
        />
      </div>
      <template #footer>
        <div class="flex justify-end">
          <ConfirmActionPopover
            label-key="common.save"
            size="sm"
            confirm-title-key="common.saveConfirmTitle"
            confirm-message-key="common.saveConfirmMessage"
            confirm-label-key="common.saveConfirmFriendly"
            :loading="oauth2Saving"
            :on-confirm="() => saveMultiple(OAUTH2_KEYS)"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
