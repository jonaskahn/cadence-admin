<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'

const auth = useAuth()
const { t } = useI18n()
const localePath = useLocalePath()
useDashboard()

const open = ref(false)

const closeMenu = () => {
  open.value = false
}

const baseLinks = computed<NavigationMenuItem[]>(() => {
  if (!auth.currentOrgId.value) return []
  if (!auth.isAdmin.value) {
    return [{ label: t('nav.chat'), icon: 'i-lucide-message-square', to: localePath('/chat'), onSelect: closeMenu }]
  }
  return [
    {
      label: t('nav.dashboard'),
      icon: 'i-lucide-layout-dashboard',
      to: localePath('/dashboard'),
      onSelect: closeMenu
    },
    {
      label: t('nav.chat'),
      icon: 'i-lucide-message-square',
      to: localePath('/chat'),
      onSelect: closeMenu
    },
    {
      label: t('nav.aiApps'),
      icon: 'i-lucide-cpu',
      to: localePath('/ai-apps'),
      onSelect: closeMenu
    }
  ]
})

const orgAdminLinks = computed<NavigationMenuItem[]>(() => {
  if (!auth.currentOrgId.value || !auth.isAuthenticated.value || !auth.isAdmin.value) return []
  return [
    {
      label: t('nav.aiAgents'),
      icon: 'i-lucide-shopping-cart',
      to: localePath('/agent-store'),
      onSelect: closeMenu
    },
    {
      label: t('nav.settings'),
      icon: 'i-lucide-settings',
      to: localePath('/settings'),
      defaultOpen: true,
      type: 'trigger',
      children: [
        {
          label: t('nav.general'),
          icon: 'i-lucide-blocks',
          to: localePath('/settings'),
          exact: true,
          onSelect: closeMenu
        },
        {
          label: t('nav.members'),
          icon: 'i-lucide-contact',
          to: localePath('/settings/members'),
          onSelect: closeMenu
        },
        {
          label: t('nav.llmConfigs'),
          icon: 'i-lucide-cable',
          to: localePath('/settings/llm-configs'),
          onSelect: closeMenu
        },
        {
          label: t('nav.aiApps'),
          icon: 'i-lucide-cpu',
          to: localePath('/settings/ai-apps'),
          onSelect: closeMenu
        },
        {
          label: t('nav.centralPoints'),
          icon: 'i-lucide-radio',
          to: localePath('/settings/central-points'),
          onSelect: closeMenu
        }
      ]
    }
  ]
})

const systemLinks = computed<NavigationMenuItem[]>(() => {
  if (!auth.isSysAdmin.value) return []
  return [
    {
      label: t('nav.system'),
      icon: 'i-lucide-shield-check',
      type: 'trigger',
      defaultOpen: false,
      children: [
        {
          label: t('nav.organizations'),
          icon: 'i-lucide-building',
          to: localePath('/admin/orgs'),
          onSelect: closeMenu
        },
        {
          label: t('nav.users'),
          icon: 'i-lucide-users',
          to: localePath('/admin/users'),
          onSelect: closeMenu
        },
        {
          label: t('nav.systemPlugins'),
          icon: 'i-lucide-shopping-bag',
          to: localePath('/admin/agent-store'),
          onSelect: closeMenu
        },
        {
          label: t('nav.globalSettings'),
          icon: 'i-lucide-sliders',
          to: localePath('/admin/settings'),
          onSelect: closeMenu
        },
        {
          label: t('nav.pool'),
          icon: 'i-lucide-server',
          to: localePath('/admin/pool'),
          onSelect: closeMenu
        },
        {
          label: t('nav.health'),
          icon: 'i-lucide-activity',
          to: localePath('/admin/health'),
          onSelect: closeMenu
        }
      ]
    }
  ]
})

const mainLinks = computed(() => {
  const links: NavigationMenuItem[] = [...baseLinks.value, ...orgAdminLinks.value]
  if (systemLinks.value.length) {
    links.push(...systemLinks.value)
  }
  return links
})
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-neutral-50/20">
    <UDashboardGroup unit="rem" class="border-accented min-h-0 flex-1 border-dotted bg-neutral-50/10 p-2">
      <UDashboardSidebar
        id="default"
        v-model:open="open"
        :default-size="20"
        :max-size="24"
        mode="drawer"
        :ui="{
          header: 'border-accented border-dotted h-(--ui-header-height) shrink-0 flex items-center gap-1.5 px-4',
          body: 'flex flex-col gap-4 overflow-y-auto px-4 py-2 border-0',
          footer: 'mt-auto shrink-0 flex items-center gap-1.5 px-4 py-2 border-0'
        }"
        class="border-accented supports-backdrop-filter:bg-default/40 hover:-translate-y-0.6 text overflow-hidden rounded-3xl border border-dotted shadow-md backdrop-blur transition-all duration-300 hover:shadow-xl"
        collapsible
      >
        <template #header="{ collapsed }">
          <div class="flex w-full items-center gap-1.5">
            <div class="min-w-0 flex-1">
              <OrgMenu :collapsed="collapsed" />
            </div>
          </div>
        </template>

        <template #default="{ collapsed }">
          <div class="flex flex-1 flex-col">
            <UNavigationMenu
              :collapsed="collapsed"
              :items="mainLinks"
              :ui="{ root: 'gap-2' }"
              class="flex-1"
              orientation="vertical"
              popover
              tooltip
            />
          </div>
        </template>

        <template #footer="{ collapsed }">
          <div class="flex w-full items-center gap-1.5">
            <div class="min-w-0 flex-1">
              <UserMenu :collapsed="collapsed" />
              <AppVersionInfo v-if="!collapsed" :collapsed="collapsed" class="shrink-0" />
            </div>
          </div>
        </template>
      </UDashboardSidebar>
      <slot />
    </UDashboardGroup>
  </div>
</template>

<style>
#dashboard-sidebar-default {
  min-height: 0 !important;
  align-self: stretch;
}
</style>
