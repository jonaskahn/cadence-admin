<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { getApiErrorMessage, LLM_PROVIDERS } from '~/utils'
import { BILLING_UNITS, defaultBillingUnits, MODEL_CATEGORIES, parseOptionalPrice, type BillingUnit, type ModelCategory } from '~/utils/providerModelCatalog'
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
const { withOverlay } = useLoadingOverlay()
const providerModelFormRef = ref<{ $el?: { requestSubmit?: () => void } } | null>(null)

function providerLabel(provider: string): string {
  const key = `providers.${provider}`
  const val = t(key)
  return val !== key ? val : provider
}

const isEdit = computed(() => !!props.initialValue)

const providerItems = computed(() => LLM_PROVIDERS.map((p) => ({ label: providerLabel(p), value: p })))

const categoryItems = computed(() =>
  MODEL_CATEGORIES.map((c) => ({
    label: t(`admin.modelCategory.${c}`),
    value: c
  }))
)

const billingUnitItems = computed(() =>
  BILLING_UNITS.map((u) => ({
    label: t(`admin.billingUnit.${u}`),
    value: u
  }))
)

const schema = computed(() =>
  z.object({
    provider: z.string().min(1, { message: `${t('admin.provider')} required` }),
    model_id: z.string().min(1, { message: `${t('admin.modelId')} required` }),
    display_name: z.string().min(1, { message: `${t('admin.displayName')} required` }),
    aliases: z.string(),
    model_category: z.enum(MODEL_CATEGORIES),
    input_billing_unit: z.enum(BILLING_UNITS),
    output_billing_unit: z.enum(BILLING_UNITS),
    input_price: z.string(),
    output_price: z.string(),
    currency: z
      .string()
      .transform((s) => s.trim().toUpperCase())
      .refine((s) => s.length === 3, { message: t('admin.currencyInvalid') })
  })
)

type ProviderModelFormData = {
  provider: string
  model_id: string
  display_name: string
  aliases: string
  model_category: ModelCategory
  input_billing_unit: BillingUnit
  output_billing_unit: BillingUnit
  input_price: string
  output_price: string
  currency: string
}

const state = reactive({
  provider: LLM_PROVIDERS[0],
  model_id: '',
  display_name: '',
  aliases: '',
  model_category: 'text_generation' as ModelCategory,
  input_billing_unit: 'per_1m_tokens' as BillingUnit,
  output_billing_unit: 'per_1m_tokens' as BillingUnit,
  input_price: '',
  output_price: '',
  currency: 'USD'
})

watch(
  () => props.initialValue,
  (v) => {
    if (v) {
      state.provider = v.provider
      state.model_id = v.model_id
      state.display_name = v.display_name
      state.aliases = (v.aliases ?? []).join(', ')
      state.model_category = v.model_category as ModelCategory
      state.input_billing_unit = v.input_billing_unit as BillingUnit
      state.output_billing_unit = v.output_billing_unit as BillingUnit
      state.input_price = v.input_price_per_unit ?? ''
      state.output_price = v.output_price_per_unit ?? ''
      state.currency = v.currency || 'USD'
    } else {
      state.provider = LLM_PROVIDERS[0]
      state.model_id = ''
      state.display_name = ''
      state.aliases = ''
      state.model_category = 'text_generation'
      const d = defaultBillingUnits('text_generation')
      state.input_billing_unit = d.input
      state.output_billing_unit = d.output
      state.input_price = ''
      state.output_price = ''
      state.currency = 'USD'
    }
  },
  { immediate: true }
)

function onCategoryChange(value: ModelCategory) {
  const d = defaultBillingUnits(value)
  state.input_billing_unit = d.input
  state.output_billing_unit = d.output
}

function onCategorySelect(value: string) {
  if (MODEL_CATEGORIES.includes(value as ModelCategory)) {
    onCategoryChange(value as ModelCategory)
  }
}

