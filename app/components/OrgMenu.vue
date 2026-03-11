<script lang="ts" setup>
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const auth = useAuth()
const { t } = useI18n()
const localePath = useLocalePath()

const items = computed<DropdownMenuItem[][]>(() => {
  const orgItems = auth.orgList.value.map((org) => ({
    label: org.org_name,
    icon: org.org_id === auth.currentOrgId.value ? 'i-lucide-check' : 'i-lucide-building',
    onSelect() {
      auth.selectOrg(org.org_id)
    }
  }))

  return [
    orgItems,
    [
      {
        label: t('common.selectOrg'),
        icon: 'i-lucide-building',
        to: localePath('/org-select')
      }
    ]
  ]
})

const currentOrgName = computed(() => auth.currentOrg.value?.org_name || t('common.selectOrgShort'))
</script>

<template>
  <UDropdownMenu
    :content="{ align: 'center', collisionPadding: 12 }"
    :items="items"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :class="[!collapsed && 'py-2']"
      :label="collapsed ? undefined : currentOrgName"
      :square="collapsed"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      :ui="{ trailingIcon: 'text-dimmed' }"
      block
      class="data-[state=open]:bg-elevated"
      color="neutral"
      leading-icon="i-lucide-building"
      variant="ghost"
    />
  </UDropdownMenu>
</template>
