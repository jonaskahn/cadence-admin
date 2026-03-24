<script lang="ts" setup>
import type { GlobalSettingResponse } from '~/types'

const props = withDefaults(
  defineProps<{
    setting: GlobalSettingResponse
    modelValue: unknown
    overridable: boolean
    showOverridableToggle: boolean
    saving: boolean
    hideSave?: boolean
  }>(),
  { hideSave: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
  'update:overridable': [value: boolean]
  save: []
}>()

const localValue = computed({
  get: () => props.modelValue,
  set: (v: unknown) => emit('update:modelValue', v)
})

const localOverridable = computed({
  get: () => props.overridable,
  set: (v: boolean) => emit('update:overridable', v)
})

const { t } = useI18n()
</script>

<template>
  <div class="py-4 flex items-start gap-4">
    <div class="flex-1">
      <p class="font-medium text-sm">{{ setting.description }}</p>
      <p class="text-dimmed text-xs font-mono mt-0.5">{{ setting.key }}</p>
      <UBadge class="mt-1" size="xs" variant="subtle">{{ setting.value_type }}</UBadge>
    </div>
    <div class="flex items-center gap-4">
      <div v-if="showOverridableToggle" class="flex items-center gap-1.5">
        <USwitch v-model="localOverridable" size="sm" />
        <span class="text-xs text-dimmed">{{ t('admin.overridable') }}</span>
      </div>
      <div class="flex items-center gap-2 min-w-56">
        <SettingInput v-model="localValue" :value-type="setting.value_type" size="sm" class="flex-1" />
        <ConfirmActionPopover
          v-if="!hideSave"
          label-key="common.save"
          size="sm"
          confirm-title-key="common.saveConfirmTitle"
          confirm-message-key="common.saveConfirmMessage"
          confirm-label-key="common.saveConfirmFriendly"
          :loading="saving"
          :on-confirm="() => emit('save')"
        />
      </div>
    </div>
  </div>
</template>
