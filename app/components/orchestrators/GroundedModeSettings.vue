<script setup lang="ts">
const { t } = useI18n()

const model = defineModel<Record<string, unknown>>({ required: true })

const scopeRules = computed({
  get: () => String(model.value.scope_rules ?? ''),
  set: (v: string) => {
    model.value = { ...model.value, scope_rules: v }
  }
})

const maxToolRounds = computed({
  get: () => Number(model.value.max_tool_rounds ?? 5),
  set: (v: number) => {
    model.value = { ...model.value, max_tool_rounds: v }
  }
})

const enabledValidator = computed({
  get: () => (model.value.enabled_validator !== undefined ? Boolean(model.value.enabled_validator) : true),
  set: (v: boolean) => {
    model.value = { ...model.value, enabled_validator: v }
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <UFormField :description="t('orchestrators.grounded.scopeRulesDesc')" :label="t('orchestrators.grounded.scopeRules')">
      <UTextarea v-model="scopeRules" class="w-full" :placeholder="t('orchestrators.grounded.scopeRulesPlaceholder')" :rows="4" />
    </UFormField>

    <UFormField :description="t('orchestrators.grounded.maxToolRoundsDesc')" :label="t('orchestrators.grounded.maxToolRounds')">
      <UInput v-model.number="maxToolRounds" class="w-full" :min="1" :max="50" type="number" />
    </UFormField>

    <div class="flex items-center gap-2">
      <USwitch v-model="enabledValidator" />
      <span class="text-sm">{{ t('orchestrators.grounded.enabledValidator') }}</span>
    </div>
    <p class="text-xs text-dimmed">{{ t('orchestrators.grounded.enabledValidatorDesc') }}</p>
  </div>
</template>
