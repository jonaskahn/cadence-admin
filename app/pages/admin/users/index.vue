<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { UserMembershipResponse } from '~/types'
import { formatDate, getApiErrorMessage } from '~/utils'

const toast = useToast()
const { t } = useI18n()
const { withOverlay } = useLoadingOverlay()

async function withUserActionError<T>(fn: () => Promise<T>, errorMsg: string): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    toast.add({ title: t('errors.error'), description: getApiErrorMessage(err, errorMsg), color: 'error' })
    throw err
  }
}

const { data: users, refresh } = await useApiFetch<UserMembershipResponse[]>('/api/admin/users')

const showCreate = ref(false)
const createLoading = ref(false)

function openCreate() {
  showCreate.value = true
}

function closeCreate() {
  showCreate.value = false
}

function closeEdit() {
  editTarget.value = null
}

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
    await withUserActionError(
      async () =>
        withOverlay(async () => {
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
        }),
      t('admin.failedCreateUser')
    )
  } catch {
    /* withUserActionError handles toast */
  } finally {
    createLoading.value = false
  }
}

const editTarget = ref<UserMembershipResponse | null>(null)
const editLoading = ref(false)
const editUserFormRef = ref<{ $el?: { requestSubmit?: () => void } } | null>(null)

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
    await withUserActionError(
      async () =>
        withOverlay(async () => {
          await $fetch(`/api/admin/users/${editTarget.value!.user_id}`, {
            method: 'PATCH',
            body: { username: event.data.username, email: event.data.email || null, is_sys_admin: event.data.is_sys_admin }
          })
          toast.add({ title: t('admin.userUpdated'), icon: 'i-lucide-check', color: 'success' })
          editTarget.value = null
          await refresh()
        }),
      t('admin.failedUpdateUser')
    )
  } catch {
    /* withUserActionError handles toast */
  } finally {
    editLoading.value = false
  }
}

const deleting = ref<string | null>(null)
const purging = ref<string | null>(null)

async function onDelete(user: UserMembershipResponse) {
  deleting.value = user.user_id
  try {
    await withUserActionError(async () => {
      await $fetch(`/api/admin/users/${user.user_id}`, { method: 'DELETE' })
      toast.add({ title: t('admin.userDeleted'), icon: 'i-lucide-check', color: 'success' })
      await refresh()
    }, t('admin.failedDeleteUser'))
  } catch {
    /* withUserActionError handles toast */
  } finally {
    deleting.value = null
  }
}

async function handleDeleteConfirm(user: UserMembershipResponse, close: () => void) {
  await onDelete(user)
  close()
}

async function handlePurgeConfirm(user: UserMembershipResponse, close: () => void) {
  await onPurge(user)
  close()
}

