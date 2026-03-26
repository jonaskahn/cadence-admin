<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

import type { OrchestratorResponse } from '~/types'
import { getApiErrorMessage } from '~/utils'

const props = defineProps<{
  orgId: string
  orchestrators: OrchestratorResponse[]
}>()

const emit = defineEmits<{ close: [] }>()

function handleClose() {
  emit('close')
}

const toast = useToast()
const { t } = useI18n()
const { create } = useCentralPoints(computed(() => props.orgId))
const { withOverlay } = useLoadingOverlay()
const loading = ref(false)

const schema = computed(() =>
  z.object({
    name: z
      .string()
      .min(1, { error: () => t('common.nameRequired') })
      .max(255),
    description: z.string().optional(),
    orchestrator_id: z.string().min(1, { error: () => t('centralPoints.aiAppRequired') }),
    visibility: z.enum(['public', 'private'])
  })
)

type Schema = {
  name: string
  description?: string
  orchestrator_id: string
  visibility: 'public' | 'private'
}

const state = reactive<Schema>({
  name: '',
  description: '',
  orchestrator_id: '',
  visibility: 'private'
})

const orchestratorOptions = computed(() =>
  (props.orchestrators || [])
    .filter((o) => o.status === 'active' && !o.is_deleted)
    .map((o) => ({ label: o.name, value: o.instance_id }))
)

const visibilityItems = computed(() => [
  { label: t('centralPoints.visibilityPrivate'), value: 'private' },
  { label: t('centralPoints.visibilityPublic'), value: 'public' }
])

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await withOverlay(async () => {
      await create({
        name: event.data.name,
        description: event.data.description ?? null,
        orchestrator_id: event.data.orchestrator_id,
        visibility: event.data.visibility
      })
      emit('close')
    })
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, t('centralPoints.failedCreate'))
    toast.add({ title: t('errors.error'), description: msg, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard variant="soft" class="w-full max-w-lg">
    <template #header>
      <p class="font-semibold">{{ t('centralPoints.createTitle') }}</p>
    </template>

    <UForm :schema="schema" :state="state" class="flex flex-col gap-4" @submit="onSubmit">
      <UFormField :label="t('centralPoints.name')" name="name">
        <UInput v-model="state.name" class="w-full" :placeholder="t('centralPoints.namePlaceholder')" />
      </UFormField>
      <UFormField :label="t('settings.description')" name="description">
        <UTextarea
          v-model="state.description"
          class="w-full"
          :placeholder="t('centralPoints.descriptionPlaceholder')"
        />
      </UFormField>
      <UFormField :label="t('centralPoints.aiApp')" name="orchestrator_id">
        <USelect
          v-model="state.orchestrator_id"
          :items="orchestratorOptions"
          class="w-full"
          label-key="label"
          :placeholder="t('centralPoints.selectAiApp')"
          value-key="value"
        />
      </UFormField>
      <UFormField :label="t('centralPoints.visibility')" name="visibility">
        <USelect
          v-model="state.visibility"
          :items="visibilityItems"
          class="w-full"
          label-key="label"
          value-key="value"
        />
      </UFormField>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="handleClose" />
        <UButton color="primary" :loading="loading" :label="t('common.create')" type="submit" />
      </div>
    </UForm>
  </UCard>
</template>
