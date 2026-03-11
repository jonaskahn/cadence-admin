<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { getApiErrorMessage } from '~/utils'

const props = defineProps<{ orgId: string }>()
const emit = defineEmits<{ close: [] }>()
const toast = useToast()
const { t } = useI18n()
const { findUser } = useUserSearch()
const loading = ref(false)

const schema = z.object({
  identifier: z.string().min(1, () => t('addMember.identifierRequired')),
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
    await $fetch(`/api/orgs/${props.orgId}/users`, {
      method: 'POST',
      body: { user_id: user.user_id, is_admin: event.data.is_admin }
    })
    toast.add({ title: t('addMember.memberAdded'), icon: 'i-lucide-check', color: 'success' })
    emit('close')
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, 'Failed to add member')
    toast.add({ title: t('errors.error'), description: msg, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-lg">
    <template #header>
      <p class="font-semibold">{{ t('addMember.title') }}</p>
    </template>

    <UForm :schema="schema" :state="state" class="flex flex-col gap-4" @submit="onSubmit">
      <UFormField :description="t('auth.userDescription')" :label="t('auth.user')" name="identifier">
        <UInput v-model="state.identifier" class="w-full" :placeholder="t('auth.userPlaceholder')" />
      </UFormField>

      <UFormField name="is_admin">
        <UCheckbox v-model="state.is_admin" :label="t('auth.grantAdminRights')" />
      </UFormField>

      <div class="flex justify-end gap-2">
        <UButton color="neutral" :label="t('common.cancel')" variant="outline" @click="emit('close')" />
        <UButton color="primary" variant="outline" :loading="loading" :label="t('auth.addMember')" type="submit" />
      </div>
    </UForm>
  </UCard>
</template>
