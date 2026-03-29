<script lang="ts" setup>
import type { LLMConfigResponse } from '~/types'
import { formatDate, getFetchErrorStatus } from '~/utils'

const auth = useAuth()
const toast = useToast()
const { t } = useI18n()
const { providerLabel } = useI18nEntityLabels()
const { withOverlay } = useLoadingOverlay()
const orgId = computed(() => auth.currentOrgId.value || '')
const showAdd = ref(false)
const editingConfig = ref<LLMConfigResponse | null>(null)

const { data: configs, refresh } = await useApiFetch<LLMConfigResponse[]>(
  () => `/api/orgs/${orgId.value}/llm-configs`,
  { watch: [orgId] }
)

function openAdd() {
  showAdd.value = true
}

function handleModalClose() {
  showAdd.value = false
  editingConfig.value = null
  refresh()
}

async function handleDeleteConfirm(configId: string, close: () => void) {
  await deleteConfig(configId)
  close()
}

async function handlePurgeConfirm(configId: string, close: () => void) {
  await purgeConfig(configId)
  close()
}

function startEdit(config: LLMConfigResponse) {
  editingConfig.value = config
}

function onEditModalClose(open: boolean) {
  if (!open) editingConfig.value = null
}

const deleting = ref<string | null>(null)

async function deleteConfig(configId: string) {
  deleting.value = configId
  try {
    await withOverlay(async () => {
      await $fetch(`/api/orgs/${orgId.value}/llm-configs/${configId}`, { method: 'DELETE' })
      await refresh()
      toast.add({ title: t('settings.configDeleted'), icon: 'i-lucide-check' })
    })
  } catch (err: unknown) {
    const status = getFetchErrorStatus(err)
    if (status === 409) {
      toast.add({
        title: t('settings.cannotDeleteConfig'),
        description: t('settings.configReferenced'),
        color: 'error'
      })
    } else {
      toast.add({ title: t('settings.failedDeleteConfig'), color: 'error' })
    }
  } finally {
    deleting.value = null
  }
}

const purging = ref<string | null>(null)

async function purgeConfig(configId: string) {
  purging.value = configId
  try {
    await withOverlay(async () => {
      await $fetch(`/api/orgs/${orgId.value}/llm-configs/${configId}/purge`, { method: 'DELETE' })
      await refresh()
      toast.add({ title: t('settings.configDeleted'), icon: 'i-lucide-check' })
    })
  } catch (err: unknown) {
    const status = getFetchErrorStatus(err)
    if (status === 409) {
      toast.add({ title: t('errors.purgeReferencedError'), color: 'error' })
    } else {
      toast.add({ title: t('settings.failedDeleteConfig'), color: 'error' })
    }
  } finally {
    purging.value = null
  }
}

const toggling = ref<string | null>(null)

async function toggleEnabled(config: LLMConfigResponse) {
  toggling.value = config.id
  try {
    await withOverlay(async () => {
      await $fetch(`/api/orgs/${orgId.value}/llm-configs/${config.id}/status`, {
        method: 'PATCH'
      })
      await refresh()
      toast.add({
        title: config.is_enabled ? t('settings.configDisabled') : t('settings.configEnabled'),
        icon: 'i-lucide-check'
      })
    })
  } catch {
    toast.add({ title: t('settings.failedToggleConfig'), color: 'error' })
  } finally {
    toggling.value = null
  }
}

const columns = computed(() => [
  { accessorKey: 'name', header: t('dashboard.name') },
  { accessorKey: 'provider', header: t('llmConfig.provider') },
  { accessorKey: 'is_enabled', header: t('dashboard.status') },
  { accessorKey: 'base_url', header: t('settings.baseUrl') },
  { accessorKey: 'created_at', header: t('settings.created') },
  { id: 'actions' }
])
</script>

