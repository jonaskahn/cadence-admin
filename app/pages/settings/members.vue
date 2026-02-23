<script setup lang="ts">
import type { UserMembershipResponse } from '~/types'

const auth = useAuth()
const toast = useToast()
const orgId = computed(() => auth.currentOrgId.value || '')
const showAdd = ref(false)

const { data: members, refresh } = await useFetch<UserMembershipResponse[]>(
  () => `/api/orgs/${orgId.value}/users`,
  { watch: [orgId] }
)

async function toggleAdmin(member: UserMembershipResponse) {
  try {
    await $fetch(`/api/orgs/${orgId.value}/users/${member.user_id}/membership`, {
      method: 'PATCH',
      body: { is_admin: !member.is_admin }
    })
    await refresh()
    toast.add({ title: 'Role updated', icon: 'i-lucide-check' })
  } catch {
    toast.add({ title: 'Failed to update role', color: 'error' })
  }
}

function handleAddClose() {
  showAdd.value = false
  refresh()
}

async function removeMember(userId: string) {
  if (!confirm('Remove this member from the organization?')) return
  try {
    await $fetch(`/api/orgs/${orgId.value}/users/${userId}`, { method: 'DELETE' })
    await refresh()
    toast.add({ title: 'Member removed', icon: 'i-lucide-check' })
  } catch {
    toast.add({ title: 'Failed to remove member', color: 'error' })
  }
}

const columns = [
  {
    accessorKey: 'username',
    header: 'Username'
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'is_admin',
    header: 'Role'
  },
  {
    id: 'actions'
  }
]
</script>

<template>
  <div class="flex flex-col gap-6">
    <UPageCard
      title="Members"
      description="Manage organization membership."
      variant="naked"
      orientation="horizontal"
    >
      <UButton
        label="Add Member"
        icon="i-lucide-user-plus"
        class="w-fit lg:ms-auto"
        @click="showAdd = true"
      />
    </UPageCard>

    <UCard>
      <UTable :data="members || []" :columns="columns">
        <template #is_admin-cell="{ row }">
          <UBadge :color="row.original.is_admin ? 'warning' : 'neutral'" variant="subtle" size="sm">
            {{ row.original.is_admin ? 'org_admin' : 'member' }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-1">
            <UButton
              :label="row.original.is_admin ? 'Demote' : 'Promote'"
              variant="ghost"
              size="xs"
              @click="toggleAdmin(row.original)"
            />
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              size="xs"
              color="error"
              @click="removeMember(row.original.user_id)"
            />
          </div>
        </template>
      </UTable>
    </UCard>
  </div>

  <UModal v-model:open="showAdd">
    <template #content>
      <AddMemberModal :org-id="orgId" @close="handleAddClose" />
    </template>
  </UModal>
</template>
