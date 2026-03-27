<script lang="ts" setup>
import type { AdminRoleResponse, RoleCreateRequest } from '~/types'
import { getApiErrorMessage } from '~/utils'

const SYSTEM_ADMIN_PERM = 'cadence:system:admin'

function filterCatalogForScope(scope: 'system' | 'org', catalog: string[]): string[] {
  if (scope === 'org') {
    return catalog.filter((p) => !p.startsWith('cadence:system:'))
  }
  return catalog.filter((p) => p !== SYSTEM_ADMIN_PERM)
}

const toast = useToast()
const { t } = useI18n()
const { withOverlay } = useLoadingOverlay()

const { data: roles, refresh: refreshRoles } = await useApiFetch<AdminRoleResponse[]>('/api/admin/roles')
const { data: permCatalog } = await useApiFetch<string[]>('/api/admin/permissions')

const showCreate = ref(false)
const createSaving = ref(false)
const createForm = reactive({
  name: '',
  description: '',
  scope: 'org' as 'system' | 'org'
})
const createSelected = ref<string[]>([])

watch(
  () => createForm.scope,
  (scope) => {
    const allowed = new Set(filterCatalogForScope(scope, permCatalog.value ?? []))
    createSelected.value = createSelected.value.filter((p) => allowed.has(p))
  }
)

const createCatalogFiltered = computed(() => filterCatalogForScope(createForm.scope, permCatalog.value ?? []))

function openCreate() {
  createForm.name = ''
  createForm.description = ''
  createForm.scope = 'org'
  createSelected.value = []
  showCreate.value = true
}

function toggleCreatePerm(p: string, val: boolean) {
  const s = new Set(createSelected.value)
  if (val) s.add(p)
  else s.delete(p)
  createSelected.value = [...s]
}

async function submitCreate() {
  createSaving.value = true
  try {
    const body: RoleCreateRequest = {
      name: createForm.name.trim(),
      description: createForm.description.trim() || undefined,
      scope: createForm.scope,
      permissions: createSelected.value
    }
    await withOverlay(async () => {
      await $fetch('/api/admin/roles', { method: 'POST', body })
      toast.add({ title: t('admin.roleCreatedToast'), color: 'success', icon: 'i-lucide-check' })
      showCreate.value = false
      await refreshRoles()
    })
  } catch (err: unknown) {
    toast.add({
      title: t('admin.roleCreateFailed'),
      description: getApiErrorMessage(err, ''),
      color: 'error'
    })
  } finally {
    createSaving.value = false
  }
}

const editRole = ref<AdminRoleResponse | null>(null)
const showEditModal = ref(false)
const editSelected = ref<string[]>([])
const editSaving = ref(false)

const editCatalogFiltered = computed(() => {
  if (!editRole.value) return []
  return filterCatalogForScope(editRole.value.scope as 'system' | 'org', permCatalog.value ?? [])
})

function openEdit(role: AdminRoleResponse) {
  if (role.is_built_in) return
  editRole.value = role
  editSelected.value = [...role.permissions]
  showEditModal.value = true
}

function closeEdit() {
  showEditModal.value = false
  editRole.value = null
}

function toggleEditPerm(p: string, val: boolean) {
  const s = new Set(editSelected.value)
  if (val) s.add(p)
  else s.delete(p)
  editSelected.value = [...s]
}

async function submitEdit() {
  if (!editRole.value) return
  editSaving.value = true
  try {
    await withOverlay(async () => {
      await $fetch(`/api/admin/roles/${editRole.value!.id}`, {
        method: 'PATCH',
        body: { permissions: editSelected.value }
      })
      toast.add({ title: t('admin.rolePermissionsUpdated'), color: 'success', icon: 'i-lucide-check' })
      closeEdit()
      await refreshRoles()
    })
  } catch (err: unknown) {
    toast.add({
      title: t('admin.rolePermissionsUpdateFailed'),
      description: getApiErrorMessage(err, ''),
      color: 'error'
    })
  } finally {
    editSaving.value = false
  }
}

const scopeItems = computed(() => [
  { label: t('admin.roleScopeOrg'), value: 'org' },
  { label: t('admin.roleScopeSystem'), value: 'system' }
])

