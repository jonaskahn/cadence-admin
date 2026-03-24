<script lang="ts" setup>
/**
 * Feature cards: the header switch is the only “enable” control.
 * `v-model:enabled` is both the saved feature flag (e.g. `monitoring.enabled`) and fold state
 * (body visible when on, hidden when off). There is no separate inner enable toggle when used with `hide-header-switch`.
 */
const props = defineProps<{
  /** Accessible name for the header switch (usually the card title). */
  sectionLabel: string
}>()

const { t } = useI18n()

const enabled = defineModel<boolean>('enabled', { default: false })

const switchAriaLabel = computed(() => `${props.sectionLabel}: ${t('aiApps.featureCards.toggleFeature')}`)
</script>

<template>
  <UCard variant="soft" class="min-w-0 h-full">
    <template #header>
      <div class="flex w-full items-center justify-between gap-3 min-w-0">
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <slot name="header" />
        </div>
        <USwitch v-model="enabled" :aria-label="switchAriaLabel" class="shrink-0" />
      </div>
    </template>

    <div v-show="enabled">
      <slot />
    </div>
  </UCard>
</template>