<template>
  <div>
    <div class="flex flex-col gap-6 pt-4">
      <UCard variant="soft">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <p class="font-semibold">{{ t('settings.llmConfigs') }}</p>
                <InfoPopover
                  title-key="info.settings.llmConfigs.title"
                  description-key="info.settings.llmConfigs.description"
                />
              </div>
              <p class="text-dimmed text-sm">{{ t('settings.llmConfigsDescription') }}</p>
            </div>
            <UButton
              v-if="auth.isAdmin.value"
              color="primary"
              icon="i-lucide-plus"
              :label="t('settings.addConfig')"
              @click="openAdd"
            />
          </div>
        </template>
        <div v-if="!configs" class="flex flex-col gap-2 p-4">
          <USkeleton v-for="n in 5" :key="n" class="h-10 w-full" />
        </div>
        <UTable
          v-else
          :columns="columns"
          :data="configs"
          :empty-state="{ icon: 'i-lucide-cable', label: t('settings.noConfigs') }"
          class="w-full"
        >
          <template #provider-cell="{ row }">
            <span :class="{ 'opacity-60': row?.original?.is_enabled === false }">{{
              providerLabel(row.original.provider)
            }}</span>
          </template>

          <template #is_enabled-cell="{ row }">
            <div class="flex items-center gap-1.5">
              <UBadge :color="row?.original?.is_enabled ? 'success' : 'neutral'">
                {{ row?.original?.is_enabled ? t('common.enabled') : t('common.disabled') }}
              </UBadge>
              <UBadge v-if="row?.original?.is_deleted" color="error">
                {{ t('common.deleted') }}
              </UBadge>
            </div>
          </template>

          <template #base_url-cell="{ row }">
            <span class="text-dimmed">{{ row.original.base_url || t('common.empty') }}</span>
          </template>

          <template #created_at-cell="{ row }">
            <span class="text-dimmed text-sm">{{ formatDate(row.original.created_at) }}</span>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex items-center gap-1">
              <template v-if="auth.isAdmin.value">
                <UButton
                  color="primary"
                  icon="i-lucide-pencil"
                  :label="t('common.edit')"
                  size="sm"
                  @click="startEdit(row.original)"
                />
                <UButton
                  color="primary"
                  :icon="row?.original?.is_enabled ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :label="row?.original?.is_enabled ? t('settings.disableConfig') : t('settings.enableConfig')"
                  :loading="toggling === row?.original?.id"
                  size="sm"
                  @click="toggleEnabled(row.original)"
                />
              </template>
              <UPopover v-if="auth.isAdmin.value && !row?.original?.is_deleted">
                <UButton color="error" icon="i-lucide-trash-2" size="sm" />
                <template #content="{ close }">
                  <div class="min-w-48 p-4">
                    <p class="text-dimmed mb-3 text-sm">
                      {{ t('settings.deleteConfigConfirm', { name: row.original.name }) }}
                    </p>
                    <div class="flex justify-end gap-2">
                      <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                      <UButton
                        color="error"
                        :label="t('common.delete')"
                        :loading="deleting === row?.original?.id"
                        @click="handleDeleteConfirm(row?.original?.id ?? '', close)"
                      />
                    </div>
                  </div>
                </template>
              </UPopover>
              <UPopover v-else-if="auth.isSysAdmin.value && row?.original?.is_deleted">
                <UButton color="error" icon="i-lucide-shredder" size="sm" />
                <template #content="{ close }">
                  <div class="min-w-48 p-4">
                    <p class="text-dimmed mb-3 text-sm">{{ t('common.purgeConfirm') }}</p>
                    <div class="flex justify-end gap-2">
                      <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                      <UButton
                        color="error"
                        :label="t('common.purge')"
                        :loading="purging === row?.original?.id"
                        @click="handlePurgeConfirm(row?.original?.id ?? '', close)"
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

    <UModal v-model:open="showAdd" @after:leave="refresh()">
      <template #content>
        <LLMConfigModal :org-id="orgId" @close="handleModalClose" />
      </template>
    </UModal>

    <UModal :open="!!editingConfig" @update:open="onEditModalClose">
      <template #content>
        <LLMConfigModal v-if="editingConfig" :initial-value="editingConfig" :org-id="orgId" @close="handleModalClose" />
      </template>
    </UModal>
  </div>
</template>
