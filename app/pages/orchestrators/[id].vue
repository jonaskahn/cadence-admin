<script setup lang="ts">
import type { OrchestratorResponse } from '~/types'
import { tierColor, statusColor } from '~/utils'

const route = useRoute()
const auth = useAuth()
const orchestrators = useOrchestrators()
const toast = useToast()

const instanceId = route.params.id as string
const orgId = computed(() => auth.currentOrgId.value || '')

const { data: orchestrator, refresh } = await useFetch<OrchestratorResponse>(
  () => `/api/orgs/${orgId.value}/orchestrators/${instanceId}`
)

const activeTab = ref('overview')

const isLangGraphSupervisor = computed(
  () =>
    orchestrator.value?.framework_type === 'langgraph' && orchestrator.value?.mode === 'supervisor'
)

// Settings tab
const savingSettings = ref(false)
const supervisorSettingsRef = ref<{
  isValid: () => boolean
  getValue: () => Record<string, unknown>
} | null>(null)

async function saveSupervisorSettings() {
  if (!supervisorSettingsRef.value) return
  if (!supervisorSettingsRef.value.isValid()) {
    toast.add({ title: 'Default LLM Config is required', color: 'error' })
    return
  }
  savingSettings.value = true
  try {
    await orchestrators.updateConfig(instanceId, {
      ...orchestrator.value!.config,
      ...supervisorSettingsRef.value.getValue()
    })
    await refresh()
  } catch {
    // toast handled by composable
  } finally {
    savingSettings.value = false
  }
}

// Plugin settings
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
    // error is toast-handled in composable
  } finally {
    savingPluginSettings.value = false
  }
}

async function onActivatePluginVersion(pid: string, version: string) {
  try {
    await orchestrators.activatePluginVersion(instanceId, pid, version)
    await refresh()
  } catch {
    // error is toast-handled in composable
  }
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
          <UButton icon="i-lucide-arrow-left" variant="ghost" to="/orchestrators" />
        </template>
        <template #right>
          <template v-if="auth.isOrgAdmin.value && orchestrator">
            <UButton
              icon="i-lucide-play"
              label="Load"
              variant="outline"
              size="sm"
              @click="orchestrators.load(instanceId)"
            />
            <UButton
              icon="i-lucide-square"
              label="Unload"
              variant="outline"
              size="sm"
              @click="orchestrators.unload(instanceId)"
            />
          </template>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar style="margin-top: 0.5rem">
        <template #left>
          <UTabs
            v-model="activeTab"
            variant="pill"
            :items="[
              { label: 'Overview', value: 'overview' },
              { label: 'Settings', value: 'settings' }
            ]"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div v-if="orchestrator" class="p-6">
        <!-- Overview tab -->
        <div v-if="activeTab === 'overview'" class="flex flex-col gap-4">
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
                  <UBadge :color="tierColor(orchestrator.tier)" variant="subtle" size="sm">
                    {{ orchestrator.tier }}
                  </UBadge>
                </dd>
              </div>
              <div>
                <dt class="text-dimmed text-sm">Status</dt>
                <dd class="mt-1">
                  <UBadge :color="statusColor(orchestrator.status)" variant="subtle" size="sm">
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

          <UCard v-if="auth.isOrgAdmin.value">
            <template #header>
              <p class="font-semibold">Actions</p>
            </template>
            <div class="flex gap-2">
              <UButton
                v-if="orchestrator.status === 'active'"
                label="Suspend"
                variant="outline"
                color="warning"
                size="sm"
                @click="suspend"
              />
              <UButton
                v-else
                label="Activate"
                variant="outline"
                color="success"
                size="sm"
                @click="activate"
              />
            </div>
          </UCard>
        </div>

        <!-- Settings tab -->
        <div v-else-if="activeTab === 'settings'" class="flex flex-col gap-4">
          <!-- Supervisor settings (langgraph/supervisor only) -->
          <UCard v-if="isLangGraphSupervisor">
            <template #header>
              <div class="flex items-center justify-between">
                <p class="font-semibold">Settings</p>
                <UButton
                  v-if="auth.isOrgAdmin.value"
                  label="Save"
                  size="sm"
                  :loading="savingSettings"
                  @click="saveSupervisorSettings"
                />
              </div>
            </template>
            <LangGraphSupervisorSettings
              :key="orchestrator.config_hash ?? orchestrator.updated_at"
              ref="supervisorSettingsRef"
              :org-id="orgId"
              :initial-value="orchestrator.config"
              :disabled="!auth.isOrgAdmin.value"
            />
          </UCard>

          <!-- Plugin settings -->
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-semibold">Plugin Settings</p>
                  <p class="text-dimmed text-xs mt-0.5">
                    Configure settings for each active plugin. Activate a version to switch.
                  </p>
                </div>
                <UButton
                  v-if="auth.isOrgAdmin.value"
                  label="Save"
                  size="sm"
                  :loading="savingPluginSettings"
                  @click="savePluginSettings"
                />
              </div>
            </template>
            <OrchestratorPluginSettings
              ref="pluginSettingsRef"
              :initial-value="orchestrator.plugin_settings"
              :disabled="!auth.isOrgAdmin.value"
              @activate="onActivatePluginVersion"
            />
          </UCard>
        </div>
      </div>

      <div v-else class="flex items-center justify-center p-12">
        <UIcon name="i-lucide-loader" class="size-8 animate-spin" />
      </div>
    </template>
  </UDashboardPanel>
</template>
