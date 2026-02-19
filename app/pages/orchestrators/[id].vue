<script setup lang="ts">
import type { OrchestratorResponse } from '~/types'

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

// Config editor
const configJson = ref('')
const configError = ref('')
const savingConfig = ref(false)

watch(orchestrator, (val) => {
  if (val) {
    configJson.value = JSON.stringify(val.config, null, 2)
  }
}, { immediate: true })

async function saveConfig() {
  configError.value = ''
  try {
    const parsed = JSON.parse(configJson.value)
    savingConfig.value = true
    await orchestrators.updateConfig(instanceId, parsed)
    await refresh()
  } catch (e: unknown) {
    configError.value = e instanceof SyntaxError ? 'Invalid JSON' : 'Failed to save'
  } finally {
    savingConfig.value = false
  }
}

const tierColor = (tier: string) => {
  if (tier === 'hot') return 'error'
  if (tier === 'warm') return 'warning'
  return 'neutral'
}
</script>

<template>
  <UDashboardPanel :id="`orchestrator-${instanceId}`">
    <template #header>
      <UDashboardNavbar :title="orchestrator?.name || 'Orchestrator'">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            to="/orchestrators"
          />
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

      <UDashboardToolbar>
        <UTabs
          v-model="activeTab"
          :items="[
            { label: 'Overview', value: 'overview' },
            { label: 'Config', value: 'config' }
          ]"
        />
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
                  <UBadge :color="orchestrator.status === 'active' ? 'success' : 'neutral'" variant="subtle" size="sm">
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
                @click="orchestrators.updateStatus(instanceId, 'suspended').then(() => refresh())"
              />
              <UButton
                v-else
                label="Activate"
                variant="outline"
                color="success"
                size="sm"
                @click="orchestrators.updateStatus(instanceId, 'active').then(() => refresh())"
              />
            </div>
          </UCard>
        </div>

        <!-- Config tab -->
        <div v-else-if="activeTab === 'config'" class="flex flex-col gap-4">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <p class="font-semibold">Configuration (JSON)</p>
                <UButton
                  v-if="auth.isOrgAdmin.value"
                  label="Save"
                  size="sm"
                  :loading="savingConfig"
                  @click="saveConfig"
                />
              </div>
            </template>
            <UTextarea
              v-model="configJson"
              :rows="20"
              class="font-mono text-sm w-full"
              :disabled="!auth.isOrgAdmin.value"
            />
            <p v-if="configError" class="text-error text-sm mt-1">{{ configError }}</p>
          </UCard>
        </div>
      </div>

      <div v-else class="flex items-center justify-center p-12">
        <UIcon name="i-lucide-loader" class="size-8 animate-spin" />
      </div>
    </template>
  </UDashboardPanel>
</template>
