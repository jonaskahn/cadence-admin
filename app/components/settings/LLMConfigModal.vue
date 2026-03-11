<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { getApiErrorMessage, LLM_PROVIDERS } from '~/utils'
import type { LLMConfigResponse } from '~/types'

const props = defineProps<{
  orgId: string
  initialValue?: LLMConfigResponse // present → edit mode
}>()
const emit = defineEmits<{ close: [] }>()
const toast = useToast()
const { t } = useI18n()
const loading = ref(false)
const llmConfigFormRef = ref<{ $el?: { requestSubmit?: () => void } } | null>(null)

function providerLabel(provider: string): string {
  const key = `providers.${provider}`
  const val = t(key)
  return val !== key ? val : provider
}

const isEdit = computed(() => !!props.initialValue)
const provider = computed(() => (isEdit.value ? props.initialValue!.provider : state.provider))
const isAzure = computed(() => provider.value === 'azure')

const providerOptions = computed(() => LLM_PROVIDERS.map((p) => ({ label: providerLabel(p), value: p })))

const schema = computed(() =>
  z.object({
    name: z.string().min(1, () => t('common.nameRequired')),
    ...(isEdit.value ? {} : { provider: z.string().min(1, () => t('llmConfig.providerRequired')) }),
    api_key: isEdit.value ? z.string().optional() : z.string().min(1, () => t('llmConfig.apiKeyRequired')),
    base_url: z.string().optional(),
    api_version: z.string().optional()
  })
)

type Schema = z.output<ReturnType<typeof schema>>

const state = reactive<Record<string, string>>({
  name: props.initialValue?.name ?? '',
  provider: props.initialValue?.provider ?? 'openai',
  api_key: '',
  base_url: props.initialValue?.base_url ?? '',
  api_version: (props.initialValue?.additional_config?.api_version as string) ?? ''
})

async function submitEdit(data: Schema): Promise<void> {
  const body: Record<string, unknown> = { name: data.name, base_url: data.base_url || null }
  if (data.api_key) body.api_key = data.api_key
  if (isAzure.value) body.additional_config = data.api_version ? { api_version: data.api_version } : null
  await $fetch(`/api/orgs/${props.orgId}/llm-configs/${props.initialValue!.id}`, { method: 'PATCH', body })
  toast.add({ title: t('llmConfig.configUpdated'), icon: 'i-lucide-check', color: 'success' })
}

async function submitCreate(data: Schema): Promise<void> {
  const body: Record<string, unknown> = {
    name: data.name,
    provider: data.provider,
    api_key: data.api_key,
    base_url: data.base_url || null
  }
  if (isAzure.value && data.api_version) body.additional_config = { api_version: data.api_version }
  await $fetch(`/api/orgs/${props.orgId}/llm-configs`, { method: 'POST', body })
  toast.add({ title: t('llmConfig.configAdded'), icon: 'i-lucide-check', color: 'success' })
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    if (isEdit.value) await submitEdit(event.data)
    else await submitCreate(event.data)
    emit('close')
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, isEdit.value ? t('llmConfig.failedUpdateConfig') : t('llmConfig.failedAddConfig'))
    toast.add({ title: t('errors.error'), description: msg, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-lg">
    <template #header>
      <p class="font-semibold">
        {{ isEdit ? t('llmConfig.editTitle') : t('llmConfig.addTitle') }}
      </p>
    </template>

    <UForm ref="llmConfigFormRef" :schema="schema" :state="state" class="flex flex-col gap-4" @submit="onSubmit">
      <UFormField :description="t('llmConfig.configNameDescription')" :label="t('llmConfig.configName')" name="name">
        <UInput v-model="state.name" class="w-full" :placeholder="t('llmConfig.primaryPlaceholder')" />
      </UFormField>

      <UFormField :label="t('llmConfig.provider')" name="provider">
        <div v-if="isEdit" class="text-sm py-1.5 text-muted">
          {{ providerLabel(provider) }}
        </div>
        <USelect v-else v-model="state.provider" :items="providerOptions" class="w-full" value-key="value" label-key="label" />
      </UFormField>

      <UFormField :description="isEdit ? undefined : undefined" :required="!isEdit" :label="t('llmConfig.apiKey')" name="api_key">
        <UInput v-model="state.api_key" class="w-full" :placeholder="t('llmConfig.apiKeyPlaceholder')" type="password" />
      </UFormField>

      <UFormField :description="t('llmConfig.baseUrlDescription')" :label="t('llmConfig.baseUrl')" name="base_url">
        <UInput v-model="state.base_url" class="w-full" :placeholder="t('llmConfig.baseUrlPlaceholder')" />
      </UFormField>

      <UFormField v-if="isAzure" :description="t('llmConfig.apiVersionDescription')" :label="t('llmConfig.apiVersion')" name="api_version">
        <UInput v-model="state.api_version" class="w-full" :placeholder="t('llmConfig.apiVersionPlaceholder')" />
      </UFormField>

      <div class="flex justify-end gap-2">
        <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="emit('close')" />
        <UPopover>
          <UButton type="button" :label="isEdit ? t('llmConfig.saveChanges') : t('settings.addConfig')" />
          <template #content="{ close }">
            <div class="p-4 min-w-48">
              <p class="text-sm text-dimmed mb-3">{{ t('common.saveConfirm') }}</p>
              <div class="flex justify-end gap-2">
                <UButton color="neutral" variant="ghost" :label="t('common.cancel')" @click="close" />
                <UButton
                  :loading="loading"
                  :label="isEdit ? t('llmConfig.saveChanges') : t('settings.addConfig')"
                  @click="llmConfigFormRef?.$el?.requestSubmit?.(); close()"
                />
              </div>
            </div>
          </template>
        </UPopover>
      </div>
    </UForm>
  </UCard>
</template>
