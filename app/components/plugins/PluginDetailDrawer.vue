<script lang="ts" setup>
import type { PluginMetadataResponse, PluginSettingSchema, SystemPluginResponse } from '~/types'

type PluginVersionItem = PluginMetadataResponse | SystemPluginResponse

const props = withDefaults(
  defineProps<{
    open: boolean
    pid: string
    source: 'system' | 'org'
    orgId?: string
    allowDisable?: boolean
    isAdminContext?: boolean
  }>(),
  { orgId: '', allowDisable: false, isAdminContext: false }
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: []
  closed: []
}>()

const { t } = useI18n()
const auth = useAuth()
const toast = useToast()
const { withOverlay } = useLoadingOverlay()
const orgId = computed(() => props.orgId || auth.currentOrgId.value || '')

const pidRef = computed(() => props.pid)
const sourceRef = computed(() => props.source)
const { versions, loading, error, fetchVersions } = usePluginVersions(
  pidRef,
  sourceRef,
  orgId,
  computed(() => props.isAdminContext)
)

const selectedVersion = ref<PluginVersionItem | null>(null)
const versionOptions = computed(() =>
  versions.value.map((v) => ({
    label: `v${v.version}`,
    value: v.version
  }))
)

const selectedVersionOption = computed({
  get: () => selectedVersion.value?.version ?? '',
  set: (val: string) => {
    const found = versions.value.find((v) => v.version === val)
    selectedVersion.value = found ?? null
  }
})

const pluginAvatarSrc = computed(() => {
  const logo = selectedVersion.value?.logo_image
  if (!logo) return null
  return `data:image/png;base64,${logo}`
})

const pluginInitial = computed(() => selectedVersion.value?.name?.charAt(0)?.toUpperCase() ?? '?')

const pluginTypeLabel = computed(() => {
  const v = selectedVersion.value as { is_specialized?: boolean; is_scoped?: boolean } | null
  if (!v) return ''
  const types: string[] = []
  if (v.is_specialized) types.push('specialized')
  if (v.is_scoped) types.push('scoped')
  return types.length > 0 ? types.join(', ') : '—'
})

const storedSettingsSchema = computed(() => (selectedVersion.value as { settings_schema?: PluginSettingSchema[] })?.settings_schema ?? [])

const configRows = computed(() => {
  const versionDefaults =
    selectedVersion.value?.default_settings && typeof selectedVersion.value.default_settings === 'object'
      ? (selectedVersion.value.default_settings as Record<string, unknown>)
      : {}

  if (storedSettingsSchema.value.length > 0) {
    return storedSettingsSchema.value.map((schema) => {
      const versionValue = versionDefaults[schema.key]
      const displayValue =
        versionValue !== null && versionValue !== undefined
          ? String(versionValue)
          : schema.default !== null && schema.default !== undefined
            ? String(schema.default)
            : t('common.empty')
      return {
        key: schema.key,
        name: schema.name || schema.key,
        type: schema.type,
        default: displayValue,
        description: schema.description || t('common.empty'),
        required: schema.required ? t('pluginDetail.yes') : t('pluginDetail.no'),
        sensitive: schema.sensitive ? t('pluginDetail.yes') : t('pluginDetail.no')
      }
    })
  }

  return Object.entries(versionDefaults).map(([key, value]) => ({
    key,
    name: key,
    type: t('common.empty'),
    default: value === null || value === undefined ? t('common.empty') : String(value),
    description: t('common.empty'),
    required: t('common.empty'),
    sensitive: t('common.empty')
  }))
})

async function onOpenChange(isOpen: boolean) {
  emit('update:open', isOpen)
  if (!isOpen) {
    selectedVersion.value = null
    return
  }
  await fetchVersions()
  if (versions.value.length > 0) {
    const latest = versions.value.find((v) => v.is_latest === true)
    selectedVersion.value = latest ?? versions.value[0] ?? null
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) onOpenChange(true)
  },
  { immediate: true }
)

function closeDrawer() {
  emit('update:open', false)
  emit('close')
}

function handleOpenChange(value: boolean) {
  onOpenChange(value)
  emit('update:open', value)
}

const disabling = ref(false)
const enabling = ref(false)

