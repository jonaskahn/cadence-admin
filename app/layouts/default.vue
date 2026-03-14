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
      icon: 'i-lucide-puzzle',
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
  <UDashboardGroup unit="rem">
    <UDashboardSidebar id="default" v-model:open="open" :ui="{ footer: 'lg:border-t lg:border-default' }" class="bg-elevated/25" collapsible resizable>
      <template #header="{ collapsed }">
        <OrgMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <USeparator type="dashed" />

        <UNavigationMenu :collapsed="collapsed" :items="mainLinks" class="flex-1" orientation="vertical" popover tooltip />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
