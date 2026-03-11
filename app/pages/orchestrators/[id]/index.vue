<script lang="ts" setup>
import type { FrameworkSupportedProvidersResponse, OrchestratorResponse } from '~/types'
import { statusColor, tierColor } from '~/utils'

const route = useRoute()
const auth = useAuth()
const { t } = useI18n()
const localePath = useLocalePath()
const orchestrators = useOrchestrators()

const instanceId = route.params.id as string
const orgId = computed(() => auth.currentOrgId.value || '')

const { data: orchestrator, refresh } = await useFetch<OrchestratorResponse>(() => `/api/orgs/${orgId.value}/orchestrators/${instanceId}`, { watch: [orgId] })

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
  () => orchestrator.value?.framework_type,
  (fw) => {
    if (fw) loadSupportedProviders(fw)
  },
  { immediate: true }
)

const savingPluginSettings = ref(false)
const toast = useToast()
const pluginSettingsRef = ref<{
  getValue: () => Record<string, import('~/types').PluginSettingsEntry>
  validate?: () => { valid: boolean; message?: string }
} | null>(null)

const loadingId = ref(false)
const unloadingId = ref(false)
const activating = ref(false)
const deactivating = ref(false)

async function savePluginSettings() {
  if (!pluginSettingsRef.value) return
  const validation = pluginSettingsRef.value.validate?.()
  if (validation && !validation.valid) {
    toast.add({ title: validation.message ?? 'Plugin settings validation failed', color: 'error' })
    return
  }
  savingPluginSettings.value = true
  try {
    await orchestrators.updatePluginSettings(instanceId, pluginSettingsRef.value.getValue())
    await refresh()
  } catch {
    /* toast handled by orchestrators */
  } finally {
    savingPluginSettings.value = false
  }
}

async function onLoad() {
  loadingId.value = true
  try {
    await orchestrators.load(instanceId)
    await refresh()
  } finally {
    loadingId.value = false
  }
}

async function onUnload() {
  unloadingId.value = true
  try {
    await orchestrators.unload(instanceId)
    await refresh()
  } finally {
    unloadingId.value = false
  }
}

async function onActivate() {
  activating.value = true
  try {
    await orchestrators.activate(instanceId)
    await refresh()
  } finally {
    activating.value = false
  }
}

async function onDeactivate() {
  deactivating.value = true
  try {
    await orchestrators.deactivate(instanceId)
    await refresh()
  } finally {
    deactivating.value = false
  }
}
</script>

