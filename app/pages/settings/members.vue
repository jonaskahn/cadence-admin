<script lang="ts" setup>
import type { UserMembershipResponse } from '~/types'

const auth = useAuth()
const toast = useToast()
const { t } = useI18n()
const orgId = computed(() => auth.currentOrgId.value || '')
const showAdd = ref(false)

const { data: members, refresh } = await useFetch<UserMembershipResponse[]>(() => `/api/orgs/${orgId.value}/users`, { watch: [orgId] })

async function withMemberAction(fn: () => Promise<void>, errorTitle: string): Promise<void> {
  try {
    await fn()
  } catch {
    toast.add({ title: errorTitle, color: 'error' })
  }
}

async function toggleAdmin(member: UserMembershipResponse) {
  await withMemberAction(async () => {
    await $fetch(`/api/orgs/${orgId.value}/users/${member.user_id}/membership`, {
      method: 'PATCH',
      body: { is_admin: !member.is_admin }
    })
    await refresh()
    toast.add({ title: t('settings.roleUpdated'), icon: 'i-lucide-check' })
  }, t('settings.failedUpdateRole'))
}

function handleAddClose() {
  showAdd.value = false
  refresh()
}

async function removeMember(userId: string) {
  if (!confirm(t('settings.removeMemberConfirm'))) return
  await withMemberAction(async () => {
    await $fetch(`/api/orgs/${orgId.value}/users/${userId}`, { method: 'DELETE' })
    await refresh()
    toast.add({ title: t('settings.memberRemoved'), icon: 'i-lucide-check' })
  }, t('settings.failedRemoveMember'))
}

const columns = computed(() => [
  {
    accessorKey: 'username',
    header: t('settings.username')
  },
  {
    accessorKey: 'email',
    header: t('profile.email')
  },
  {
    accessorKey: 'is_admin',
    header: t('settings.role')
  },
  {
    id: 'actions'
  }
])
</script>

<template>
  <div class="flex flex-col gap-6">
    <UPageCard :description="t('settings.membersDescription')" orientation="horizontal" :title="t('settings.members')" variant="naked">
      <UButton class="w-fit lg:ms-auto" icon="i-lucide-user-plus" :label="t('settings.addMember')" @click="showAdd = true" />
    </UPageCard>

    <UCard>
      <UTable :columns="columns" :data="members || []">
        <template #is_admin-cell="{ row }">
          <UBadge :color="row.original.is_admin ? 'warning' : 'neutral'" size="sm" variant="subtle">
            {{ row.original.is_admin ? t('roles.orgAdmin') : t('roles.member') }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-1">
            <UButton
              :label="row.original.is_admin ? t('settings.demote') : t('settings.promote')"
              size="xs"
              variant="ghost"
              @click="toggleAdmin(row.original)"
            />
            <UButton color="error" icon="i-lucide-x" size="xs" variant="ghost" @click="removeMember(row.original.user_id)" />
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
