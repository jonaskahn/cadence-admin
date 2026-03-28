<script lang="ts" setup>
import type { FrameworkSupportedProvidersResponse, OrchestratorResponse, PluginMetadataResponse } from '~/types'
import { normalizeOrchestratorPoolTier, statusColor, tierColor } from '~/utils'

type PluginCardItem = {
  id: string
  name: string
  pid: string
  source: 'system' | 'org'
  logo: string | null
  version: string
}

const route = useRoute()
const auth = useAuth()
const { t } = useI18n()
const localePath = useLocalePath()
const aiAppStore = useAiApps()

const instanceId = route.params.id as string
const orgId = computed(() => auth.currentOrgId.value || '')

const { data: aiApp, refresh } = await useFetch<OrchestratorResponse>(
  () => `/api/orgs/${orgId.value}/orchestrators/${instanceId}`,
  { watch: [orgId] }
)

const supportedProviders = ref<string[] | null>(null)

async function loadSupportedProviders(fw: string) {
  try {
    const res = await $fetch<FrameworkSupportedProvidersResponse>(`/api/frameworks/${fw}/supported-providers`)
    supportedProviders.value = res.supports_all ? null : res.supported_providers
  } catch {
    supportedProviders.value = null
  }
}

watch(
  () => aiApp.value?.framework_type,
  (fw) => {
    if (fw) loadSupportedProviders(fw)
  },
  { immediate: true }
)

const savingPluginSettings = ref(false)
const toast = useToast()
const { withOverlay } = useLoadingOverlay()
const pluginSettingsRef = ref<{
  getValue: () => Record<string, import('~/types').PluginSettingsEntry>
  validate?: () => { valid: boolean; message?: string }
} | null>(null)

const baseActivePlugins = computed<PluginCardItem[]>(() => {
  if (!aiApp.value?.plugin_settings) return []
  return Object.values(aiApp.value.plugin_settings)
    .filter((entry) => entry.active)
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      pid: entry.id,
      source: (entry.source ?? 'org') as 'system' | 'org',
      logo: entry.logo_image ?? null,
      version: entry.version
    }))
})

const displayPlugins = ref<PluginCardItem[]>([])

watch(
  [baseActivePlugins, orgId],
  async () => {
    const base = baseActivePlugins.value
    if (base.length === 0) {
      displayPlugins.value = []
      return
    }
    displayPlugins.value = base
    const needsLogo = base.filter((p) => !p.logo)
    if (needsLogo.length === 0) return
    const orgIdVal = orgId.value
    if (!orgIdVal) return
    try {
      const logos = await Promise.all(
        needsLogo.map(async (p) => {
          try {
            const res = await $fetch<PluginMetadataResponse[]>(
              `/api/orgs/${orgIdVal}/plugins/${p.id}/versions?source=${p.source}`
            )
            const match = res.find((v) => v.version === p.version)
            return match?.logo_image ?? null
          } catch {
            return null
          }
        })
      )
      const logoByKey = new Map(needsLogo.map((p, i) => [`${p.id}@${p.version}`, logos[i]]))
      displayPlugins.value = base.map((p) => ({
        ...p,
        logo: p.logo ?? logoByKey.get(`${p.id}@${p.version}`) ?? null
      }))
    } catch {
      /* keep displayPlugins as base with fallback avatars */
    }
  },
  { immediate: true }
)

const loadingId = ref(false)
const unloadingId = ref(false)
const activating = ref(false)
const deactivating = ref(false)

async function savePluginSettings() {
  const ref = pluginSettingsRef.value
  if (!ref) return
  const validation = ref.validate?.()
  if (validation && !validation.valid) {
    toast.add({ title: validation.message ?? 'Plugin settings validation failed', color: 'error' })
    return
  }
  savingPluginSettings.value = true
  try {
    await withOverlay(async () => {
      await aiAppStore.updatePluginSettings(instanceId, ref.getValue())
      await refresh()
    })
  } catch {
    /* toast handled by aiAppStore */
  } finally {
    savingPluginSettings.value = false
  }
}

async function onLoad() {
  loadingId.value = true
  try {
    await aiAppStore.load(instanceId)
    await refresh()
  } finally {
    loadingId.value = false
  }
}

