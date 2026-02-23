<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { UserMembershipResponse } from '~/types'
import { formatDate, getApiErrorMessage } from '~/utils'

const toast = useToast()

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
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: {
        username: event.data.username,
        email: event.data.email || null,
        password: event.data.password || null
      }
    })
    toast.add({ title: 'User created', icon: 'i-lucide-check', color: 'success' })
    showCreate.value = false
    createState.username = ''
    createState.email = ''
    createState.password = ''
    await refresh()
  } catch (err) {
    toast.add({
      title: 'Error',
      description: getApiErrorMessage(err, 'Failed to create user'),
      color: 'error'
    })
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
    await $fetch(`/api/admin/users/${editTarget.value.user_id}`, {
      method: 'PATCH',
      body: {
        username: event.data.username,
        email: event.data.email || null,
        is_sys_admin: event.data.is_sys_admin
      }
    })
    toast.add({ title: 'User updated', icon: 'i-lucide-check', color: 'success' })
    editTarget.value = null
    await refresh()
  } catch (err) {
    toast.add({
      title: 'Error',
      description: getApiErrorMessage(err, 'Failed to update user'),
      color: 'error'
    })
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
    await $fetch(`/api/admin/users/${deleteTarget.value.user_id}`, { method: 'DELETE' })
    toast.add({ title: 'User deleted', icon: 'i-lucide-check', color: 'success' })
    deleteTarget.value = null
    await refresh()
  } catch (err) {
    toast.add({
      title: 'Error',
      description: getApiErrorMessage(err, 'Failed to delete user'),
      color: 'error'
    })
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
          <UButton label="New User" icon="i-lucide-plus" @click="showCreate = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UCard>
          <UTable :data="users || []" :columns="columns">
            <template #is_sys_admin-cell="{ row }">
              <UBadge
                :color="row.original.is_sys_admin ? 'error' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ row.original.is_sys_admin ? 'sys_admin' : 'user' }}
              </UBadge>
            </template>
            <template #created_at-cell="{ row }">
              <span class="text-sm text-dimmed">{{ formatDate(row.original.created_at) }}</span>
            </template>
            <template #actions-cell="{ row }">
              <div class="flex items-center gap-1">
                <UButton
                  icon="i-lucide-pencil"
                  variant="ghost"
                  size="xs"
                  @click="openEdit(row.original)"
                />
                <UButton
                  icon="i-lucide-trash-2"
                  variant="ghost"
                  size="xs"
                  color="error"
                  @click="deleteTarget = row.original"
                />
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
        <UForm
          :schema="createSchema"
          :state="createState"
          class="flex flex-col gap-4"
          @submit="onCreate"
        >
          <UFormField label="Username" name="username">
            <UInput v-model="createState.username" placeholder="johndoe" class="w-full" />
          </UFormField>
          <UFormField label="Email" name="email">
            <UInput
              v-model="createState.email"
              type="email"
              placeholder="john@example.com"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Password" name="password" description="Optional — user can set later">
            <UInput v-model="createState.password" type="password" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton label="Cancel" variant="ghost" color="neutral" @click="showCreate = false" />
            <UButton type="submit" label="Create" :loading="createLoading" />
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
          <UFormField label="Username" name="username">
            <UInput v-model="editState.username" class="w-full" />
          </UFormField>
          <UFormField label="Email" name="email">
            <UInput v-model="editState.email" type="email" class="w-full" />
          </UFormField>
          <UFormField name="is_sys_admin">
            <UCheckbox v-model="editState.is_sys_admin" label="System admin" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton label="Cancel" variant="ghost" color="neutral" @click="editTarget = null" />
            <UButton type="submit" label="Save" :loading="editLoading" />
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
          <UButton label="Cancel" variant="ghost" color="neutral" @click="deleteTarget = null" />
          <UButton label="Delete" color="error" :loading="deleteLoading" @click="onDelete" />
        </div>
      </UCard>
    </template>
  </UModal>
</template>
