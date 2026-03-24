<script lang="ts" setup>
import { DEFAULT_TEMPERATURE_SELECT_VALUES, NULL_TEMPERATURE_SELECT_VALUE, snapTemperatureToSelectStep } from './llmTemperaturePresets'

/** Temperature USelect: 0–2 step 0.1; optional first row for null (inherit / none). */
const modelValue = defineModel<number | null>({ default: null })

const props = withDefaults(
  defineProps<{
    nullable?: boolean
    /** Shown as first option when `nullable` is true. */
    nullOptionLabel?: string
    disabled?: boolean
  }>(),
  {
    nullable: false,
    nullOptionLabel: '',
    disabled: false
  }
)

type SelectItem = { label: string; value: number | typeof NULL_TEMPERATURE_SELECT_VALUE }

const selectItems = computed((): SelectItem[] => {
  const numeric = DEFAULT_TEMPERATURE_SELECT_VALUES.map((v) => ({
    label: v.toFixed(1),
    value: v
  }))
  if (props.nullable) {
    return [{ label: props.nullOptionLabel || '—', value: NULL_TEMPERATURE_SELECT_VALUE }, ...numeric]
  }
  return numeric
})

const localSelect = computed({
  get: () => {
    const v = modelValue.value
    if (props.nullable && (v == null || Number.isNaN(Number(v)))) {
      return NULL_TEMPERATURE_SELECT_VALUE
    }
    if (!props.nullable && (v == null || Number.isNaN(Number(v)))) {
      return snapTemperatureToSelectStep(0.2)
    }
    return snapTemperatureToSelectStep(Number(v))
  },
  set: (v: number | typeof NULL_TEMPERATURE_SELECT_VALUE) => {
    if (v === NULL_TEMPERATURE_SELECT_VALUE) {
      modelValue.value = null
      return
    }
    modelValue.value = snapTemperatureToSelectStep(Number(v))
  }
})
</script>

<template>
  <USelect v-model="localSelect" :items="selectItems" :disabled="disabled" class="w-full min-w-0" label-key="label" value-key="value" />
</template>
