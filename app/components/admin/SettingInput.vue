<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    modelValue: unknown
    valueType: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    class?: string
  }>(),
  { size: 'sm', class: '' }
)

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const isBoolean = computed(() => {
  const t = (props.valueType || 'string').toLowerCase()
  return t === 'boolean' || t === 'bool'
})

const isInteger = computed(() => {
  const t = (props.valueType || 'string').toLowerCase()
  return t === 'integer' || t === 'int' || t === 'number'
})

const isFloat = computed(() => {
  const t = (props.valueType || 'string').toLowerCase()
  return t === 'float' || t === 'double'
})

const boolValue = computed({
  get: () => {
    if (typeof props.modelValue === 'boolean') return props.modelValue
    if (typeof props.modelValue === 'string') return ['true', '1', 'yes', 'on'].includes(props.modelValue.toLowerCase())
    return Boolean(props.modelValue)
  },
  set: (v: boolean) => emit('update:modelValue', v)
})

const numValue = computed({
  get: () => {
    const v = props.modelValue
    if (typeof v === 'number' && !Number.isNaN(v)) return v
    const parsed = Number(v)
    return Number.isNaN(parsed) ? 0 : parsed
  },
  set: (v: number) => emit('update:modelValue', props.valueType?.toLowerCase() === 'float' ? v : Math.round(v))
})

const strValue = computed({
  get: () => (props.modelValue != null ? String(props.modelValue) : ''),
  set: (v: string) => emit('update:modelValue', v)
})
</script>

<template>
  <USwitch v-if="isBoolean" v-model="boolValue" :size="size" :class="props.class" />
  <UInput
    v-else-if="isInteger"
    v-model.number="numValue"
    type="number"
    :size="size"
    :class="props.class"
    class="flex-1"
  />
  <UInput
    v-else-if="isFloat"
    v-model.number="numValue"
    type="number"
    step="0.01"
    :size="size"
    :class="props.class"
    class="flex-1"
  />
  <UInput v-else v-model="strValue" type="text" :size="size" :class="props.class" class="flex-1" />
</template>
