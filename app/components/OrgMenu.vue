<script lang="ts" setup>
import type { DropdownMenuItem } from '@nuxt/ui'
import { orgDisplayName, subscriptionTierColor } from '~/utils'

defineProps<{
  collapsed?: boolean
}>()

const auth = useAuth()
const { t } = useI18n()
const localePath = useLocalePath()

const items = computed<DropdownMenuItem[][]>(() => {
  const orgItems = auth.orgList.value.map((org) => ({
    label: orgDisplayName(org),
    icon: org.org_id === auth.currentOrgId.value ? 'i-lucide-check' : 'i-lucide-building',
    slot: 'org' as const,
    org,
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

const currentOrgName = computed(() => orgDisplayName(auth.currentOrg.value) || t('common.selectOrgShort'))
</script>

<template>
  <UDropdownMenu
    :content="{ align: 'center', collisionPadding: 12 }"
    :items="items"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <template #org-trailing="{ item }">
      <UBadge v-if="item?.org?.tier" :color="subscriptionTierColor(item.org.tier)" size="sm" variant="subtle">
        {{ item?.org.tier.toUpperCase() }}
      </UBadge>
    </template>
    <UButton
      :class="[!collapsed && 'py-2']"
      :label="collapsed ? undefined : undefined"
      :square="collapsed"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-down'"
      :ui="{ trailingIcon: 'text-dimmed' }"
      block
      class="data-[state=open]:bg-elevated"
      color="neutral"
      leading-icon="i-lucide-building"
      variant="ghost"
    >
      <template v-if="!collapsed" #default>
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <span class="truncate">{{ currentOrgName }}</span>
          <UBadge v-if="auth.currentOrg.value?.tier" :color="subscriptionTierColor(auth.currentOrg.value.tier)" size="sm" variant="subtle">
            {{ auth.currentOrg.value.tier.toUpperCase() }}
          </UBadge>
        </div>
      </template>
    </UButton>
  </UDropdownMenu>
</template>