const columns = computed(() => [
  { accessorKey: 'name', header: t('admin.roleNameSlug') },
  { accessorKey: 'scope', header: t('admin.roleScopeLabel') },
  { accessorKey: 'is_built_in', header: t('admin.status') },
  { accessorKey: 'permissions', header: t('admin.rolePermissionsLabel') },
  { id: 'actions' }
])
</script>

<template>
  <div class="flex flex-col gap-6 pt-4">
    <UAlert
      color="info"
      icon="i-lucide-user-round-key"
      :title="t('admin.customRolesTab')"
      :description="t('admin.customRolesTabDescription')"
      variant="subtle"
    />

    <div class="flex justify-end">
      <UButton icon="i-lucide-plus" :label="t('admin.createCustomRole')" @click="openCreate" />
    </div>

    <UCard v-if="roles?.length" variant="soft">
      <UTable :data="roles || []" :columns="columns">
        <template #scope-cell="{ row }">
          <UBadge color="neutral" variant="subtle" class="text-xs uppercase">
            {{ row.original.scope }}
          </UBadge>
        </template>
        <template #is_built_in-cell="{ row }">
          <UBadge :color="row.original.is_built_in ? 'primary' : 'success'" variant="subtle">
            {{ row.original.is_built_in ? t('admin.roleBuiltInBadge') : t('admin.roleCustomBadge') }}
          </UBadge>
        </template>
        <template #permissions-cell="{ row }">
          <span class="text-muted text-sm">
            {{ t('admin.rolePermissionCount', { n: row.original.permissions?.length ?? 0 }) }}
          </span>
        </template>
        <template #actions-cell="{ row }">
          <UButton
            v-if="!row.original.is_built_in"
            size="xs"
            icon="i-lucide-pencil"
            :label="t('admin.editCustomRolePermissions')"
            @click="openEdit(row.original)"
          />
          <span v-else class="text-muted text-xs">—</span>
        </template>
      </UTable>
    </UCard>
    <p v-else class="text-muted text-sm">{{ t('common.empty') }}</p>

    <UModal v-model:open="showCreate" :title="t('admin.createCustomRole')" :ui="{ content: 'sm:max-w-lg' }">
      <template #content>
        <div class="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-4 sm:p-6">
          <UFormField :label="t('admin.roleNameSlug')" required :description="t('admin.roleNameSlugHint')">
            <UInput v-model="createForm.name" class="w-full font-mono" autocomplete="off" />
          </UFormField>
          <UFormField :label="t('admin.roleDescription')">
            <UTextarea v-model="createForm.description" :rows="2" class="w-full" />
          </UFormField>
          <UFormField :label="t('admin.roleScopeLabel')" required>
            <USelect v-model="createForm.scope" :items="scopeItems" value-key="value" class="w-full" />
          </UFormField>
          <UFormField :label="t('admin.rolePermissionsLabel')">
            <div class="border-default max-h-56 space-y-2 overflow-y-auto rounded-lg border p-3">
              <UCheckbox
                v-for="p in createCatalogFiltered"
                :key="p"
                :model-value="createSelected.includes(p)"
                :label="p"
                class="font-mono text-xs"
                @update:model-value="(v) => toggleCreatePerm(p, v === true)"
              />
            </div>
          </UFormField>
          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="subtle" :label="t('common.cancel')" @click="showCreate = false" />
            <UButton :loading="createSaving" :label="t('admin.createCustomRole')" @click="submitCreate" />
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showEditModal" :title="t('admin.editCustomRolePermissions')" :ui="{ content: 'sm:max-w-lg' }">
      <template #content>
        <div v-if="editRole" class="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-4 sm:p-6">
          <p class="text-muted font-mono text-sm">{{ editRole.name }} · {{ editRole.scope }}</p>
          <UFormField :label="t('admin.rolePermissionsLabel')">
            <div class="border-default max-h-56 space-y-2 overflow-y-auto rounded-lg border p-3">
              <UCheckbox
                v-for="p in editCatalogFiltered"
                :key="p"
                :model-value="editSelected.includes(p)"
                :label="p"
                class="font-mono text-xs"
                @update:model-value="(v) => toggleEditPerm(p, v === true)"
              />
            </div>
          </UFormField>
          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="subtle" :label="t('common.cancel')" @click="closeEdit" />
            <UButton :loading="editSaving" :label="t('common.update')" @click="submitEdit" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
