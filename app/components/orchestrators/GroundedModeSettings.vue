<script lang="ts" setup>
const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    modelValue?: {
      scope_rules?: string
      max_tool_rounds?: number
      enabled_validator?: boolean
    }
    disabled?: boolean
  }>(),
  {
    modelValue: () => ({}),
    disabled: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

const scopeRules = ref(props.modelValue?.scope_rules ?? '')
const maxToolRounds = ref(props.modelValue?.max_tool_rounds ?? 5)
const enabledValidator = ref(props.modelValue?.enabled_validator ?? true)

watch(
  () => props.modelValue,
  (val) => {
    if (!val) return
    scopeRules.value = val.scope_rules ?? ''
    maxToolRounds.value = val.max_tool_rounds ?? 5
    enabledValidator.value = val.enabled_validator ?? true
  },
  { immediate: true, deep: true }
)

function emitUpdate() {
  emit('update:modelValue', {
    scope_rules: scopeRules.value,
    max_tool_rounds: maxToolRounds.value,
    enabled_validator: enabledValidator.value
  })
}

watch([scopeRules, maxToolRounds, enabledValidator], emitUpdate, { deep: true, immediate: true })

defineExpose({
  getValue: () => ({
    scope_rules: scopeRules.value,
    max_tool_rounds: maxToolRounds.value,
    enabled_validator: enabledValidator.value
  })
})
</script>

<template>
  <div class="flex flex-col gap-4 min-w-0">
    <UFormField :label="t('orchestrators.grounded.scopeRules')" :description="t('orchestrators.grounded.scopeRulesDesc')">
      <UTextarea v-model="scopeRules" :disabled="disabled" :placeholder="t('orchestrators.grounded.scopeRulesPlaceholder')" :rows="3" class="w-full" />
    </UFormField>

    <UFormField :label="t('orchestrators.grounded.maxToolRounds')" :description="t('orchestrators.grounded.maxToolRoundsDesc')">
      <UInput v-model.number="maxToolRounds" :disabled="disabled" :min="1" :max="20" type="number" class="w-full" />
    </UFormField>

    <div class="flex items-center justify-between gap-4 rounded-lg border border-default p-3">
      <div class="flex flex-col gap-0.5 min-w-0">
        <span class="text-sm font-medium">{{ t('orchestrators.grounded.enabledValidator') }}</span>
        <span class="text-xs text-dimmed">{{ t('orchestrators.grounded.enabledValidatorDesc') }}</span>
      </div>
      <UCheckbox v-model="enabledValidator" :disabled="disabled" />
    </div>
  </div>
</template>
