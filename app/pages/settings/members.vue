<script lang="ts" setup>
import type {UserMembershipResponse} from '~/types'

const auth = useAuth()
const toast = useToast()
const {t} = useI18n()
const orgId = computed(() => auth.currentOrgId.value || '')
const showAdd = ref(false)

const {
  data: members,
  refresh
} = await useFetch<UserMembershipResponse[]>(() => `/api/orgs/${orgId.value}/users`, {watch: [orgId]})

async function withMemberAction(fn: () => Promise<void>, errorTitle: string): Promise<void> {
  try {
    await fn()
  } catch {
    toast.add({title: errorTitle, color: 'error'})
  }
}

async function toggleAdmin(member: UserMembershipResponse) {
  toggling.value = member.user_id
  try {
    await withMemberAction(async () => {
      await $fetch(`/api/orgs/${orgId.value}/users/${member.user_id}/membership`, {
        method: 'PATCH',
        body: {is_admin: !member.is_admin}
      })
      await refresh()
      toast.add({title: t('settings.roleUpdated'), icon: 'i-lucide-check'})
    }, t('settings.failedUpdateRole'))
  } finally {
    toggling.value = null
  }
}

function handleAddClose() {
  showAdd.value = false
  refresh()
}

const removing = ref<string | null>(null)
const toggling = ref<string | null>(null)

async function removeMember(userId: string) {
  removing.value = userId
  try {
    await withMemberAction(async () => {
      await $fetch(`/api/orgs/${orgId.value}/users/${userId}`, {method: 'DELETE'})
      await refresh()
      toast.add({title: t('settings.memberRemoved'), icon: 'i-lucide-check'})
    }, t('settings.failedRemoveMember'))
  } finally {
    removing.value = null
  }
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
  <div>
    <div class="flex flex-col gap-6">
      <UPageCard orientation="horizontal" variant="naked">
        <template #header>
          <div class="flex items-center gap-2">
            <span class="font-semibold text-sm">{{ t('settings.members') }}</span>
            <InfoPopover title-key="info.settings.members.title" description-key="info.settings.members.description" />
          </div>
          <p class="mt-0.5 text-sm text-dimmed">{{ t('settings.membersDescription') }}</p>
        </template>
        <UButton
          v-if="auth.isAdmin.value"
          color="primary"
          variant="outline"
          :label="t('settings.addMember')"
          class="w-fit lg:ms-auto"
          icon="i-lucide-user-plus"
          @click="showAdd = true"
        />
      </UPageCard>

      <UCard class="w-full">
        <UTable :columns="columns" :data="members || []" class="w-full">
          <template #is_admin-cell="{ row }">
            <UBadge :color="row.original.is_admin ? 'warning' : 'neutral'" size="sm" variant="subtle">
              {{ row.original.is_admin ? t('roles.orgAdmin') : t('roles.member') }}
            </UBadge>
          </template>

          <template #actions-cell="{ row }">
            <div v-if="auth.isAdmin.value" class="flex items-center gap-1">
              <UPopover>
                <UButton
                  :icon="row.original.is_admin ? 'i-lucide-shield-off' : 'i-lucide-shield'"
                  :label="row.original.is_admin ? t('settings.demote') : t('settings.promote')"
                  size="xs"
                  variant="outline"
                />
                <template #content="{ close }">
                  <div class="p-4 min-w-48">
                    <p class="text-sm text-dimmed mb-3">
                      {{ row.original.is_admin ? t('settings.demoteConfirm') : t('settings.promoteConfirm') }}
                    </p>
                    <div class="flex justify-end gap-2">
                      <UButton color="neutral" :label="t('common.cancel')" variant="outline" @click="close" />
                      <UButton
                        color="primary"
                        variant="outline"
                        :label="row.original.is_admin ? t('settings.demote') : t('settings.promote')"
                        :loading="toggling === row.original.user_id"
                        @click="async () => { await toggleAdmin(row.original); close() }"
                      />
                    </div>
                  </div>
                </template>
              </UPopover>
              <UPopover>
                <UButton color="error" icon="i-lucide-trash" size="xs" />
                <template #content="{ close }">
                  <div class="p-4 min-w-48">
                    <p class="text-sm text-dimmed mb-3">{{ t('settings.removeMemberConfirm') }}</p>
                    <div class="flex justify-end gap-2">
                      <UButton color="neutral" :label="t('common.cancel')" variant="outline" @click="close" />
                      <UButton
                        color="error"
                        :label="t('common.remove')"
                        :loading="removing === row.original.user_id"
                        @click="async () => { await removeMember(row.original.user_id); close() }"
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

    <ClientOnly>
      <UModal v-model:open="showAdd">
        <template #content>
          <AddMemberModal :org-id="orgId" @close="handleAddClose"/>
        </template>
      </UModal>
    </ClientOnly>
  </div>
</template>
