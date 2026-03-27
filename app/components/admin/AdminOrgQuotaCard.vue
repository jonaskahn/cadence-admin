<script lang="ts" setup>
import { subscriptionTierColor } from '~/utils'

defineProps<{
  quotaRows: { label: string; value: string | number }[]
  isPreviewingTier: boolean
  previewTier: string | null | undefined
}>()

const { t } = useI18n()
</script>

<template>
  <UCard variant="soft">
    <template #header>
      <div class="flex items-center gap-2">
        <p class="font-semibold">{{ t('admin.tierQuota') }}</p>
        <UBadge v-if="isPreviewingTier" :color="subscriptionTierColor(previewTier ?? '')" size="sm" variant="soft">
          {{ t('admin.preview') }}: {{ previewTier?.toUpperCase() }}
        </UBadge>
      </div>
    </template>
    <dl class="grid grid-cols-2 gap-4">
      <div v-for="row in quotaRows" :key="row.label">
        <dt class="text-dimmed text-sm">{{ row.label }}</dt>
        <dd class="mt-1 font-mono text-sm">{{ row.value }}</dd>
      </div>
    </dl>
  </UCard>
</template>