async function onUnload() {
  unloadingId.value = true
  try {
    await aiAppStore.unload(instanceId)
    await refresh()
  } finally {
    unloadingId.value = false
  }
}

async function onActivate() {
  activating.value = true
  try {
    await aiAppStore.activate(instanceId)
    await refresh()
  } finally {
    activating.value = false
  }
}

async function onDeactivate() {
  deactivating.value = true
  try {
    await aiAppStore.deactivate(instanceId)
    await refresh()
  } finally {
    deactivating.value = false
  }
}

async function handleLoadConfirm(close: () => void) {
  await onLoad()
  close()
}

async function handleUnloadConfirm(close: () => void) {
  await onUnload()
  close()
}

async function handleDeactivateConfirm(close: () => void) {
  await onDeactivate()
  close()
}

async function handleActivateConfirm(close: () => void) {
  await onActivate()
  close()
}
</script>

<template>
  <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
    <UDashboardPanel :id="`ai-app-${instanceId}`" :ui="{ body: 'min-w-0' }">
      <template #header>
        <UDashboardNavbar>
          <template #title>
            <span class="inline-flex min-w-0 flex-wrap items-center gap-2">
              <span class="truncate">{{ aiApp?.name ?? t('aiApps.title') }}</span>
              <UBadge color="neutral" class="shrink-0" size="xs" variant="subtle">{{ t('aiApps.legacyBadge') }}</UBadge>
            </span>
          </template>
          <template #leading>
            <UButton icon="i-lucide-arrow-left" :to="localePath('/ai-apps')" />
          </template>
          <template #right>
            <div class="flex items-center gap-2">
              <InfoPopover title-key="info.pages.aiApps.title" description-key="info.pages.aiApps.description" />
              <template v-if="auth.isAdmin.value && aiApp">
                <UButton
                  color="primary"
                  icon="i-lucide-pencil"
                  :label="t('common.edit')"
                  size="sm"
                  :to="localePath(`/ai-apps/${instanceId}/edit`)"
                />
                <template v-if="aiApp.status === 'active'">
                  <UPopover>
                    <UButton color="primary" icon="i-lucide-play" :label="t('aiApps.load')" size="sm" />
                    <template #content="{ close }">
                      <div class="min-w-48 p-4">
                        <p class="text-dimmed mb-3 text-sm">{{ t('aiApps.loadConfirm', { name: aiApp.name }) }}</p>
                        <div class="flex justify-end gap-2">
                          <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                          <UButton
                            color="primary"
                            :label="t('aiApps.load')"
                            :loading="loadingId"
                            @click="handleLoadConfirm(close)"
                          />
                        </div>
                      </div>
                    </template>
                  </UPopover>
                  <UPopover>
                    <UButton color="primary" icon="i-lucide-square" :label="t('aiApps.unload')" size="sm" />
                    <template #content="{ close }">
                      <div class="min-w-48 p-4">
                        <p class="text-dimmed mb-3 text-sm">{{ t('aiApps.unloadConfirm', { name: aiApp.name }) }}</p>
                        <div class="flex justify-end gap-2">
                          <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                          <UButton
                            color="primary"
                            :label="t('aiApps.unload')"
                            :loading="unloadingId"
                            @click="handleUnloadConfirm(close)"
                          />
                        </div>
                      </div>
                    </template>
                  </UPopover>
                  <UPopover>
                    <UButton color="error" icon="i-lucide-route-off" :label="t('aiApps.deactivate')" size="sm" />
                    <template #content="{ close }">
                      <div class="min-w-48 p-4">
                        <p class="text-dimmed mb-3 text-sm">
                          {{ t('aiApps.deactivateConfirm', { name: aiApp.name }) }}
                        </p>
                        <div class="flex justify-end gap-2">
                          <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                          <UButton
                            color="primary"
                            :label="t('aiApps.deactivate')"
                            :loading="deactivating"
                            @click="handleDeactivateConfirm(close)"
                          />
                        </div>
                      </div>
                    </template>
                  </UPopover>
                </template>
                <UPopover v-else>
                  <UButton color="primary" icon="i-lucide-route" :label="t('aiApps.activate')" size="sm" />
                  <template #content="{ close }">
                    <div class="min-w-48 p-4">
                      <p class="text-dimmed mb-3 text-sm">{{ t('aiApps.activateConfirm', { name: aiApp.name }) }}</p>
                      <div class="flex justify-end gap-2">
                        <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                        <UButton
                          color="primary"
                          :label="t('aiApps.activate')"
                          :loading="activating"
                          @click="handleActivateConfirm(close)"
                        />
                      </div>
                    </div>
                  </template>
                </UPopover>
              </template>
            </div>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div v-if="aiApp" class="flex w-full min-w-0 flex-col gap-6 p-6">
          <!-- Overview card: Details + Graph -->
          <UCard variant="soft" class="min-w-0">
            <template #header>
              <span class="font-semibold">{{ t('aiApps.overviewSection') }}</span>
            </template>

            <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <!-- Details inner panel -->
              <div class="border-accented border-dottedrounded-lg border p-4">
                <p class="mb-4 text-sm font-medium">{{ t('aiApps.details') }}</p>
                <dl class="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <dt class="text-dimmed text-sm">Instance ID</dt>
                    <dd class="mt-1 font-mono text-sm break-all">{{ aiApp.instance_id }}</dd>
                  </div>
                  <div>
                    <dt class="text-dimmed text-sm">Framework</dt>
                    <dd class="mt-1">{{ aiApp.framework_type }}</dd>
                  </div>
                  <div>
                    <dt class="text-dimmed text-sm">Mode</dt>
                    <dd class="mt-1">{{ aiApp.mode }}</dd>
                  </div>
                  <div>
                    <dt class="text-dimmed text-sm">Tier</dt>
                    <dd class="mt-1">
                      <UBadge
                        :color="tierColor(normalizeOrchestratorPoolTier(aiApp.tier ?? 'cold'))"
                        size="sm"
                        variant="subtle"
                      >
                        {{ normalizeOrchestratorPoolTier(aiApp.tier ?? 'cold').toUpperCase() }}
                      </UBadge>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-dimmed text-sm">Status</dt>
                    <dd class="mt-1">
                      <UBadge :color="statusColor(aiApp.status)" size="sm" variant="subtle">
                        {{ aiApp.status }}
                      </UBadge>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-dimmed text-sm">Config Hash</dt>
                    <dd class="mt-1 font-mono text-xs break-all">{{ aiApp.config_hash || '—' }}</dd>
                  </div>
                </dl>
              </div>

              <!-- Graph inner panel -->
              <div class="border-accented border-dottedrounded-lg border p-4">
                <p class="mb-4 text-sm font-medium">{{ t('aiApps.graph') }}</p>
                <AiAppGraph :instance-id="instanceId" :org-id="orgId" />
              </div>
            </div>
          </UCard>

          <!-- Plugin Configuration card -->
          <UCard variant="soft" class="min-w-0">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-plug" />
                  <span class="font-semibold">{{ t('aiApps.create.pluginConfiguration') }}</span>
                </div>
                <ConfirmActionPopover
                  v-if="auth.isAdmin.value"
                  label-key="common.save"
                  size="sm"
                  confirm-title-key="common.saveConfirmTitle"
                  confirm-message-key="common.saveConfirmMessage"
                  confirm-label-key="common.saveConfirmFriendly"
                  :loading="savingPluginSettings"
                  :on-confirm="savePluginSettings"
                />
              </div>
            </template>

            <!-- Plugin status mini-cards -->
            <div v-if="displayPlugins.length > 0" class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AiAppPluginCard
                v-for="plugin in displayPlugins"
                :key="plugin.id + plugin.version"
                :plugin="plugin"
                :interactive="false"
              />
            </div>

            <USeparator v-if="displayPlugins.length > 0" :label="t('aiApps.create.pluginSettings')" class="mb-4" />

            <p class="text-dimmed mb-4 text-xs">{{ t('aiApps.create.pluginConfigurationDesc') }}</p>

            <AiAppPluginSettings
              ref="pluginSettingsRef"
              :disabled="!auth.isAdmin.value"
              :initial-value="aiApp.plugin_settings"
              :org-id="orgId"
            />
          </UCard>
        </div>

        <div v-else class="flex items-center justify-center p-12">
          <UIcon class="size-8 animate-spin" name="i-lucide-loader" />
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
