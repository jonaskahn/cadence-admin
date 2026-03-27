<script lang="ts" setup>
/**
 * Model id: catalog USelect when options exist and not in manual mode; otherwise UInput.
 * Use LlmModelNameLabelActions in the parent UFormField #label for manual/catalog toggles.
 */
const modelValue = defineModel<string>({ default: '' })
const manual = defineModel<boolean>('manual', { default: false })

const props = withDefaults(
  defineProps<{
    options: { label: string; value: string }[]
    loading?: boolean
    disabled?: boolean
    /** Native / a11y required when the parent marks the field required */
    required?: boolean
    /** Shown on text input when inheriting / empty */
    placeholder?: string
    /** Shown on select when empty */
    selectPlaceholder?: string
  }>(),
  {
    loading: false,
    disabled: false,
    required: false,
    placeholder: undefined,
    selectPlaceholder: undefined
  }
)

const localModel = computed({
  get: () => modelValue.value ?? '',
  set: (v: string) => {
    modelValue.value = v
  }
})

const showSelect = computed(() => !props.disabled && props.options.length > 0 && !manual.value)

watch(
  () => [manual.value, props.options, modelValue.value] as const,
  () => {
    if (manual.value) return
    const v = modelValue.value?.trim()
    if (!v || !props.options.length) return
    if (!props.options.some((o) => o.value === v)) {
      manual.value = true
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="flex min-w-0 flex-col gap-2">
    <USelect
      v-if="showSelect"
      v-model="localModel"
      :items="options"
      :loading="loading"
      :disabled="disabled"
      :required="required"
      class="w-full"
      clearable
      :placeholder="selectPlaceholder ?? placeholder"
      label-key="label"
      value-key="value"
    />
    <UInput
      v-else
      v-model="localModel"
      :disabled="disabled"
      :required="required"
      class="w-full"
      :placeholder="placeholder"
    />
  </div>
</template>
