<script lang="ts" setup>
const { t } = useI18n()

const tabs = computed(() => [
  { label: t('admin.settings'), slot: 'settings', icon: 'i-lucide-sliders' },
  { label: t('admin.authentication'), slot: 'auth', icon: 'i-lucide-shield' },
  { label: t('admin.telemetry'), slot: 'telemetry', icon: 'i-lucide-radio-tower' },
  { label: t('admin.subscriptionTiers'), slot: 'tiers', icon: 'i-lucide-layers' },
  { label: t('admin.llmProviders'), slot: 'llm-providers', icon: 'i-lucide-brain-circuit' }
])
</script>

<template>
  <div class="min-w-0 flex-1 flex flex-col overflow-hidden">
    <UDashboardPanel id="admin-settings">
      <template #header>
        <UDashboardNavbar :title="t('admin.globalSettings')">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <InfoPopover title-key="info.admin.globalSettings.title" description-key="info.admin.globalSettings.description" />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="p-6 flex flex-col gap-6">
          <UTabs :items="tabs" variant="link" :unmount-on-hide="false">
            <template #settings>
              <AdminSettingsTab />
            </template>

            <template #auth>
              <AdminAuthTab />
            </template>

            <template #telemetry>
              <AdminTelemetryTab />
            </template>

            <template #tiers>
              <AdminTiersTab />
            </template>

            <template #llm-providers>
              <div class="pt-4">
                <LLMProviderCatalog />
              </div>
            </template>
          </UTabs>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
