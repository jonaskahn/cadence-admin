<script setup lang="ts">
import type { OrganizationResponse, UserMembershipResponse } from '~/types'

const route = useRoute()
const toast = useToast()
const orgId = route.params.id as string
const showAdd = ref(false)

const { data: org } = await useAsyncData(`admin-org-${orgId}`, () =>
  $fetch<OrganizationResponse[]>(`/api/admin/orgs`).then(
    (orgs) => orgs.find((o) => o.org_id === orgId) ?? null
  )
)

const { data: members, refresh } = await useFetch<UserMembershipResponse[]>(
  `/api/orgs/${orgId}/users`
)

function handleAddClose() {
  showAdd.value = false
  refresh()
}

async function removeMember(userId: string) {
  if (!confirm('Remove member?')) return
  try {
    await $fetch(`/api/orgs/${orgId}/users/${userId}`, { method: 'DELETE' })
    await refresh()
    toast.add({ title: 'Member removed', icon: 'i-lucide-check' })
  } catch {
    toast.add({ title: 'Failed', color: 'error' })
  }
}

const columns = [
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'is_admin', header: 'Role' },
  { id: 'actions' }
]
</script>

<template>
  <UDashboardPanel :id="`admin-org-${orgId}`">
    <template #header>
      <UDashboardNavbar :title="org?.name || orgId">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" variant="ghost" to="/admin/orgs" />
        </template>
        <template #right>
          <UButton label="Add Member" icon="i-lucide-user-plus" @click="showAdd = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 flex flex-col gap-6">
        <UCard v-if="org">
          <template #header>
            <p class="font-semibold">Details</p>
          </template>
          <dl class="grid grid-cols-2 gap-4">
            <div>
              <dt class="text-dimmed text-sm">Org ID</dt>
              <dd class="font-mono text-sm mt-1">
                {{ org.org_id }}
              </dd>
            </div>
            <div>
              <dt class="text-dimmed text-sm">Status</dt>
              <dd class="mt-1">
                <UBadge
                  :color="org.status === 'active' ? 'success' : 'neutral'"
                  variant="subtle"
                  size="sm"
                >
                  {{ org.status }}
                </UBadge>
              </dd>
            </div>
          </dl>
        </UCard>

        <UCard>
          <template #header>
            <p class="font-semibold">Members</p>
          </template>
          <UTable :data="members || []" :columns="columns">
            <template #is_admin-cell="{ row }">
              <UBadge
                :color="row.original.is_admin ? 'warning' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ row.original.is_admin ? 'org_admin' : 'member' }}
              </UBadge>
            </template>
            <template #actions-cell="{ row }">
              <UButton
                icon="i-lucide-x"
                variant="ghost"
                size="xs"
                color="error"
                @click="removeMember(row.original.user_id)"
              />
            </template>
          </UTable>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="showAdd">
    <template #content>
      <AddMemberModal :org-id="orgId" @close="handleAddClose" />
    </template>
  </UModal>
</template>
