<script lang="ts" setup>
import type { DropdownMenuItem } from '@nuxt/ui'
import type { OrganizationResponse, PluginMetadataResponse, SystemPluginResponse } from '~/types'

type PluginCardItem = (PluginMetadataResponse & { enabled?: boolean }) | SystemPluginResponse

const auth = useAuth()
const { t } = useI18n()
const showUpload = ref(false)
const drawerOpen = ref(false)
const selectedPlugin = ref<PluginCardItem | null>(null)
const activeTab = ref<'system' | 'org'>('system')
const selectedOrgId = ref<string>('')
const orgId = computed(() => auth.currentOrgId.value || '')

const { data: systemPlugins, refresh: refreshSystem } = await useApiFetch<SystemPluginResponse[]>('/api/admin/plugins')
const { data: orgs } = await useApiFetch<OrganizationResponse[]>('/api/admin/orgs')
const { data: orgPlugins, refresh: refreshOrg } = await useApiFetch<PluginCardItem[]>(
  () => (selectedOrgId.value ? `/api/admin/orgs/${selectedOrgId.value}/plugins` : null),
  { watch: [selectedOrgId] }
)

const plugins = computed(() => (activeTab.value === 'system' ? (systemPlugins.value ?? []) : (orgPlugins.value ?? [])))
const orgOptions = computed(() => (orgs.value ?? []).map((o) => ({ label: o.name || o.domain || o.org_id, value: o.org_id })))

const tabDropdownItems = computed<DropdownMenuItem[][]>(() => [
  [
    { label: t('plugins.system'), icon: 'i-lucide-server', onSelect: () => (activeTab.value = 'system') },
    { label: t('plugins.org'), icon: 'i-lucide-building-2', onSelect: () => (activeTab.value = 'org') }
  ]
])

async function refresh() {
  if (activeTab.value === 'system') await refreshSystem()
  else await refreshOrg()
}

function handleUploadClose() {
  showUpload.value = false
  refresh()
}

function onPluginSelect(plugin: PluginCardItem) {
  selectedPlugin.value = plugin
  drawerOpen.value = true
}

function onDrawerClose() {
  drawerOpen.value = false
}

function onDrawerClosed() {
  selectedPlugin.value = null
  refresh()
}
</script>

<template>
  <div class="min-w-0 flex-1 flex flex-col overflow-hidden">
    <UDashboardPanel id="admin-plugins">
    <template #header>
      <UDashboardNavbar :title="t('plugins.title')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <InfoPopover title-key="info.admin.systemPlugins.title" description-key="info.admin.systemPlugins.description" />
            <UFieldGroup>
              <UButton color="neutral" variant="subtle" :label="activeTab === 'system' ? t('plugins.system') : t('plugins.org')" />
              <UDropdownMenu :items="tabDropdownItems">
                <UButton color="neutral" variant="outline" icon="i-lucide-chevron-down" />
              </UDropdownMenu>
            </UFieldGroup>
            <USelect
              v-if="activeTab === 'org'"
              v-model="selectedOrgId"
              :items="orgOptions"
              value-key="value"
              label-key="label"
              class="w-56"
              :placeholder="t('common.selectOrg')"
            />
            <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" :aria-label="t('common.refresh')" @click="refresh()" />
            <UButton v-if="activeTab === 'system'" icon="i-lucide-upload" :label="t('admin.uploadPlugin')" @click="showUpload = true" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <div v-if="activeTab === 'org' && !selectedOrgId" class="py-8 text-center text-dimmed">
          {{ t('admin.selectOrgToView') }}
        </div>
        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <PluginCard v-for="plugin in plugins" :key="plugin.id" :plugin="plugin" :source="activeTab" @select="onPluginSelect" />
        </div>
        <p v-if="activeTab === 'system' && plugins.length === 0" class="py-8 text-center text-dimmed">{{ t('admin.noPluginsYet') }}</p>
        <p v-else-if="activeTab === 'org' && selectedOrgId && plugins.length === 0" class="py-8 text-center text-dimmed">{{ t('admin.noOrgPlugins') }}</p>
      </div>
    </template>
    </UDashboardPanel>

    <PluginDetailDrawer
    v-if="selectedPlugin"
    v-model:open="drawerOpen"
    :allow-disable="true"
    :is-admin-context="true"
    :org-id="activeTab === 'org' && selectedOrgId ? selectedOrgId : orgId"
    :pid="selectedPlugin.pid"
    :source="activeTab"
    @close="onDrawerClose"
    @closed="onDrawerClosed"
    />

    <UModal v-model:open="showUpload">
    <template #content>
      <PluginUploadModal :is-admin="true" :org-id="orgId" @close="handleUploadClose" />
    </template>
    </UModal>
  </div>
</template>
