<script lang="ts" setup>
import type { OrganizationResponse } from '~/types'
import { subscriptionTierColor } from '~/utils'

defineProps<{
  organization: OrganizationResponse
}>()

const { t } = useI18n()
</script>

<template>
  <UCard variant="soft">
    <template #header>
      <p class="font-semibold">{{ t('admin.details') }}</p>
    </template>
    <dl class="grid grid-cols-2 gap-4">
      <div>
        <dt class="text-dimmed text-sm">{{ t('admin.orgId') }}</dt>
        <dd class="font-mono text-sm mt-1">{{ organization.org_id }}</dd>
      </div>
      <div>
        <dt class="text-dimmed text-sm">{{ t('dashboard.status') }}</dt>
        <dd class="mt-1">
          <UBadge :color="organization.status === 'active' ? 'success' : 'neutral'" size="sm" variant="subtle">
            {{ organization.status }}
          </UBadge>
        </dd>
      </div>
      <div>
        <dt class="text-dimmed text-sm">{{ t('admin.slugName') }}</dt>
        <dd class="font-mono text-sm mt-1">{{ organization.name }}</dd>
      </div>
      <div>
        <dt class="text-dimmed text-sm">{{ t('settings.domain') }}</dt>
        <dd class="font-mono text-sm mt-1">{{ organization.domain || t('common.empty') }}</dd>
      </div>
      <div>
        <dt class="text-dimmed text-sm">{{ t('settings.subscriptionTier') }}</dt>
        <dd class="mt-1">
          <UBadge :color="subscriptionTierColor(organization.tier)" size="sm" variant="subtle">
            {{ organization.tier?.toUpperCase() }}
          </UBadge>
        </dd>
      </div>
    </dl>
  </UCard>
</template>
