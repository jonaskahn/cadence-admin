<script lang="ts" setup>
import type { FrameworkSupportedProvidersResponse, OrchestratorResponse } from '~/types'
import { statusColor, tierColor } from '~/utils'

const route = useRoute()
const auth = useAuth()
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

async function onDeactivate() {
  if (!confirm(`Deactivate "${orchestrator?.name}"?`)) return
  await orchestrators.deactivate(instanceId)
  await refresh()
}

async function onActivate() {
  await orchestrators.activate(instanceId)
  await refresh()
}
</script>

<template>
  <UDashboardPanel :id="`orchestrator-${instanceId}`" :ui="{ body: 'min-w-0' }">
    <template #header>
      <UDashboardNavbar :title="orchestrator?.name || 'Orchestrator'">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" to="/orchestrators" variant="ghost" />
        </template>
        <template #right>
          <template v-if="auth.isOrgAdmin.value && orchestrator">
            <UButton icon="i-lucide-pencil" label="Edit" size="sm" variant="outline" :to="`/orchestrators/${instanceId}/edit`" />
            <template v-if="orchestrator.status === 'active'">
              <UButton icon="i-lucide-play" label="Load" size="sm" variant="outline" @click="orchestrators.load(instanceId)" />
              <UButton icon="i-lucide-square" label="Unload" size="sm" variant="outline" @click="orchestrators.unload(instanceId)" />
              <UButton color="neutral" icon="i-lucide-route-off" label="Deactivate" size="sm" variant="outline" @click="onDeactivate" />
            </template>
            <UButton v-else color="success" icon="i-lucide-route" label="Activate" size="sm" variant="outline" @click="onActivate" />
          </template>
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

        <UCard class="mt-6 min-w-0">
          <template #header>
            <div class="flex items-center justify-between w-full flex-wrap gap-2">
              <div>
                <p class="font-semibold">Plugin Settings</p>
                <p class="text-dimmed text-xs mt-0.5">Configure settings for each active plugin. Activate a version to switch.</p>
              </div>
              <UButton v-if="auth.isOrgAdmin.value" :loading="savingPluginSettings" label="Save" size="sm" @click="savePluginSettings" />
            </div>
          </template>
          <OrchestratorPluginSettings
            ref="pluginSettingsRef"
            :disabled="!auth.isOrgAdmin.value"
            :initial-value="orchestrator.plugin_settings"
            :org-id="orgId"
          />
        </UCard>
      </div>

      <div v-else class="flex items-center justify-center p-12">
        <UIcon class="size-8 animate-spin" name="i-lucide-loader" />
      </div>
    </template>
  </UDashboardPanel>
</template>
