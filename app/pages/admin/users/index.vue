<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { UserMembershipResponse } from '~/types'
import { formatDate, getApiErrorMessage } from '~/utils'

const toast = useToast()

async function withUserActionError<T>(fn: () => Promise<T>, errorMsg: string): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    toast.add({ title: 'Error', description: getApiErrorMessage(err, errorMsg), color: 'error' })
    throw err
  }
}

const { data: users, refresh } = await useFetch<UserMembershipResponse[]>('/api/admin/users')

const showCreate = ref(false)
const createLoading = ref(false)

const createSchema = z.object({
  username: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  password: z.string().min(6, 'Min 6 characters').optional().or(z.literal(''))
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
      toast.add({ title: 'User created', icon: 'i-lucide-check', color: 'success' })
      showCreate.value = false
      createState.username = ''
      createState.email = ''
      createState.password = ''
      await refresh()
    }, 'Failed to create user')
  } catch {
  } finally {
    createLoading.value = false
  }
}

const editTarget = ref<UserMembershipResponse | null>(null)
const editLoading = ref(false)

const editSchema = z.object({
  username: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
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
      toast.add({ title: 'User updated', icon: 'i-lucide-check', color: 'success' })
      editTarget.value = null
      await refresh()
    }, 'Failed to update user')
  } catch {
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
      toast.add({ title: 'User deleted', icon: 'i-lucide-check', color: 'success' })
      deleteTarget.value = null
      await refresh()
    }, 'Failed to delete user')
  } catch {
  } finally {
    deleteLoading.value = false
  }
}

const columns = [
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'is_sys_admin', header: 'Role' },
  { accessorKey: 'created_at', header: 'Created' },
  { id: 'actions' }
]
</script>

<template>
  <UDashboardPanel id="admin-users">
    <template #header>
      <UDashboardNavbar title="Users">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-plus" label="New User" @click="showCreate = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UCard>
          <UTable :columns="columns" :data="users || []">
            <template #is_sys_admin-cell="{ row }">
              <UBadge :color="row.original.is_sys_admin ? 'error' : 'neutral'" size="sm" variant="subtle">
                {{ row.original.is_sys_admin ? 'sys_admin' : 'user' }}
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
          <p class="font-semibold">New User</p>
        </template>
        <UForm :schema="createSchema" :state="createState" class="flex flex-col gap-4" @submit="onCreate">
          <UFormField label="Username" name="username" required>
            <UInput v-model="createState.username" class="w-full" placeholder="johndoe" />
          </UFormField>
          <UFormField label="Email" name="email">
            <UInput v-model="createState.email" class="w-full" placeholder="john@example.com" type="email" />
          </UFormField>
          <UFormField description="Optional — user can set later" label="Password" name="password">
            <UInput v-model="createState.password" class="w-full" type="password" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" label="Cancel" variant="ghost" @click="showCreate = false" />
            <UButton :loading="createLoading" label="Create" type="submit" />
          </div>
        </UForm>
      </UCard>
    </template>
  </UModal>

  <UModal :open="!!editTarget" @update:open="editTarget = null">
    <template #content>
      <UCard class="w-full">
        <template #header>
          <p class="font-semibold">Edit User</p>
        </template>
        <UForm :schema="editSchema" :state="editState" class="flex flex-col gap-4" @submit="onEdit">
          <UFormField label="Username" name="username" required>
            <UInput v-model="editState.username" class="w-full" />
          </UFormField>
          <UFormField label="Email" name="email">
            <UInput v-model="editState.email" class="w-full" type="email" />
          </UFormField>
          <UFormField name="is_sys_admin">
            <UCheckbox v-model="editState.is_sys_admin" label="System admin" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" label="Cancel" variant="ghost" @click="editTarget = null" />
            <UButton :loading="editLoading" label="Save" type="submit" />
          </div>
        </UForm>
      </UCard>
    </template>
  </UModal>

  <UModal :open="!!deleteTarget" @update:open="deleteTarget = null">
    <template #content>
      <UCard class="w-full max-w-sm">
        <template #header>
          <p class="font-semibold">Delete User</p>
        </template>
        <p class="text-sm text-dimmed">
          Delete <strong class="text-default">{{ deleteTarget?.username }}</strong
          >? This will remove all their org memberships.
        </p>
        <div class="flex justify-end gap-2 mt-4">
          <UButton color="neutral" label="Cancel" variant="ghost" @click="deleteTarget = null" />
          <UButton :loading="deleteLoading" color="error" label="Delete" @click="onDelete" />
        </div>
      </UCard>
    </template>
  </UModal>
</template>
