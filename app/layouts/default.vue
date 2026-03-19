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
      label: t('nav.orchestrators'),
      icon: 'i-lucide-cpu',
      to: localePath('/orchestrators'),
      onSelect: closeMenu
    }
  ]
})

const orgAdminLinks = computed<NavigationMenuItem[]>(() => {
  if (!auth.currentOrgId.value || !auth.isAuthenticated.value || !auth.isAdmin.value) return []
  return [
    {
      label: t('nav.plugins'),
      icon: 'i-lucide-shopping-cart',
      to: localePath('/plugins'),
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
          label: t('nav.orchestrators'),
          icon: 'i-lucide-cpu',
          to: localePath('/settings/orchestrators'),
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
          to: localePath('/admin/plugins'),
          onSelect: closeMenu
        },
        {
          label: t('nav.globalSettings'),
          icon: 'i-lucide-sliders',
          to: localePath('/admin/settings'),
          onSelect: closeMenu
        },
        {
          label: t('nav.telemetry'),
          icon: 'i-lucide-radio-tower',
          to: localePath('/admin/telemetry'),
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

const sidebarVariants = {
  expanded: {
    opacity: 1,
    x: 0,
    transition: { type: 'tween' as const, duration: 1.2, ease: 'easeInOut' as const }
  },
  collapsed: {
    opacity: 0.5,
    x: -4,
    transition: { type: 'tween' as const, duration: 0.8, ease: 'easeInOut' as const }
  }
}

const mainLinks = computed(() => {
  const links: NavigationMenuItem[] = [...baseLinks.value, ...orgAdminLinks.value]
  if (systemLinks.value.length) {
    links.push(...systemLinks.value)
  }
  links.push({
    label: t('nav.about'),
    icon: 'i-lucide-info',
    to: localePath('/about'),
    onSelect: closeMenu
  })
  return links
})
</script>

<template>
  <div class="flex flex-col min-h-dvh bg-default">
    <UDashboardGroup unit="rem" class="flex-1 min-h-0 p-2">
      <UDashboardSidebar
        id="default"
        v-model:open="open"
        :default-size="32"
        :ui="{
          body: 'flex flex-col gap-4 overflow-y-auto px-4 py-2 border-0',
          footer: 'mt-auto shrink-0 flex items-center gap-1.5 px-4 py-2 border-0'
        }"
        class="bg-neutral-100/20 rounded-xl shadow-2xl text overflow-hidden border-0"
        collapsible
        resizable
      >
        <template #header="{ collapsed }">
          <div
            v-motion="{ initial: { opacity: 1, x: 0 }, variants: sidebarVariants, animate: collapsed ? 'collapsed' : 'expanded' }"
            class="flex w-full items-center gap-1.5"
          >
            <div class="min-w-0 flex-1">
              <OrgMenu :collapsed="collapsed" />
            </div>
          </div>
        </template>

        <template #default="{ collapsed }">
          <div
            v-motion="{ initial: { opacity: 1, x: 0 }, variants: sidebarVariants, animate: collapsed ? 'collapsed' : 'expanded' }"
            class="flex-1 flex flex-col"
          >
            <UNavigationMenu :collapsed="collapsed" :items="mainLinks" :ui="{ root: 'gap-2' }" class="flex-1" orientation="vertical" popover tooltip />
          </div>
        </template>

        <template #footer="{ collapsed }">
          <div
            v-motion="{ initial: { opacity: 1, x: 0 }, variants: sidebarVariants, animate: collapsed ? 'collapsed' : 'expanded' }"
            class="flex w-full items-center gap-1.5"
          >
            <div class="min-w-0 flex-1">
              <UserMenu :collapsed="collapsed" />
            </div>
            <AppVersionInfo v-if="!collapsed" :collapsed="collapsed" class="shrink-0" />
          </div>
        </template>
      </UDashboardSidebar>
      <slot />
    </UDashboardGroup>
  </div>
</template>

<style>
/* UDashboardSidebar applies min-h-svh (100svh) which overflows the p-2 padded
   container (causing bottom content to be clipped and hiding border-radius).
   Override so the sidebar fills only the flex height, making rounding visible. */
#dashboard-sidebar-default {
  min-height: 0 !important;
  align-self: stretch;
}
</style>
