<script lang="ts" setup>
import * as z from 'zod'
import type { CalendarDate, CalendarDateTime } from '@internationalized/date'
import { getLocalTimeZone, now, toCalendarDate, toCalendarDateTime, toTime, toZoned } from '@internationalized/date'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { AboutMeResponse, AdminRoleResponse, ApiKeyCreatedResponse, ApiKeyListItem } from '~/types'
import { formatDate, getApiErrorMessage } from '~/utils'

function calendarDateTimeToIsoUtc(cdt: CalendarDateTime): string {
  return toZoned(cdt, getLocalTimeZone()).toDate().toISOString()
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function isApiKeyExpired(iso: string | null | undefined): boolean {
  if (!iso) return false
  const d = new Date(iso)
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now()
}

const toast = useToast()
const { t } = useI18n()
const { withOverlay } = useLoadingOverlay()

const { data: me, refresh: refreshMe } = await useApiFetch<AboutMeResponse>('/api/me')

const { data: adminRoles, pending: loadingAdminRoles } = await useApiFetch<AdminRoleResponse[]>(() => (me.value?.is_sys_admin ? '/api/admin/roles' : null), {
  watch: [() => me.value?.is_sys_admin],
  default: () => []
})

const roleTabItems = computed(() => {
  const roles = adminRoles.value ?? []
  return roles.map((r) => ({
    label: r.name,
    value: r.id,
    icon: r.scope === 'system' ? 'i-lucide-shield' : 'i-lucide-building-2',
    slot: 'role',
    badge: r.scope === 'system' ? 'SYS' : 'ORG',
    role: r
  }))
})

const selectedRoleId = ref<string>('')

watch(
  () => adminRoles.value,
  (roles) => {
    if (!roles?.length) {
      selectedRoleId.value = ''
      return
    }
    if (!selectedRoleId.value || !roles.some((r) => r.id === selectedRoleId.value)) {
      selectedRoleId.value = roles[0].id
    }
  },
  { immediate: true }
)

const tabs = computed(() => {
  const items: { label: string; slot: string; icon: string }[] = [{ label: t('profile.tabProfile'), slot: 'profile', icon: 'i-lucide-user' }]
  if (me.value?.is_sys_admin) {
    items.push({ label: t('profile.tabApiKeys'), slot: 'api-keys', icon: 'i-lucide-key' })
  }
  return items
})

// --- Profile edit form ---
const profileSchema = z.object({
  display_name: z.string().max(255).optional(),
  email: z
    .string()
    .email({ error: () => t('common.invalidEmail') })
    .or(z.literal(''))
    .optional(),
  avatar_url: z.string().max(2048).optional(),
  locale: z.string().max(64).optional(),
  timezone: z.string().max(128).optional(),
  bio: z.string().max(4096).optional()
})
type ProfileSchema = z.output<typeof profileSchema>

const profileState = reactive<Partial<ProfileSchema>>({
  display_name: me.value?.display_name ?? '',
  email: me.value?.email ?? '',
  avatar_url: me.value?.avatar_url ?? '',
  locale: me.value?.locale ?? '',
  timezone: me.value?.timezone ?? '',
  bio: me.value?.bio ?? ''
})

watch(
  () => me.value,
  (m) => {
    if (!m) return
    profileState.display_name = m.display_name ?? ''
    profileState.email = m.email ?? ''
    profileState.avatar_url = m.avatar_url ?? ''
    profileState.locale = m.locale ?? ''
    profileState.timezone = m.timezone ?? ''
    profileState.bio = m.bio ?? ''
  },
  { immediate: true }
)

const savingProfile = ref(false)
const profileFormRef = ref<{ $el?: { requestSubmit?: () => void } } | null>(null)

async function onProfileSubmit(event: FormSubmitEvent<ProfileSchema>) {
  savingProfile.value = true
  try {
    await withOverlay(async () => {
      await $fetch('/api/me/profile', {
        method: 'PATCH',
        body: {
          display_name: event.data.display_name || null,
          email: event.data.email || null,
          avatar_url: event.data.avatar_url || null,
          locale: event.data.locale || null,
          timezone: event.data.timezone || null,
          bio: event.data.bio || null
        }
      })
      await refreshMe()
      toast.add({ title: t('profile.profileUpdated'), icon: 'i-lucide-check', color: 'success' })
    })
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, t('profile.failedSaveProfile'))
    toast.add({ title: msg, color: 'error' })
  } finally {
    savingProfile.value = false
  }
}

