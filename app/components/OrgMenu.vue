<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const auth = useAuth()

const items = computed<DropdownMenuItem[][]>(() => {
  const orgItems = auth.orgList.value.map((org) => ({
    label: org.org_name,
    icon: org.org_id === auth.currentOrgId.value ? 'i-lucide-check' : undefined,
    onSelect() {
      auth.selectOrg(org.org_id)
    }
  }))

  return [
    orgItems,
    [
      {
        label: 'Select organization',
        icon: 'i-lucide-building',
        to: '/org-select'
      }
    ]
  ]
})

const currentOrgName = computed(() => auth.currentOrg.value?.org_name || 'Select org')
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :label="collapsed ? undefined : currentOrgName"
      leading-icon="i-lucide-building-2"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :class="[!collapsed && 'py-2']"
      :ui="{ trailingIcon: 'text-dimmed' }"
    />
  </UDropdownMenu>
</template>
