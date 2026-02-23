<script lang="ts" setup>
import type { FrameworkSupportedProvidersResponse, OrchestratorResponse } from '~/types'
import { statusColor, tierColor } from '~/utils'

const route = useRoute()
const auth = useAuth()
const orchestrators = useOrchestrators()

const instanceId = route.params.id as string
const orgId = computed(() => auth.currentOrgId.value || '')

const { data: orchestrator, refresh } = await useFetch<OrchestratorResponse>(() => `/api/orgs/${orgId.value}/orchestrators/${instanceId}`)

const showEdit = ref(false)
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
const pluginSettingsRef = ref<{
  getValue: () => Record<string, import('~/types').PluginSettingsEntry>
} | null>(null)

async function savePluginSettings() {
  if (!pluginSettingsRef.value) return
  savingPluginSettings.value = true
  try {
    await orchestrators.updatePluginSettings(instanceId, pluginSettingsRef.value.getValue())
    await refresh()
  } catch {
  } finally {
    savingPluginSettings.value = false
  }
}

async function onActivatePluginVersion(pid: string, version: string) {
  try {
    await orchestrators.activatePluginVersion(instanceId, pid, version)
    await refresh()
  } catch {}
}

async function suspend() {
  await orchestrators.updateStatus(instanceId, 'suspended')
  await refresh()
}

async function activate() {
  await orchestrators.updateStatus(instanceId, 'active')
  await refresh()
}
</script>

<template>
  <UDashboardPanel :id="`orchestrator-${instanceId}`">
    <template #header>
      <UDashboardNavbar :title="orchestrator?.name || 'Orchestrator'">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" to="/orchestrators" variant="ghost" />
        </template>
        <template #right>
          <template v-if="auth.isOrgAdmin.value && orchestrator">
            <UButton icon="i-lucide-pencil" label="Edit" size="sm" variant="outline" @click="showEdit = true" />
            <UButton v-if="orchestrator.status === 'active'" color="warning" label="Suspend" size="sm" variant="outline" @click="suspend" />
            <UButton v-else color="success" label="Activate" size="sm" variant="outline" @click="activate" />
            <UButton icon="i-lucide-play" label="Load" size="sm" variant="outline" @click="orchestrators.load(instanceId)" />
            <UButton icon="i-lucide-square" label="Unload" size="sm" variant="outline" @click="orchestrators.unload(instanceId)" />
          </template>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="orchestrator" class="p-6 flex flex-col gap-4">
        <UCard>
          <template #header>
            <p class="font-semibold">Details</p>
          </template>
          <dl class="grid grid-cols-2 gap-4">
            <div>
              <dt class="text-dimmed text-sm">Instance ID</dt>
              <dd class="font-mono text-sm mt-1">{{ orchestrator.instance_id }}</dd>
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
              <dd class="font-mono text-xs mt-1">{{ orchestrator.config_hash || '—' }}</dd>
            </div>
          </dl>
        </UCard>

        <UCard>
          <template #header>
            <p class="font-semibold">Graph</p>
          </template>
          <OrchestratorGraph :instance-id="instanceId" :org-id="orgId" />
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
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
            @activate="onActivatePluginVersion"
          />
        </UCard>
      </div>

      <div v-else class="flex items-center justify-center p-12">
        <UIcon class="size-8 animate-spin" name="i-lucide-loader" />
      </div>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="showEdit" :ui="{ content: 'sm:max-w-xl' }" @after:leave="refresh()">
    <template #content>
      <OrchestratorEditModal v-if="orchestrator" :orchestrator="orchestrator" @close="showEdit = false" @updated="refresh()" />
    </template>
  </UModal>
</template>