function parseAliases(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

async function submitEdit(data: ProviderModelFormData): Promise<void> {
  const body: UpdateProviderModelRequest = {
    display_name: data.display_name,
    aliases: parseAliases(data.aliases),
    model_category: data.model_category,
    input_billing_unit: data.input_billing_unit,
    output_billing_unit: data.output_billing_unit,
    input_price_per_unit: parseOptionalPrice(data.input_price),
    output_price_per_unit: parseOptionalPrice(data.output_price),
    currency: data.currency.toUpperCase()
  }
  await $fetch(`/api/admin/providers/${data.provider}/models/${props.initialValue!.model_id}`, {
    method: 'PATCH',
    body
  })
  toast.add({ title: t('admin.modelUpdated'), icon: 'i-lucide-check', color: 'success' })
}

async function submitCreate(data: ProviderModelFormData): Promise<void> {
  const body: AddProviderModelRequest = {
    model_id: data.model_id,
    display_name: data.display_name,
    aliases: parseAliases(data.aliases),
    model_category: data.model_category,
    input_billing_unit: data.input_billing_unit,
    output_billing_unit: data.output_billing_unit,
    input_price_per_unit: parseOptionalPrice(data.input_price),
    output_price_per_unit: parseOptionalPrice(data.output_price),
    currency: data.currency.toUpperCase()
  }
  await $fetch(`/api/admin/providers/${data.provider}/models`, { method: 'POST', body })
  toast.add({ title: t('admin.modelAdded'), icon: 'i-lucide-check', color: 'success' })
}

async function onSubmit(event: FormSubmitEvent<ProviderModelFormData>): Promise<void> {
  loading.value = true
  try {
    await withOverlay(async () => {
      if (isEdit.value) await submitEdit(event.data)
      else await submitCreate(event.data)
      emit('close')
    })
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, isEdit.value ? t('admin.failedUpdateModel') : t('admin.failedAddModel'))
    toast.add({ title: t('errors.error'), description: msg, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard variant="soft" class="w-full max-w-lg max-h-[90vh] overflow-y-auto">
    <template #header>
      <p class="font-semibold">
        {{ isEdit ? t('admin.editModel') + ': ' + initialValue?.model_id : t('admin.addModel') }}
      </p>
    </template>

    <UForm ref="providerModelFormRef" :schema="schema" :state="state" class="flex flex-col gap-4" @submit="onSubmit">
      <UFormField :label="t('admin.provider')" name="provider" required>
        <div v-if="isEdit" class="py-1.5">
          <UBadge class="accent-primary-50 hover:cursor-no-drop">
            {{ providerLabel(state.provider ?? '') }}
          </UBadge>
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

      <UFormField :label="t('admin.modelCategoryLabel')" name="model_category" :description="t('admin.modelCategoryHint')">
        <USelect
          v-model="state.model_category"
          :items="categoryItems"
          value-key="value"
          label-key="label"
          class="w-full"
          @update:model-value="onCategorySelect"
        />
      </UFormField>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <UFormField :label="t('admin.inputBillingUnit')" name="input_billing_unit">
          <USelect v-model="state.input_billing_unit" :items="billingUnitItems" value-key="value" label-key="label" class="w-full" />
        </UFormField>
        <UFormField :label="t('admin.outputBillingUnit')" name="output_billing_unit">
          <USelect v-model="state.output_billing_unit" :items="billingUnitItems" value-key="value" label-key="label" class="w-full" />
        </UFormField>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <UFormField :label="t('admin.inputPricePerUnit')" name="input_price" :description="t('admin.priceOptionalHint')">
          <UInput v-model="state.input_price" class="w-full" type="text" inputmode="decimal" />
        </UFormField>
        <UFormField :label="t('admin.outputPricePerUnit')" name="output_price" :description="t('admin.priceOptionalHint')">
          <UInput v-model="state.output_price" class="w-full" type="text" inputmode="decimal" />
        </UFormField>
      </div>

      <UFormField :label="t('admin.currency')" name="currency">
        <UInput v-model="state.currency" class="w-full max-w-32" maxlength="3" />
      </UFormField>

      <div class="flex justify-end gap-2">
        <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="handleClose" />
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