// --- API keys (sys_admin tab) ---
const apiKeys = ref<ApiKeyListItem[] | null>(null)
const loadingKeys = ref(false)

async function loadApiKeys() {
  if (!me.value?.is_sys_admin) return
  loadingKeys.value = true
  try {
    apiKeys.value = await $fetch<ApiKeyListItem[]>('/api/admin/users/api-keys')
  } catch (err: unknown) {
    toast.add({ title: getApiErrorMessage(err, t('profile.apiKeysLoadFailed')), color: 'error' })
  } finally {
    loadingKeys.value = false
  }
}

onMounted(() => {
  if (me.value?.is_sys_admin) void loadApiKeys()
})

watch(
  () => me.value?.is_sys_admin,
  (v) => {
    if (v) void loadApiKeys()
  }
)

const createKeyName = ref('')
/** `null` = no expiry (Nuxt UI UInputDate + @internationalized/date) */
const createKeyExpiresAt = shallowRef<CalendarDateTime | null>(null)
const minApiKeyExpiry = computed(() => now(getLocalTimeZone()))
/** Calendar popover: date part only; time stays from existing value or “now”. */
const calendarPickerDate = computed({
  get(): CalendarDate {
    const v = createKeyExpiresAt.value
    if (v) return toCalendarDate(v)
    return toCalendarDate(now(getLocalTimeZone()))
  },
  set(d: CalendarDate) {
    const prev = createKeyExpiresAt.value
    const time = prev ? toTime(prev) : toTime(now(getLocalTimeZone()))
    createKeyExpiresAt.value = toCalendarDateTime(d, time)
  }
})
const minExpiryCalendarDate = computed(() => toCalendarDate(minApiKeyExpiry.value))
const apiKeyExpiryInputDate = useTemplateRef<{ inputsRef?: { value?: Array<{ $el?: HTMLElement }> } }>('apiKeyExpiryInputDate')
const apiKeyExpiryPopoverReference = computed(() => apiKeyExpiryInputDate.value?.inputsRef?.value?.[0]?.$el)
const creatingKey = ref(false)
const rawKeyModalOpen = ref(false)
const lastCreatedRawKey = ref<string | null>(null)
const revokingId = ref<string | null>(null)

function resolveCreateScopes(): string[] {
  const roles = adminRoles.value ?? []
  const role = roles.find((r) => r.id === selectedRoleId.value)
  return role ? [...role.permissions] : []
}

async function onCreateApiKey() {
  const name = createKeyName.value.trim()
  if (!name) {
    toast.add({ title: t('common.required'), color: 'error' })
    return
  }
  const scopes = resolveCreateScopes()
  if (scopes.length === 0) {
    toast.add({ title: t('profile.apiKeysScopesRequired'), color: 'error' })
    return
  }
  creatingKey.value = true
  try {
    await withOverlay(async () => {
      const body: { name: string; scopes: string[]; expires_at?: string } = { name, scopes }
      if (createKeyExpiresAt.value) {
        body.expires_at = calendarDateTimeToIsoUtc(createKeyExpiresAt.value)
      }
      const created = await $fetch<ApiKeyCreatedResponse>('/api/admin/users/api-keys', {
        method: 'POST',
        body
      })
      lastCreatedRawKey.value = created.raw_key
      rawKeyModalOpen.value = true
      createKeyName.value = ''
      createKeyExpiresAt.value = null
      await loadApiKeys()
      toast.add({ title: t('profile.apiKeysCreated'), icon: 'i-lucide-check', color: 'success' })
    })
  } catch (err: unknown) {
    toast.add({ title: getApiErrorMessage(err, t('profile.apiKeysCreateFailed')), color: 'error' })
  } finally {
    creatingKey.value = false
  }
}

