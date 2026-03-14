<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { getApiErrorMessage, LLM_PROVIDERS } from '~/utils'
import type { AddProviderModelRequest, ProviderModelCatalogEntry, UpdateProviderModelRequest } from '~/types'

const props = defineProps<{
  initialValue?: ProviderModelCatalogEntry
}>()

const emit = defineEmits<{
  close: []
}>()

function handleClose() {
  emit('close')
}

const toast = useToast()
const { t } = useI18n()
const loading = ref(false)
const providerModelFormRef = ref<{ $el?: { requestSubmit?: () => void } } | null>(null)

function providerLabel(provider: string): string {
  const key = `providers.${provider}`
  const val = t(key)
  return val !== key ? val : provider
}

const isEdit = computed(() => !!props.initialValue)

const providerItems = computed(() => LLM_PROVIDERS.map((p) => ({ label: providerLabel(p), value: p })))

const schema = z.object({
  provider: z.string().min(1, () => t('admin.provider') + ' required'),
  model_id: z.string().min(1, () => t('admin.modelId') + ' required'),
  display_name: z.string().min(1, () => t('admin.displayName') + ' required'),
  aliases: z.string()
})

type Schema = z.output<typeof schema>

const state = reactive({
  provider: props.initialValue?.provider ?? LLM_PROVIDERS[0],
  model_id: props.initialValue?.model_id ?? '',
  display_name: props.initialValue?.display_name ?? '',
  aliases: (props.initialValue?.aliases ?? []).join(', ')
})

function parseAliases(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

async function submitEdit(data: Schema): Promise<void> {
  const body: UpdateProviderModelRequest = {
    display_name: data.display_name,
    aliases: parseAliases(data.aliases)
  }
  await $fetch(`/api/admin/providers/${data.provider}/models/${props.initialValue!.model_id}`, {
    method: 'PATCH',
    body
  })
  toast.add({ title: t('admin.modelUpdated'), icon: 'i-lucide-check', color: 'success' })
}

async function submitCreate(data: Schema): Promise<void> {
  const body: AddProviderModelRequest = {
    model_id: data.model_id,
    display_name: data.display_name,
    aliases: parseAliases(data.aliases)
  }
  await $fetch(`/api/admin/providers/${data.provider}/models`, { method: 'POST', body })
  toast.add({ title: t('admin.modelAdded'), icon: 'i-lucide-check', color: 'success' })
}

async function onSubmit(event: FormSubmitEvent<Schema>): Promise<void> {
  loading.value = true
  try {
    if (isEdit.value) await submitEdit(event.data)
    else await submitCreate(event.data)
    emit('close')
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, isEdit.value ? t('admin.failedUpdateModel') : t('admin.failedAddModel'))
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
        {{ isEdit ? t('admin.editModel') + ': ' + initialValue?.model_id : t('admin.addModel') }}
      </p>
    </template>

    <UForm ref="providerModelFormRef" :schema="schema" :state="state" class="flex flex-col gap-4" @submit="onSubmit">
      <UFormField :label="t('admin.provider')" name="provider" required>
        <div v-if="isEdit" class="text-xs py-1.5 text-dimmed">
          {{ providerLabel(state.provider) }}
        </div>
        <USelect v-else v-model="state.provider" :items="providerItems" value-key="value" label-key="label" class="w-full" />
      </UFormField>

      <UFormField :label="t('admin.modelId')" name="model_id" :required="!isEdit">
        <UInput v-model="state.model_id" :disabled="isEdit" class="w-full" :placeholder="t('admin.modelIdPlaceholder')" />
      </UFormField>

      <UFormField :label="t('admin.displayName')" name="display_name" required>
        <UInput v-model="state.display_name" class="w-full" :placeholder="t('admin.displayNamePlaceholder')" />
      </UFormField>

      <UFormField :label="t('admin.aliases')" name="aliases" :description="t('admin.aliasesDescription')">
        <UInput v-model="state.aliases" class="w-full" :placeholder="t('admin.aliasesPlaceholder')" />
      </UFormField>

      <div class="flex justify-end gap-2">
        <UButton color="neutral" :label="t('common.cancel')" variant="outline" @click="handleClose" />
        <ConfirmActionPopover
          :label-key="isEdit ? 'common.save' : 'admin.addModel'"
          :confirm-title-key="isEdit ? 'common.saveConfirmTitle' : 'admin.addModelTitle'"
          :confirm-message-key="isEdit ? 'common.saveConfirmMessage' : 'admin.addModelMessage'"
          :confirm-label-key="isEdit ? 'common.saveConfirmFriendly' : 'common.addConfirmFriendly'"
          :loading="loading"
          :on-confirm="() => providerModelFormRef?.$el?.requestSubmit?.()"
        />
      </div>
    </UForm>
  </UCard>
</template>
