<script lang="ts" setup>
import type { PluginMetadataResponse, SystemPluginResponse } from '~/types'

const auth = useAuth()
const { t } = useI18n()
const localePath = useLocalePath()
if (!auth.isAdmin.value) {
  await navigateTo(localePath('/dashboard'))
}
const showUpload = ref(false)
const drawerOpen = ref(false)
const selectedPlugin = ref<PluginMetadataResponse | null>(null)
const sourceFilter = ref<'all' | 'system' | 'org'>('all')
const orgId = computed(() => auth.currentOrgId.value || '')

const { data: plugins, refresh } = await useApiFetch<PluginMetadataResponse[]>(() => `/api/orgs/${orgId.value}/plugins`, { watch: [orgId] })

const filteredPlugins = computed(() => {
  const list = plugins.value ?? []
  if (sourceFilter.value === 'all') return list
  return list.filter((p) => p.source === sourceFilter.value)
})

const sourceFilterItems = computed(() => [
  { label: t('plugins.all'), value: 'all' },
  { label: t('plugins.system'), value: 'system' },
  { label: t('plugins.org'), value: 'org' }
])

function handleUploadClose() {
  showUpload.value = false
  refresh()
}

function onPluginSelect(plugin: PluginMetadataResponse | SystemPluginResponse) {
  selectedPlugin.value = plugin as PluginMetadataResponse
  drawerOpen.value = true
}

function onDrawerClose() {
  drawerOpen.value = false
}

function onDrawerClosed() {
  selectedPlugin.value = null
  refresh()
}

function openUpload() {
  showUpload.value = true
}
</script>

<template>
  <div class="min-w-0 flex-1 flex flex-col overflow-hidden">
    <UDashboardPanel id="plugins">
      <template #header>
        <UDashboardNavbar :title="t('plugins.title')">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <div class="flex items-center gap-2">
              <InfoPopover title-key="info.pages.plugins.title" description-key="info.pages.plugins.description" />
              <USelect v-model="sourceFilter" :items="sourceFilterItems" value-key="value" label-key="label" class="w-32" />
              <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" :aria-label="t('common.refresh')" @click="refresh()" />
              <UButton v-if="auth.isAdmin.value" icon="i-lucide-upload" :label="t('common.upload')" @click="openUpload" />
            </div>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="p-6">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <PluginCard v-for="plugin in filteredPlugins" :key="`${plugin.source}-${plugin.pid}`" :plugin="plugin" :source="'org'" @select="onPluginSelect" />
          </div>
          <p v-if="filteredPlugins.length === 0" class="py-8 text-center text-dimmed">{{ t('plugins.noPluginsMatch') }}</p>
        </div>
      </template>
    </UDashboardPanel>

    <PluginDetailDrawer
      v-if="selectedPlugin"
      v-model:open="drawerOpen"
      :allow-disable="selectedPlugin.source === 'org'"
      :is-admin-context="false"
      :org-id="orgId"
      :pid="selectedPlugin.pid"
      :source="(selectedPlugin.source as 'system' | 'org') ?? 'org'"
      @close="onDrawerClose"
      @closed="onDrawerClosed"
    />

    <UModal v-model:open="showUpload" :title="t('pluginUpload.title')" :description="t('pluginUpload.description')">
      <template #content>
        <PluginUploadModal :org-id="orgId" @close="handleUploadClose" />
      </template>
    </UModal>
  </div>
</template>
