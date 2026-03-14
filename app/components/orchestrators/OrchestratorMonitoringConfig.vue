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

const props = defineProps<{
  modelValue: MonitoringConfig
}>()

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
  if (!secret_key?.trim()) missing.push(t('orchestrators.edit.langfuseSecretKey'))
  if (!public_key?.trim()) missing.push(t('orchestrators.edit.langfusePublicKey'))
  if (!host?.trim()) missing.push(t('orchestrators.edit.langfuseHost'))
  if (missing.length > 0) {
    return { valid: false, message: t('orchestrators.edit.langfuseFieldsRequired') }
  }
  return { valid: true }
}

defineExpose({ validate })
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <UCheckbox v-model="enabled" :label="t('orchestrators.edit.enableMonitoring')" class="mt-1" />
    </div>

    <template v-if="enabled">
      <div v-auto-animate="{ duration: 100 }" class="grid grid-cols-1 gap-4">
        <div>
          <UFormField :label="t('orchestrators.edit.monitoringProvider')" class="sm:col-span-2">
            <USelect v-model="provider" :items="providerOptions" class="w-full" />
          </UFormField>
        </div>

        <template v-if="provider === 'langfuse'">
          <div>
            <UFormField :label="t('orchestrators.edit.langfuseSecretKey')" class="sm:col-span-2" required>
              <UInput v-model="secretKey" type="password" class="w-full" :placeholder="t('orchestrators.edit.langfuseSecretKeyPlaceholder')" />
            </UFormField>
          </div>
          <div>
            <UFormField :label="t('orchestrators.edit.langfusePublicKey')" required>
              <UInput v-model="publicKey" class="w-full" :placeholder="t('orchestrators.edit.langfusePublicKeyPlaceholder')" />
            </UFormField>
          </div>
          <div>
            <UFormField :label="t('orchestrators.edit.langfuseHost')" required>
              <UInput v-model="host" class="w-full" :placeholder="t('orchestrators.edit.langfuseHostPlaceholder')" />
            </UFormField>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