async function onPurge(user: UserMembershipResponse) {
  purging.value = user.user_id
  try {
    await $fetch(`/api/admin/users/${user.user_id}/purge`, { method: 'DELETE' })
    toast.add({ title: t('admin.userDeleted'), icon: 'i-lucide-check', color: 'success' })
    await refresh()
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status
    if (status === 409) {
      toast.add({ title: t('errors.purgeReferencedError'), color: 'error' })
    } else {
      toast.add({ title: t('admin.failedDeleteUser'), description: getApiErrorMessage(err, t('errors.unknown')), color: 'error' })
    }
  } finally {
    purging.value = null
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
  <div class="min-w-0 flex-1 flex flex-col overflow-hidden">
    <UDashboardPanel id="admin-users">
      <template #header>
        <UDashboardNavbar :title="t('admin.users')">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <div class="flex items-center gap-2">
              <InfoPopover title-key="info.admin.users.title" description-key="info.admin.users.description" />
              <UButton color="primary" icon="i-lucide-plus" :label="t('admin.newUser')" @click="openCreate" />
            </div>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="p-6">
          <UCard variant="soft">
            <UTable :columns="columns" :data="users || []">
              <template #is_sys_admin-cell="{ row }">
                <div class="flex items-center gap-1.5">
                  <UBadge :color="row.original.is_sys_admin ? 'error' : 'neutral'" size="sm" variant="subtle">
                    {{ row.original.is_sys_admin ? t('roles.sysAdmin') : t('common.user') }}
                  </UBadge>
                  <UBadge v-if="row.original.is_deleted" color="error" size="sm" variant="subtle">
                    {{ t('common.deleted') }}
                  </UBadge>
                </div>
              </template>
              <template #created_at-cell="{ row }">
                <span class="text-sm text-dimmed">{{ formatDate(row.original.created_at) }}</span>
              </template>
              <template #actions-cell="{ row }">
                <div class="flex items-center gap-1">
                  <UButton color="primary" icon="i-lucide-pencil" :label="t('common.edit')" size="xs" @click="openEdit(row.original)" />
                  <UPopover v-if="!row.original.is_deleted">
                    <UButton color="error" icon="i-lucide-trash-2" size="xs" />
                    <template #content="{ close }">
                      <div class="p-4 min-w-48">
                        <p class="text-sm text-dimmed mb-3">{{ t('admin.deleteUserConfirm', { username: row.original.username }) }}</p>
                        <div class="flex justify-end gap-2">
                          <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                          <UButton
                            color="error"
                            :label="t('common.delete')"
                            :loading="deleting === row.original.user_id"
                            @click="handleDeleteConfirm(row.original, close)"
                          />
                        </div>
                      </div>
                    </template>
                  </UPopover>
                  <UPopover v-else-if="row.original.is_deleted">
                    <UButton color="error" icon="i-lucide-shredder" size="xs" />
                    <template #content="{ close }">
                      <div class="p-4 min-w-48">
                        <p class="text-sm text-dimmed mb-3">{{ t('common.purgeConfirm') }}</p>
                        <div class="flex justify-end gap-2">
                          <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                          <UButton
                            color="error"
                            :label="t('common.purge')"
                            :loading="purging === row.original.user_id"
                            @click="handlePurgeConfirm(row.original, close)"
                          />
                        </div>
                      </div>
                    </template>
                  </UPopover>
                </div>
              </template>
            </UTable>
          </UCard>
        </div>
      </template>
    </UDashboardPanel>

    <UModal v-model:open="showCreate">
      <template #content>
        <UCard variant="soft" class="w-full">
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
              <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="closeCreate" />
              <UButton color="primary" :loading="createLoading" :label="t('common.create')" type="submit" />
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>

    <UModal :open="!!editTarget" @update:open="editTarget = null">
      <template #content>
        <UCard variant="soft" class="w-full">
          <template #header>
            <p class="font-semibold">{{ t('admin.editUser') }}</p>
          </template>
          <UForm ref="editUserFormRef" :schema="editSchema" :state="editState" class="flex flex-col gap-4" @submit="onEdit">
            <UFormField :label="t('auth.username')" name="username" required>
              <UInput v-model="editState.username" class="w-full" />
            </UFormField>
            <UFormField :label="t('profile.email')" name="email">
              <UInput v-model="editState.email" class="w-full" type="email" />
            </UFormField>
            <UFormField name="is_sys_admin">
              <div class="flex items-center gap-2">
                <USwitch v-model="editState.is_sys_admin" />
                <span class="text-sm">{{ t('admin.systemAdmin') }}</span>
              </div>
            </UFormField>
            <div class="flex justify-end gap-2">
              <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="closeEdit" />
              <ConfirmActionPopover
                label-key="common.save"
                confirm-title-key="common.saveConfirmTitle"
                confirm-message-key="common.saveConfirmMessage"
                confirm-label-key="common.saveConfirmFriendly"
                :loading="editLoading"
                :on-confirm="() => editUserFormRef?.$el?.requestSubmit?.()"
              />
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