async function disablePlugin() {
  if (!selectedVersion.value) return
  const id = selectedVersion.value.id
  disabling.value = true
  try {
    await withOverlay(async () => {
      if (props.source === 'system') {
        await $fetch(`/api/admin/plugins/${id}`, { method: 'DELETE' })
      } else {
        await $fetch(`/api/orgs/${orgId.value}/plugins/${id}`, {
          method: 'DELETE'
        })
      }
      toast.add({ title: t('pluginDetail.pluginDisabled'), icon: 'i-lucide-check' })
      closeDrawer()
    })
  } catch {
    toast.add({ title: t('pluginDetail.failedDisable'), color: 'error' })
  } finally {
    disabling.value = false
  }
}

async function enablePlugin() {
  if (!selectedVersion.value) return
  const id = selectedVersion.value.id
  enabling.value = true
  try {
    await withOverlay(async () => {
      if (props.source === 'system') {
        await $fetch(`/api/admin/plugins/${id}`, {
          method: 'PATCH',
          body: { enabled: true }
        })
      } else {
        await $fetch(`/api/orgs/${orgId.value}/plugins/${id}`, {
          method: 'PATCH',
          body: { enabled: true }
        })
      }
      toast.add({ title: t('pluginDetail.pluginEnabled'), icon: 'i-lucide-check' })
      closeDrawer()
    })
  } catch {
    toast.add({ title: t('pluginDetail.failedEnable'), color: 'error' })
  } finally {
    enabling.value = false
  }
}

const canManage = computed(() => props.allowDisable)
const isDisabled = computed(() => selectedVersion.value && 'enabled' in selectedVersion.value && selectedVersion.value.enabled === false)

async function handleEnableConfirm(close: () => void) {
  await enablePlugin()
  close()
}

async function handleDisableConfirm(close: () => void) {
  await disablePlugin()
  close()
}
</script>

