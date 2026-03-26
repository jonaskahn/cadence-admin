<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

import { getApiErrorMessage } from '~/utils'

const props = defineProps<{ orgId: string }>()
const emit = defineEmits<{ close: [] }>()

function handleClose() {
  emit('close')
}

const toast = useToast()
const { t } = useI18n()
const { findUser } = useUserSearch()
const { withOverlay } = useLoadingOverlay()
const loading = ref(false)

const schema = z.object({
  identifier: z.string().min(1, { error: () => t('addMember.identifierRequired') }),
  is_admin: z.boolean()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  identifier: '',
  is_admin: false
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const user = await findUser(event.data.identifier)
    if (!user) {
      toast.add({
        title: t('addMember.userNotFound'),
        description: t('addMember.noUserMatch'),
        color: 'warning'
      })
      return
    }
    await withOverlay(async () => {
      await $fetch(`/api/orgs/${props.orgId}/users`, {
        method: 'POST',
        body: { user_id: user.user_id, is_admin: event.data.is_admin }
      })
      toast.add({ title: t('addMember.memberAdded'), icon: 'i-lucide-check', color: 'success' })
      emit('close')
    })
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, 'Failed to add member')
    toast.add({ title: t('errors.error'), description: msg, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard variant="soft" class="w-full max-w-lg">
    <template #header>
      <p class="font-semibold">{{ t('addMember.title') }}</p>
    </template>

    <UForm :schema="schema" :state="state" class="flex flex-col gap-4" @submit="onSubmit">
      <UFormField :description="t('auth.userDescription')" :label="t('auth.user')" name="identifier">
        <UInput v-model="state.identifier" class="w-full" :placeholder="t('auth.userPlaceholder')" />
      </UFormField>

      <UFormField name="is_admin">
        <div class="flex items-center gap-2">
          <USwitch v-model="state.is_admin" />
          <span class="text-sm">{{ t('auth.grantAdminRights') }}</span>
        </div>
      </UFormField>

      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" :label="t('common.cancel')" @click="handleClose" />
        <UButton color="primary" :loading="loading" :label="t('auth.addMember')" type="submit" />
      </div>
    </UForm>
  </UCard>
</template>
