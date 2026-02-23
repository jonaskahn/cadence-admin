<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { UserMembershipResponse } from '~/types'
import { formatDate, getApiErrorMessage } from '~/utils'

const toast = useToast()
const { t } = useI18n()

async function withUserActionError<T>(fn: () => Promise<T>, errorMsg: string): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    toast.add({ title: t('errors.error'), description: getApiErrorMessage(err, errorMsg), color: 'error' })
    throw err
  }
}

const { data: users, refresh } = await useFetch<UserMembershipResponse[]>('/api/admin/users')

const showCreate = ref(false)
const createLoading = ref(false)

const createSchema = z.object({
  username: z.string().min(1, () => t('common.required')),
  email: z
    .string()
    .email(() => t('common.invalidEmail'))
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(6, () => t('common.min6Chars'))
    .optional()
    .or(z.literal(''))
})
type CreateSchema = z.output<typeof createSchema>
const createState = reactive<Partial<CreateSchema>>({ username: '', email: '', password: '' })

async function onCreate(event: FormSubmitEvent<CreateSchema>) {
  createLoading.value = true
  try {
    await withUserActionError(async () => {
      await $fetch('/api/admin/users', {
        method: 'POST',
        body: { username: event.data.username, email: event.data.email || null, password: event.data.password || null }
      })
      toast.add({ title: t('admin.userCreated'), icon: 'i-lucide-check', color: 'success' })
      showCreate.value = false
      createState.username = ''
      createState.email = ''
      createState.password = ''
      await refresh()
    }, t('admin.failedCreateUser'))
  } catch {
    /* withUserActionError handles toast */
  } finally {
    createLoading.value = false
  }
}

const editTarget = ref<UserMembershipResponse | null>(null)
const editLoading = ref(false)

const editSchema = z.object({
  username: z.string().min(1, () => t('common.required')),
  email: z
    .string()
    .email(() => t('common.invalidEmail'))
    .optional()
    .or(z.literal('')),
  is_sys_admin: z.boolean()
})
type EditSchema = z.output<typeof editSchema>
const editState = reactive<Partial<EditSchema>>({})

function openEdit(user: UserMembershipResponse) {
  editTarget.value = user
  editState.username = user.username
  editState.email = user.email ?? ''
  editState.is_sys_admin = user.is_sys_admin ?? false
}

async function onEdit(event: FormSubmitEvent<EditSchema>) {
  if (!editTarget.value) return
  editLoading.value = true
  try {
    await withUserActionError(async () => {
      await $fetch(`/api/admin/users/${editTarget.value!.user_id}`, {
        method: 'PATCH',
        body: { username: event.data.username, email: event.data.email || null, is_sys_admin: event.data.is_sys_admin }
      })
      toast.add({ title: t('admin.userUpdated'), icon: 'i-lucide-check', color: 'success' })
      editTarget.value = null
      await refresh()
    }, t('admin.failedUpdateUser'))
  } catch {
    /* withUserActionError handles toast */
  } finally {
    editLoading.value = false
  }
}

const deleteTarget = ref<UserMembershipResponse | null>(null)
const deleteLoading = ref(false)

async function onDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    await withUserActionError(async () => {
      await $fetch(`/api/admin/users/${deleteTarget.value!.user_id}`, { method: 'DELETE' })
      toast.add({ title: t('admin.userDeleted'), icon: 'i-lucide-check', color: 'success' })
      deleteTarget.value = null
      await refresh()
    }, t('admin.failedDeleteUser'))
  } catch {
    /* withUserActionError handles toast */
  } finally {
    deleteLoading.value = false
  }
}

const columns = computed(() => [
  { accessorKey: 'username', header: t('settings.username') },
  { accessorKey: 'email', header: t('profile.email') },
  { accessorKey: 'is_sys_admin', header: t('profile.role') },
  { accessorKey: 'created_at', header: t('settings.created') },
  { id: 'actions' }
])
</script>

<template>
  <UDashboardPanel id="admin-users">
    <template #header>
      <UDashboardNavbar :title="t('admin.users')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-plus" :label="t('admin.newUser')" @click="showCreate = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UCard>
          <UTable :columns="columns" :data="users || []">
            <template #is_sys_admin-cell="{ row }">
              <UBadge :color="row.original.is_sys_admin ? 'error' : 'neutral'" size="sm" variant="subtle">
                {{ row.original.is_sys_admin ? t('roles.sysAdmin') : t('common.user') }}
              </UBadge>
            </template>
            <template #created_at-cell="{ row }">
              <span class="text-sm text-dimmed">{{ formatDate(row.original.created_at) }}</span>
            </template>
            <template #actions-cell="{ row }">
              <div class="flex items-center gap-1">
                <UButton icon="i-lucide-pencil" size="xs" variant="ghost" @click="openEdit(row.original)" />
                <UButton color="error" icon="i-lucide-trash-2" size="xs" variant="ghost" @click="deleteTarget = row.original" />
              </div>
            </template>
          </UTable>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="showCreate">
    <template #content>
      <UCard class="w-full">
        <template #header>
          <p class="font-semibold">{{ t('admin.newUser') }}</p>
        </template>
        <UForm :schema="createSchema" :state="createState" class="flex flex-col gap-4" @submit="onCreate">
          <UFormField :label="t('auth.username')" name="username" required>
            <UInput v-model="createState.username" class="w-full" :placeholder="t('admin.placeholderUsername')" />
          </UFormField>
          <UFormField :label="t('profile.email')" name="email">
            <UInput v-model="createState.email" class="w-full" :placeholder="t('admin.placeholderEmail')" type="email" />
          </UFormField>
          <UFormField :description="t('admin.passwordOptional')" :label="t('auth.password')" name="password">
            <UInput v-model="createState.password" class="w-full" type="password" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="showCreate = false" />
            <UButton :loading="createLoading" :label="t('common.create')" type="submit" />
          </div>
        </UForm>
      </UCard>
    </template>
  </UModal>

  <UModal :open="!!editTarget" @update:open="editTarget = null">
    <template #content>
      <UCard class="w-full">
        <template #header>
          <p class="font-semibold">{{ t('admin.editUser') }}</p>
        </template>
        <UForm :schema="editSchema" :state="editState" class="flex flex-col gap-4" @submit="onEdit">
          <UFormField :label="t('auth.username')" name="username" required>
            <UInput v-model="editState.username" class="w-full" />
          </UFormField>
          <UFormField :label="t('profile.email')" name="email">
            <UInput v-model="editState.email" class="w-full" type="email" />
          </UFormField>
          <UFormField name="is_sys_admin">
            <UCheckbox v-model="editState.is_sys_admin" :label="t('admin.systemAdmin')" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="editTarget = null" />
            <UButton :loading="editLoading" :label="t('common.save')" type="submit" />
          </div>
        </UForm>
      </UCard>
    </template>
  </UModal>

  <UModal :open="!!deleteTarget" @update:open="deleteTarget = null">
    <template #content>
      <UCard class="w-full max-w-sm">
        <template #header>
          <p class="font-semibold">{{ t('admin.deleteUser') }}</p>
        </template>
        <p class="text-sm text-dimmed">
          {{ t('admin.deleteUserConfirm', { username: deleteTarget?.username }) }}
        </p>
        <div class="flex justify-end gap-2 mt-4">
          <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="deleteTarget = null" />
          <UButton :loading="deleteLoading" color="error" :label="t('common.delete')" @click="onDelete" />
        </div>
      </UCard>
    </template>
  </UModal>
</template>