<template>
  <USlideover
    :overlay="true"
    :open="open"
    :title="t('pluginDetail.title')"
    side="top"
    close-icon="i-lucide-arrow-up"
    @update:open="handleOpenChange"
    @after:leave="emit('closed')"
  >
    <template #body>
      <div class="flex flex-col h-full space-y-4">
        <div v-if="loading" class="flex justify-center py-8">
          <UIcon class="size-8 animate-spin text-dimmed" name="i-lucide-loader-2" />
        </div>

        <UAlert v-else-if="error" color="error" :description="error.message" :title="t('pluginDetail.failedToLoad')" />

        <template v-else-if="selectedVersion">
          <div :key="selectedVersion.id" class="flex flex-col gap-4">
            <div class="flex items-center gap-3">
              <div
                v-if="pluginAvatarSrc"
                class="size-36 shrink-0 rounded-2xl overflow-hidden bg-neutral-50 hover:bg-neutral-200 p-4 hover:-translate-y-0.6 transition-all duration-300"
              >
                <img :alt="selectedVersion.name" :src="pluginAvatarSrc" class="size-full object-cover" />
              </div>
              <UAvatar v-else :alt="selectedVersion.name" :text="pluginInitial" class="size-36 shrink-0 p-4" size="xl" />
              <div class="min-w-0 flex-1">
                <p class="font-medium text-dimmed text-xs mb-0.5">{{ t('pluginDetail.titleLabel') }}</p>
                <p class="font-semibold">{{ selectedVersion.name }}</p>
                <p class="font-medium text-dimmed text-xs mt-2 mb-0.5">{{ t('pluginDetail.namePid') }}</p>
                <p class="text-sm">{{ selectedVersion.pid }}</p>
                <p class="font-medium text-dimmed text-xs mt-2 mb-1">{{ t('pluginDetail.version') }}</p>
                <USelect
                  v-model="selectedVersionOption"
                  :items="versionOptions"
                  label-key="label"
                  :placeholder="t('pluginDetail.select')"
                  value-key="value"
                  size="xs"
                  class="w-28"
                />
                <div class="flex flex-wrap gap-1 mt-1">
                  <UBadge v-if="selectedVersion.is_latest" color="success" size="xs" variant="subtle">{{ t('pluginDetail.latest') }}</UBadge>
                  <UBadge
                    v-if="'enabled' in selectedVersion && selectedVersion.enabled !== undefined"
                    :color="selectedVersion.enabled ? 'success' : 'neutral'"
                    size="xs"
                    variant="subtle"
                  >
                    {{ selectedVersion.enabled ? t('plugins.enabled') : t('plugins.disabled') }}
                  </UBadge>
                  <UBadge color="neutral" size="xs" variant="subtle"> v{{ selectedVersion.version }} </UBadge>
                </div>
              </div>
            </div>
          </div>

          <div class="text-sm">
            <p class="font-medium text-dimmed mb-1">{{ t('pluginDetail.description') }}</p>
            <p>{{ selectedVersion.description || t('common.empty') }}</p>
          </div>

          <div v-if="selectedVersion.tag" class="text-sm">
            <p class="font-medium text-dimmed mb-1">{{ t('pluginDetail.tag') }}</p>
            <UBadge color="primary" size="sm" variant="subtle">
              {{ selectedVersion.tag }}
            </UBadge>
          </div>

          <div class="text-sm">
            <p class="font-medium text-dimmed mb-1">{{ t('pluginDetail.details') }}</p>
            <p>
              {{ pluginTypeLabel }}
              <span v-if="selectedVersion.stateless"> - stateless</span>
            </p>
          </div>

          <div class="text-sm">
            <p class="font-medium text-dimmed mb-1">{{ t('pluginDetail.capabilities') }}</p>
            <div
              v-if="selectedVersion.capabilities && Array.isArray(selectedVersion.capabilities) && selectedVersion.capabilities.length > 0"
              class="flex flex-wrap gap-1"
            >
              <UBadge v-for="cap in selectedVersion.capabilities" :key="String(cap)" color="info" size="md" variant="soft">
                {{ cap }}
              </UBadge>
            </div>
            <p v-else class="text-dimmed text-sm">{{ t('common.empty') }}</p>
          </div>

          <div class="text-sm">
            <p class="font-medium text-dimmed mb-2">{{ t('pluginDetail.configSettings') }}</p>
            <UTable
              v-if="configRows.length > 0"
              :columns="[
                { accessorKey: 'name', header: t('pluginDetail.name') },
                { accessorKey: 'key', header: t('pluginDetail.key') },
                { accessorKey: 'type', header: t('pluginDetail.type') },
                { accessorKey: 'default', header: t('pluginDetail.default') },
                { accessorKey: 'description', header: t('pluginDetail.description') },
                { accessorKey: 'required', header: t('pluginDetail.required') },
                { accessorKey: 'sensitive', header: t('pluginDetail.sensitive') }
              ]"
              :data="configRows"
            />
            <p v-else class="text-dimmed text-sm">{{ t('pluginDetail.noConfigSettings') }}</p>
          </div>
        </template>
      </div>
    </template>

    <template v-if="selectedVersion && canManage" #footer>
      <div class="flex justify-end w-full gap-2">
        <template v-if="isDisabled">
          <UPopover>
            <UButton color="primary" icon="i-lucide-route" :label="t('pluginDetail.enable')" />
            <template #content="{ close }">
              <div class="p-4 min-w-48">
                <p class="text-sm text-dimmed mb-3">{{ t('pluginDetail.enableConfirm') }}</p>
                <div class="flex justify-end gap-2">
                  <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                  <UButton color="primary" :label="t('pluginDetail.enable')" :loading="enabling" @click="handleEnableConfirm(close)" />
                </div>
              </div>
            </template>
          </UPopover>
        </template>
        <template v-else>
          <UPopover>
            <UButton color="error" icon="i-lucide-route-off" :label="t('pluginDetail.disable')" />
            <template #content="{ close }">
              <div class="p-4 min-w-48">
                <p class="text-sm text-dimmed mb-3">{{ t('pluginDetail.disableConfirm') }}</p>
                <div class="flex justify-end gap-2">
                  <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                  <UButton color="error" :label="t('pluginDetail.disable')" :loading="disabling" @click="handleDisableConfirm(close)" />
                </div>
              </div>
            </template>
          </UPopover>
        </template>
      </div>
    </template>
  </USlideover>
</template>