async function revokeApiKey(keyId: string) {
  revokingId.value = keyId
  try {
    await withOverlay(async () => {
      await $fetch(`/api/admin/users/api-keys/${keyId}`, { method: 'DELETE' })
      await loadApiKeys()
      toast.add({ title: t('profile.apiKeysRevoked'), icon: 'i-lucide-check', color: 'success' })
    })
  } catch (err: unknown) {
    toast.add({ title: getApiErrorMessage(err, t('profile.apiKeysRevokeFailed')), color: 'error' })
  } finally {
    revokingId.value = null
  }
}

async function copyRawKey() {
  const text = lastCreatedRawKey.value
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: t('profile.apiKeysCopied'), icon: 'i-lucide-check', color: 'success' })
  } catch {
    toast.add({ title: t('profile.apiKeysCopyFailed'), color: 'error' })
  }
}

function closeRawKeyModal() {
  rawKeyModalOpen.value = false
  lastCreatedRawKey.value = null
}

const apiKeyColumns = computed(() => [
  { accessorKey: 'name', header: t('profile.apiKeysName') },
  { accessorKey: 'key_prefix', header: t('profile.apiKeysPrefix') },
  { id: 'scopes' },
  { accessorKey: 'expires_at', header: t('profile.apiKeysExpiresAtCol') },
  { accessorKey: 'last_used_at', header: t('profile.apiKeysLastUsedCol') },
  { accessorKey: 'created_at', header: t('profile.apiKeysCreatedAtCol') },
  { accessorKey: 'is_active', header: t('profile.apiKeysStatusCol') },
  { id: 'actions' }
])

// --- API key usage examples (same pattern as settings/central-points/[id].vue) ---
const apiKeysBaseUrl = ref('https://your-instance.com')
onMounted(() => {
  if (import.meta.client) {
    apiKeysBaseUrl.value = window.location.origin
  }
})

const apiKeyCodeTabs = [
  { label: 'cURL', slot: 'curl' },
  { label: 'Python', slot: 'python' },
  { label: 'JavaScript', slot: 'js' },
  { label: 'TypeScript', slot: 'ts' },
  { label: 'Go', slot: 'go' }
]

const API_KEY_PLACEHOLDER = 'YOUR_API_KEY'

const apiKeyExampleCurl = computed(
  () => `curl -sS '${apiKeysBaseUrl.value}/api/me' \\
  -H 'X-API-KEY: ${API_KEY_PLACEHOLDER}'`
)

const apiKeyExamplePython = computed(
  () => `import requests

response = requests.get(
    '${apiKeysBaseUrl.value}/api/me',
    headers={'X-API-KEY': '${API_KEY_PLACEHOLDER}'},
)
response.raise_for_status()
print(response.json())`
)

const apiKeyExampleJs = computed(
  () => `const response = await fetch('${apiKeysBaseUrl.value}/api/me', {
  headers: { 'X-API-KEY': '${API_KEY_PLACEHOLDER}' },
});
if (!response.ok) throw new Error(await response.text());
console.log(await response.json());`
)

const apiKeyExampleTs = computed(
  () => `const response = await fetch('${apiKeysBaseUrl.value}/api/me', {
  headers: { 'X-API-KEY': '${API_KEY_PLACEHOLDER}' },
});
if (!response.ok) throw new Error(await response.text());
const data: unknown = await response.json();
console.log(data);`
)

