<script lang="ts">
export interface MonitoringConfig {
  enabled: boolean
  provider: string
  langfuse: {
    secret_key: string
    public_key: string
    host: string
  }
}
</script>

<script lang="ts" setup>
const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    modelValue: MonitoringConfig
    /** When true, the enable switch is not shown (controlled by parent, e.g. card header). */
    hideHeaderSwitch?: boolean
  }>(),
  {
    hideHeaderSwitch: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: MonitoringConfig]
}>()

const providerOptions = [{ label: 'Langfuse', value: 'langfuse' }]

const enabled = computed({
  get: () => props.modelValue.enabled,
  set: (val: boolean) => emit('update:modelValue', { ...props.modelValue, enabled: val })
})

const provider = computed({
  get: () => props.modelValue.provider,
  set: (val: string) => emit('update:modelValue', { ...props.modelValue, provider: val })
})

const secretKey = computed({
  get: () => props.modelValue.langfuse.secret_key,
  set: (val: string) => emit('update:modelValue', { ...props.modelValue, langfuse: { ...props.modelValue.langfuse, secret_key: val } })
})

const publicKey = computed({
  get: () => props.modelValue.langfuse.public_key,
  set: (val: string) => emit('update:modelValue', { ...props.modelValue, langfuse: { ...props.modelValue.langfuse, public_key: val } })
})

const host = computed({
  get: () => props.modelValue.langfuse.host,
  set: (val: string) => emit('update:modelValue', { ...props.modelValue, langfuse: { ...props.modelValue.langfuse, host: val } })
})

function validate(): { valid: boolean; message?: string } {
  if (!props.modelValue.enabled) return { valid: true }
  if (props.modelValue.provider !== 'langfuse') return { valid: true }
  const { secret_key, public_key, host } = props.modelValue.langfuse
  const missing: string[] = []
  if (!secret_key?.trim()) missing.push(t('aiApps.edit.langfuseSecretKey'))
  if (!public_key?.trim()) missing.push(t('aiApps.edit.langfusePublicKey'))
  if (!host?.trim()) missing.push(t('aiApps.edit.langfuseHost'))
  if (missing.length > 0) {
    return { valid: false, message: t('aiApps.edit.langfuseFieldsRequired') }
  }
  return { valid: true }
}

defineExpose({ validate })
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="!hideHeaderSwitch" class="flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <USwitch v-model="enabled" />
        <span class="text-sm">{{ t('aiApps.edit.enableMonitoring') }}</span>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4">
      <div>
        <UFormField :label="t('aiApps.edit.monitoringProvider')" class="sm:col-span-2">
          <USelect v-model="provider" :disabled="!enabled" :items="providerOptions" class="w-full" />
        </UFormField>
      </div>

      <template v-if="provider === 'langfuse'">
        <div>
          <UFormField :label="t('aiApps.edit.langfuseSecretKey')" class="sm:col-span-2" required>
            <UInput v-model="secretKey" type="password" class="w-full" :disabled="!enabled" :placeholder="t('aiApps.edit.langfuseSecretKeyPlaceholder')" />
          </UFormField>
        </div>
        <div>
          <UFormField :label="t('aiApps.edit.langfusePublicKey')" required>
            <UInput v-model="publicKey" class="w-full" :disabled="!enabled" :placeholder="t('aiApps.edit.langfusePublicKeyPlaceholder')" />
          </UFormField>
        </div>
        <div>
          <UFormField :label="t('aiApps.edit.langfuseHost')" required>
            <UInput v-model="host" class="w-full" :disabled="!enabled" :placeholder="t('aiApps.edit.langfuseHostPlaceholder')" />
          </UFormField>
        </div>
      </template>
    </div>
  </div>
</template>
