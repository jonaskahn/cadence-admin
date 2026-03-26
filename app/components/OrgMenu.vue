<script lang="ts" setup>
import type { DropdownMenuItem } from '@nuxt/ui'

import type { OrgAccessResponse } from '~/types'
import { orgDisplayName, subscriptionTierColor } from '~/utils'

type OrgDropdownItem = DropdownMenuItem & { org?: OrgAccessResponse }

defineProps<{
  collapsed?: boolean
}>()

const auth = useAuth()
const { t } = useI18n()
const localePath = useLocalePath()

const items = computed<OrgDropdownItem[][]>(() => {
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

function orgTier(item: unknown): string | undefined {
  const tier = (item as OrgDropdownItem).org?.tier
  return tier ?? undefined
}
</script>

<template>
  <UDropdownMenu
    :content="{ align: 'center', collisionPadding: 12 }"
    :items="items"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <template #org-trailing="{ item }">
      <UBadge v-if="orgTier(item)" :color="subscriptionTierColor(orgTier(item)!)" size="sm" variant="solid">
        {{ orgTier(item)!.toUpperCase() }}
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
    >
      <template v-if="!collapsed" #default>
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <span class="truncate">{{ currentOrgName }}</span>
          <UBadge
            v-if="auth.currentOrg.value?.tier"
            :color="subscriptionTierColor(auth.currentOrg.value.tier)"
            size="sm"
            variant="solid"
          >
            {{ auth.currentOrg.value.tier.toUpperCase() }}
          </UBadge>
        </div>
      </template>
    </UButton>
  </UDropdownMenu>
</template>