<template>
  <UDashboardPanel :id="`orchestrator-${instanceId}`" :ui="{ body: 'min-w-0' }">
    <template #header>
      <UDashboardNavbar :title="orchestrator?.name ?? t('orchestrators.title')">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" :to="localePath('/orchestrators')" variant="outline" />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <InfoPopover title-key="info.pages.orchestrators.title" description-key="info.pages.orchestrators.description" />
            <template v-if="auth.isOrgAdmin.value && orchestrator">
            <UButton color="primary" variant="outline" icon="i-lucide-pencil" :label="t('common.edit')" size="sm" :to="localePath(`/orchestrators/${instanceId}/edit`)" />
            <template v-if="orchestrator.status === 'active'">
              <UPopover>
                <UButton color="primary" variant="outline" icon="i-lucide-play" :label="t('orchestrators.load')" size="sm" />
                <template #content="{ close }">
                  <div class="p-4 min-w-48">
                    <p class="text-sm text-dimmed mb-3">{{ t('orchestrators.loadConfirm', { name: orchestrator.name }) }}</p>
                    <div class="flex justify-end gap-2">
                      <UButton color="neutral" :label="t('common.cancel')" variant="outline" @click="close" />
                      <UButton color="primary" variant="outline" :label="t('orchestrators.load')" :loading="loadingId" @click="async () => { await onLoad(); close() }" />
                    </div>
                  </div>
                </template>
              </UPopover>
              <UPopover>
                <UButton color="primary" variant="outline" icon="i-lucide-square" :label="t('orchestrators.unload')" size="sm" />
                <template #content="{ close }">
                  <div class="p-4 min-w-48">
                    <p class="text-sm text-dimmed mb-3">{{ t('orchestrators.unloadConfirm', { name: orchestrator.name }) }}</p>
                    <div class="flex justify-end gap-2">
                      <UButton color="neutral" :label="t('common.cancel')" variant="outline" @click="close" />
                      <UButton color="primary" variant="outline" :label="t('orchestrators.unload')" :loading="unloadingId" @click="async () => { await onUnload(); close() }" />
                    </div>
                  </div>
                </template>
              </UPopover>
              <UPopover>
                <UButton color="primary" variant="outline" icon="i-lucide-route-off" :label="t('orchestrators.deactivate')" size="sm" />
                <template #content="{ close }">
                  <div class="p-4 min-w-48">
                    <p class="text-sm text-dimmed mb-3">{{ t('orchestrators.deactivateConfirm', { name: orchestrator.name }) }}</p>
                    <div class="flex justify-end gap-2">
                      <UButton color="neutral" :label="t('common.cancel')" variant="outline" @click="close" />
                      <UButton color="primary" variant="outline" :label="t('orchestrators.deactivate')" :loading="deactivating" @click="async () => { await onDeactivate(); close() }" />
                    </div>
                  </div>
                </template>
              </UPopover>
            </template>
            <UPopover v-else>
              <UButton color="primary" variant="outline" icon="i-lucide-route" :label="t('orchestrators.activate')" size="sm" />
              <template #content="{ close }">
                <div class="p-4 min-w-48">
                  <p class="text-sm text-dimmed mb-3">{{ t('orchestrators.activateConfirm', { name: orchestrator.name }) }}</p>
                  <div class="flex justify-end gap-2">
                    <UButton color="neutral" :label="t('common.cancel')" variant="outline" @click="close" />
                    <UButton color="primary" variant="outline" :label="t('orchestrators.activate')" :loading="activating" @click="async () => { await onActivate(); close() }" />
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
      <div v-if="orchestrator" class="p-6 min-w-0 w-full">
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <UCard class="min-w-0">
            <template #header>
              <p class="font-semibold">Details</p>
            </template>
            <dl class="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <dt class="text-dimmed text-sm">Instance ID</dt>
                <dd class="font-mono text-sm mt-1 break-all">{{ orchestrator.instance_id }}</dd>
              </div>
              <div>
                <dt class="text-dimmed text-sm">Framework</dt>
                <dd class="mt-1">{{ orchestrator.framework_type }}</dd>
              </div>
              <div>
                <dt class="text-dimmed text-sm">Mode</dt>
                <dd class="mt-1">{{ orchestrator.mode }}</dd>
              </div>
              <div>
                <dt class="text-dimmed text-sm">Tier</dt>
                <dd class="mt-1">
                  <UBadge :color="tierColor(orchestrator.tier)" size="sm" variant="subtle">
                    {{ orchestrator?.tier?.toUpperCase() }}
                  </UBadge>
                </dd>
              </div>
              <div>
                <dt class="text-dimmed text-sm">Status</dt>
                <dd class="mt-1">
                  <UBadge :color="statusColor(orchestrator.status)" size="sm" variant="subtle">
                    {{ orchestrator.status }}
                  </UBadge>
                </dd>
              </div>
              <div>
                <dt class="text-dimmed text-sm">Config Hash</dt>
                <dd class="font-mono text-xs mt-1 break-all">{{ orchestrator.config_hash || '—' }}</dd>
              </div>
            </dl>
          </UCard>

          <UCard class="min-w-0">
            <template #header>
              <p class="font-semibold">Graph</p>
            </template>
            <OrchestratorGraph :instance-id="instanceId" :org-id="orgId" />
          </UCard>
        </div>

        <div class="mt-6 flex flex-col gap-4 min-w-0">
          <div class="flex items-center gap-3">
            <USeparator label="Plugin Settings" class="flex-1" />
            <ConfirmActionPopover
              v-if="auth.isOrgAdmin.value"
              label-key="common.save"
              size="sm"
              confirm-title-key="common.saveConfirmTitle"
              confirm-message-key="common.saveConfirmMessage"
              confirm-label-key="common.saveConfirmFriendly"
              :loading="savingPluginSettings"
              :on-confirm="savePluginSettings"
            />
          </div>
          <p class="text-dimmed text-xs">Configure settings for each active plugin. Activate a version to switch.</p>
          <OrchestratorPluginSettings
            ref="pluginSettingsRef"
            :disabled="!auth.isOrgAdmin.value"
            :initial-value="orchestrator.plugin_settings"
            :org-id="orgId"
          />
        </div>
      </div>

      <div v-else class="flex items-center justify-center p-12">
        <UIcon class="size-8 animate-spin" name="i-lucide-loader" />
      </div>
    </template>
  </UDashboardPanel>
</template>