const apiKeyExampleGo = computed(
  () => `package main

import (
\t"fmt"
\t"io"
\t"net/http"
)

func main() {
\treq, _ := http.NewRequest("GET", "${apiKeysBaseUrl.value}/api/me", nil)
\treq.Header.Set("X-API-KEY", "${API_KEY_PLACEHOLDER}")

\tresp, err := http.DefaultClient.Do(req)
\tif err != nil {
\t\tpanic(err)
\t}
\tdefer resp.Body.Close()
\tbody, _ := io.ReadAll(resp.Body)
\tfmt.Println(string(body))
}`
)

async function copyApiKeySample(text: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    toast.add({ title: t('centralPoints.copiedToClipboard'), icon: 'i-lucide-check', color: 'success' })
  } catch {
    toast.add({ title: t('centralPoints.failedCopy'), color: 'error' })
  }
}
</script>

<template>
  <div class="min-w-0 flex-1 flex flex-col overflow-hidden">
    <UDashboardPanel id="profile">
      <template #header>
        <UDashboardNavbar :title="t('profile.title')">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <InfoPopover title-key="info.pages.profile.title" description-key="info.pages.profile.description" />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="pt-2 pl-6 pr-6 pr-6 flex flex-col gap-2">
          <UTabs :items="tabs" variant="link" :unmount-on-hide="false">
            <template #profile>
              <div class="flex flex-col gap-8">
                <!-- Read-only account info -->
                <UCard variant="soft">
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

                <!-- Contact, display & profile details (single form) -->
                <UCard variant="soft">
                  <template #header>
                    <p class="font-semibold">{{ t('profile.editProfile') }}</p>
                  </template>
                  <UForm ref="profileFormRef" :schema="profileSchema" :state="profileState" class="flex flex-col gap-6" @submit="onProfileSubmit">
                    <div class="flex flex-col gap-4">
                      <p class="text-sm font-medium text-dimmed">{{ t('profile.contactAndDisplay') }}</p>
                      <UFormField :label="t('profile.displayName')" name="display_name">
                        <UInput v-model="profileState.display_name" class="w-full" :placeholder="t('profile.yourName')" />
                      </UFormField>
                      <UFormField :label="t('profile.email')" name="email">
                        <UInput v-model="profileState.email" class="w-full" :placeholder="t('profile.emailPlaceholder')" type="email" />
                      </UFormField>
                    </div>
                    <USeparator />
                    <div class="flex flex-col gap-4">
                      <p class="text-sm font-medium text-dimmed">{{ t('profile.profileDetails') }}</p>
                      <UFormField :label="t('profile.avatarUrl')" name="avatar_url">
                        <UInput v-model="profileState.avatar_url" class="w-full" :placeholder="t('profile.avatarUrlPlaceholder')" />
                      </UFormField>
                      <UFormField :label="t('profile.locale')" name="locale">
                        <UInput v-model="profileState.locale" class="w-full" :placeholder="t('profile.localePlaceholder')" />
                      </UFormField>
                      <UFormField :label="t('profile.timezone')" name="timezone">
                        <UInput v-model="profileState.timezone" class="w-full" :placeholder="t('profile.timezonePlaceholder')" />
                      </UFormField>
                      <UFormField :label="t('profile.bio')" name="bio">
                        <UTextarea v-model="profileState.bio" class="w-full" :rows="4" :placeholder="t('profile.bioPlaceholder')" autoresize />
                      </UFormField>
                    </div>
                    <div class="flex justify-end">
                      <ConfirmActionPopover
                        label-key="common.update"
                        confirm-title-key="common.updateConfirmTitle"
                        confirm-message-key="common.updateConfirmMessage"
                        confirm-label-key="common.updateConfirmFriendly"
                        :loading="savingProfile"
                        :on-confirm="() => profileFormRef?.$el?.requestSubmit?.()"
                      />
                    </div>
                  </UForm>
                </UCard>
              </div>
            </template>

            <template #api-keys>
              <div class="flex flex-col gap-6">
                <UCard variant="soft">
                  <template #header>
                    <div class="flex items-center gap-2">
                      <UIcon name="i-lucide-key-round" class="text-primary size-5 shrink-0" />
                      <div>
                        <p class="font-semibold">{{ t('profile.apiKeysAuthInfoTitle') }}</p>
                      </div>
                    </div>
                  </template>
                  <div class="flex flex-col gap-4">
                    <div class="rounded-lg border border-default p-3 space-y-3">
                      <p class="text-xs font-semibold text-dimmed uppercase tracking-wide">{{ t('profile.apiKeysAuthHeadersTitle') }}</p>
                      <div class="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
                        <code class="text-xs font-mono text-primary shrink-0">X-API-KEY</code>
                        <span class="text-xs text-dimmed">{{ t('profile.apiKeysHeaderXApiKeyDesc') }}</span>
                      </div>
                      <div class="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
                        <code class="text-xs font-mono text-primary shrink-0">Authorization</code>
                        <span class="text-xs text-dimmed">{{ t('profile.apiKeysHeaderBearerDesc') }}</span>
                      </div>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-default mb-1">{{ t('profile.apiKeysCodeExamples') }}</p>
                      <p class="text-xs text-dimmed mb-3">{{ t('profile.apiKeysCodeExamplesHint') }}</p>
                      <div class="flex flex-wrap items-center gap-2 mb-2">
                        <UBadge color="info" size="sm" variant="subtle">GET</UBadge>
                        <code class="font-mono text-xs text-dimmed break-all">{{ apiKeysBaseUrl }}/api/me</code>
                      </div>
                      <UTabs :items="apiKeyCodeTabs" variant="link">
                        <template #curl>
                          <div class="relative mt-3">
                            <pre
                              class="overflow-x-auto rounded-lg bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100 dark:bg-neutral-900"
                            ><code>{{ apiKeyExampleCurl }}</code></pre>
                            <UButton
                              class="absolute right-2 top-2"
                              color="neutral"
                              icon="i-lucide-copy"
                              size="xs"
                              @click="copyApiKeySample(apiKeyExampleCurl)"
                            />
                          </div>
                        </template>
                        <template #python>
                          <div class="relative mt-3">
                            <pre
                              class="overflow-x-auto rounded-lg bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100 dark:bg-neutral-900"
                            ><code>{{ apiKeyExamplePython }}</code></pre>
                            <UButton
                              class="absolute right-2 top-2"
                              color="neutral"
                              icon="i-lucide-copy"
                              size="xs"
                              @click="copyApiKeySample(apiKeyExamplePython)"
                            />
                          </div>
                        </template>
                        <template #js>
                          <div class="relative mt-3">
                            <pre
                              class="overflow-x-auto rounded-lg bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100 dark:bg-neutral-900"
                            ><code>{{ apiKeyExampleJs }}</code></pre>
                            <UButton class="absolute right-2 top-2" color="neutral" icon="i-lucide-copy" size="xs" @click="copyApiKeySample(apiKeyExampleJs)" />
                          </div>
                        </template>
                        <template #ts>
                          <div class="relative mt-3">
                            <pre
                              class="overflow-x-auto rounded-lg bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100 dark:bg-neutral-900"
                            ><code>{{ apiKeyExampleTs }}</code></pre>
                            <UButton class="absolute right-2 top-2" color="neutral" icon="i-lucide-copy" size="xs" @click="copyApiKeySample(apiKeyExampleTs)" />
                          </div>
                        </template>
                        <template #go>
                          <div class="relative mt-3">
                            <pre
                              class="overflow-x-auto rounded-lg bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100 dark:bg-neutral-900"
                            ><code>{{ apiKeyExampleGo }}</code></pre>
                            <UButton class="absolute right-2 top-2" color="neutral" icon="i-lucide-copy" size="xs" @click="copyApiKeySample(apiKeyExampleGo)" />
                          </div>
                        </template>
                      </UTabs>
                    </div>
                  </div>
                </UCard>

                <UCard variant="soft">
                  <template #header>
                    <p class="font-semibold">{{ t('profile.apiKeysCreateTitle') }}</p>
                    <p class="text-dimmed text-sm mt-1">{{ t('profile.apiKeysCreateDescription') }}</p>
                  </template>
                  <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-2">
                      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
                        <UFormField :label="t('profile.apiKeysName')" class="min-w-0">
                          <UInput v-model="createKeyName" class="w-full" :placeholder="t('profile.apiKeysNamePlaceholder')" />
                        </UFormField>
                        <UFormField :label="t('profile.apiKeysExpiresAtOptional')" class="min-w-0">
                          <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-2">
                            <UInputDate
                              ref="apiKeyExpiryInputDate"
                              v-model="createKeyExpiresAt"
                              granularity="minute"
                              :min-value="minApiKeyExpiry"
                              class="w-full min-w-0 sm:flex-1"
                            >
                              <template #trailing>
                                <UPopover :reference="apiKeyExpiryPopoverReference" :content="{ side: 'bottom', align: 'end', collisionPadding: 16 }">
                                  <UButton
                                    color="neutral"
                                    variant="link"
                                    size="sm"
                                    icon="i-lucide-calendar"
                                    :aria-label="t('profile.apiKeysPickExpiryDate')"
                                    class="px-0"
                                  />
                                  <template #content>
                                    <UCalendar v-model="calendarPickerDate" class="p-2" :min-value="minExpiryCalendarDate" />
                                  </template>
                                </UPopover>
                              </template>
                            </UInputDate>
                            <UButton
                              v-if="createKeyExpiresAt"
                              color="neutral"
                              variant="soft"
                              size="sm"
                              class="shrink-0 self-start sm:self-auto"
                              :label="t('common.clear')"
                              @click="createKeyExpiresAt = null"
                            />
                          </div>
                        </UFormField>
                      </div>
                      <p class="text-xs text-dimmed">{{ t('profile.apiKeysExpiresAtOptionalHint') }}</p>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-dimmed mb-2">{{ t('profile.apiKeysRoleScopesTitle') }}</p>
                      <p class="text-dimmed text-sm mb-3">{{ t('profile.apiKeysRolesDescription') }}</p>
                      <div v-if="loadingAdminRoles && !adminRoles?.length" class="flex flex-col gap-2 py-2">
                        <USkeleton v-for="n in 3" :key="n" class="h-9 w-full" />
                      </div>
                      <UAlert v-else-if="!roleTabItems.length" color="neutral" variant="subtle" :title="t('profile.apiKeysNoRoles')" />
                      <UTabs v-else v-model="selectedRoleId" :items="roleTabItems" variant="link" :unmount-on-hide="false">
                        <template #role="{ item }">
                          <div class="flex flex-col gap-3 pt-3">
                            <p class="text-sm text-dimmed">
                              {{ item.role.description || t('common.empty') }}
                            </p>
                            <div v-if="item.role.permissions?.length" class="flex flex-wrap gap-1">
                              <UBadge v-for="p in item.role.permissions" :key="p" size="md" variant="subtle">
                                {{ p }}
                              </UBadge>
                            </div>
                            <p v-else class="text-sm text-warning">{{ t('profile.apiKeysRoleNoPermissions') }}</p>
                            <p class="text-xs text-dimmed">{{ t('profile.apiKeysRoleScopesHint') }}</p>
                          </div>
                        </template>
                      </UTabs>
                    </div>
                    <div class="flex justify-end">
                      <UButton color="primary" :loading="creatingKey" icon="i-lucide-plus" @click="onCreateApiKey">
                        {{ t('profile.apiKeysCreate') }}
                      </UButton>
                    </div>
                  </div>
                </UCard>

                <UCard variant="soft">
                  <template #header>
                    <p class="font-semibold">{{ t('profile.apiKeysListTitle') }}</p>
                  </template>
                  <div v-if="loadingKeys && !apiKeys" class="flex flex-col gap-2 p-4">
                    <USkeleton v-for="n in 4" :key="n" class="h-10 w-full" />
                  </div>
                  <UTable
                    v-else
                    :columns="apiKeyColumns"
                    :data="apiKeys ?? []"
                    :empty-state="{ icon: 'i-lucide-key-round', label: t('profile.apiKeysEmpty') }"
                    class="w-full"
                  >
                    <template #scopes-cell="{ row }">
                      <div class="flex flex-wrap gap-1 max-w-md">
                        <UBadge v-for="s in row.original.scopes" :key="s" size="xs" variant="subtle">
                          {{ s }}
                        </UBadge>
                      </div>
                    </template>
                    <template #expires_at-cell="{ row }">
                      <span class="text-sm text-dimmed">
                        <template v-if="row.original.expires_at">
                          {{ formatDateTime(row.original.expires_at) }}
                          <UBadge v-if="isApiKeyExpired(row.original.expires_at)" class="ml-2" color="error" size="sm" variant="subtle">
                            {{ t('profile.apiKeysExpiredBadge') }}
                          </UBadge>
                        </template>
                        <template v-else>
                          {{ t('profile.apiKeysNeverExpires') }}
                        </template>
                      </span>
                    </template>
                    <template #last_used_at-cell="{ row }">
                      <span class="text-sm text-dimmed">
                        {{ row.original.last_used_at ? formatDateTime(row.original.last_used_at) : t('profile.apiKeysNeverUsed') }}
                      </span>
                    </template>
                    <template #created_at-cell="{ row }">
                      <span class="text-sm text-dimmed">
                        {{ row.original.created_at ? formatDate(row.original.created_at) : t('common.empty') }}
                      </span>
                    </template>
                    <template #is_active-cell="{ row }">
                      <UBadge
                        :color="isApiKeyExpired(row.original.expires_at) ? 'error' : row.original.is_active ? 'success' : 'neutral'"
                        size="sm"
                        variant="subtle"
                      >
                        {{
                          isApiKeyExpired(row.original.expires_at)
                            ? t('profile.apiKeysExpiredBadge')
                            : row.original.is_active
                              ? t('profile.apiKeysActive')
                              : t('profile.apiKeysInactive')
                        }}
                      </UBadge>
                    </template>
                    <template #actions-cell="{ row }">
                      <ConfirmActionPopover
                        label-key="profile.apiKeysRevoke"
                        color="error"
                        confirm-title-key="profile.apiKeysRevokeConfirmTitle"
                        confirm-message-key="profile.apiKeysRevokeConfirmMessage"
                        confirm-label-key="profile.apiKeysRevoke"
                        confirm-color="error"
                        :loading="revokingId === row.original.id"
                        :on-confirm="() => revokeApiKey(row.original.id)"
                      />
                    </template>
                  </UTable>
                </UCard>
              </div>
            </template>
          </UTabs>
        </div>
      </template>
    </UDashboardPanel>

    <UModal
      v-model:open="rawKeyModalOpen"
      :title="t('profile.apiKeysRawKeyTitle')"
      :ui="{ content: 'sm:max-w-lg' }"
      @update:open="(v) => !v && closeRawKeyModal()"
    >
      <template #content>
        <div class="flex flex-col gap-4 p-4 sm:p-6">
          <UAlert color="warning" variant="subtle" :title="t('profile.apiKeysRawKeyWarning')" />
          <div class="flex flex-col gap-2">
            <p class="text-sm text-dimmed">{{ t('profile.apiKeysRawKeyDescription') }}</p>
            <div class="flex gap-2 items-stretch">
              <UInput :model-value="lastCreatedRawKey || ''" readonly class="flex-1 font-mono text-sm" />
              <UButton color="secondary" icon="i-lucide-copy" @click="copyRawKey">
                {{ t('profile.apiKeysCopy') }}
              </UButton>
            </div>
          </div>
          <div class="flex justify-end pt-2">
            <UButton color="primary" @click="closeRawKeyModal">{{ t('profile.apiKeysDone') }}</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
