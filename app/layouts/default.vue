<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const auth = useAuth()
useDashboard()

const open = ref(false)

const baseLinks = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/dashboard',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Chat',
    icon: 'i-lucide-message-square',
    to: '/chat',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Orchestrators',
    icon: 'i-lucide-cpu',
    to: '/orchestrators',
    onSelect: () => {
      open.value = false
    }
  }
])

const orgAdminLinks = computed<NavigationMenuItem[]>(() => {
  if (!auth.isOrgAdmin.value) return []
  return [
    {
      label: 'Plugins',
      icon: 'i-lucide-puzzle',
      to: '/plugins',
      onSelect: () => {
        open.value = false
      }
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
          onSelect: () => {
            open.value = false
          }
        },
        {
          label: 'Members',
          to: '/settings/members',
          onSelect: () => {
            open.value = false
          }
        },
        {
          label: 'LLM Configs',
          to: '/settings/llm-configs',
          onSelect: () => {
            open.value = false
          }
        }
      ]
    }
  ]
})

const adminLinks = computed<NavigationMenuItem[]>(() => {
  if (!auth.isSysAdmin.value) return []
  return [
    {
      label: 'Admin',
      icon: 'i-lucide-shield-check',
      type: 'trigger',
      defaultOpen: false,
      children: [
        {
          label: 'Organizations',
          icon: 'i-lucide-building',
          to: '/admin/orgs',
          onSelect: () => {
            open.value = false
          }
        },
        {
          label: 'Users',
          icon: 'i-lucide-users',
          to: '/admin/users',
          onSelect: () => {
            open.value = false
          }
        },
        {
          label: 'System Plugins',
          icon: 'i-lucide-package',
          to: '/admin/plugins',
          onSelect: () => {
            open.value = false
          }
        },
        {
          label: 'Global Settings',
          icon: 'i-lucide-sliders',
          to: '/admin/settings',
          onSelect: () => {
            open.value = false
          }
        },
        {
          label: 'Pool',
          icon: 'i-lucide-server',
          to: '/admin/pool',
          onSelect: () => {
            open.value = false
          }
        },
        {
          label: 'Health',
          icon: 'i-lucide-activity',
          to: '/admin/health',
          onSelect: () => {
            open.value = false
          }
        }
      ]
    }
  ]
})

const mainLinks = computed(() => [...baseLinks.value, ...orgAdminLinks.value, ...adminLinks.value])
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
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

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
