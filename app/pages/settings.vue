<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'
import { CENTRAL_POINTS_TIERS } from '~/utils'

const auth = useAuth()
const { t } = useI18n()
const localePath = useLocalePath()
if (!auth.isAdmin.value) {
  await navigateTo(localePath('/dashboard'))
}
const orgId = computed(() => auth.currentOrgId.value || '')

const { data: org } = await useFetch<{ tier: string }>(() => `/api/orgs/${orgId.value}`, {
  watch: [orgId]
})

const canUseCentralPoints = computed(() =>
  orgId.value && org.value?.tier && (CENTRAL_POINTS_TIERS as readonly string[]).includes(org.value.tier.toLowerCase())
)

provide('canUseCentralPoints', canUseCentralPoints)

const links = computed<NavigationMenuItem[][]>(() => {
  const base = [
    { label: t('nav.general'), icon: 'i-lucide-blocks', to: localePath('/settings'), exact: true },
    { label: t('nav.members'), icon: 'i-lucide-contact', to: localePath('/settings/members') },
    { label: t('nav.llmConfigs'), icon: 'i-lucide-cable', to: localePath('/settings/llm-configs') },
    { label: t('nav.orchestrators'), icon: 'i-lucide-cpu', to: localePath('/settings/orchestrators') },
    { label: t('nav.centralPoints'), icon: 'i-lucide-radio', to: localePath('/settings/central-points') }
  ]
  return [base]
})
</script>

<template>
  <UDashboardPanel id="settings" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar :title="t('settings.title')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <UNavigationMenu :items="links" class="-mx-1 flex-1" highlight />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full max-w-6xl mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
