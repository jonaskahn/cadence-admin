<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const auth = useAuth()
useDashboard()

const open = ref(false)

const closeMenu = () => {
  open.value = false
}

const baseLinks = computed<NavigationMenuItem[]>(() => {
  if (!auth.currentOrgId.value) return []
  return [
    {
      label: 'Dashboard',
      icon: 'i-lucide-layout-dashboard',
      to: '/dashboard',
      onSelect: closeMenu
    },
    {
      label: 'Chat',
      icon: 'i-lucide-message-square',
      to: '/chat',
      onSelect: closeMenu
    },
    {
      label: 'Orchestrators',
      icon: 'i-lucide-cpu',
      to: '/orchestrators',
      onSelect: closeMenu
    }
  ]
})

const orgAdminLinks = computed<NavigationMenuItem[]>(() => {
  if (!auth.currentOrgId.value || !auth.isOrgAdmin.value) return []
  return [
    {
      label: 'Plugins',
      icon: 'i-lucide-puzzle',
      to: '/plugins',
      onSelect: closeMenu
    },
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      to: '/settings',
      defaultOpen: true,
      type: 'trigger',
      children: [
        {
          label: 'General',
          to: '/settings',
          exact: true,
          onSelect: closeMenu
        },
        {
          label: 'Members',
          to: '/settings/members',
          onSelect: closeMenu
        },
        {
          label: 'LLM Configs',
          to: '/settings/llm-configs',
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
      label: 'System',
      icon: 'i-lucide-shield-check',
      type: 'trigger',
      defaultOpen: false,
      children: [
        {
          label: 'Organizations',
          icon: 'i-lucide-building',
          to: '/admin/orgs',
          onSelect: closeMenu
        },
        {
          label: 'Users',
          icon: 'i-lucide-users',
          to: '/admin/users',
          onSelect: closeMenu
        },
        {
          label: 'System Plugins',
          icon: 'i-lucide-package',
          to: '/admin/plugins',
          onSelect: closeMenu
        },
        {
          label: 'Global Settings',
          icon: 'i-lucide-sliders',
          to: '/admin/settings',
          onSelect: closeMenu
        },
        {
          label: 'Pool',
          icon: 'i-lucide-server',
          to: '/admin/pool',
          onSelect: closeMenu
        },
        {
          label: 'Health',
          icon: 'i-lucide-activity',
          to: '/admin/health',
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
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <OrgMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <USeparator type="dashed" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="mainLinks"
          orientation="vertical"
          tooltip
          popover
          class="flex-1"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
