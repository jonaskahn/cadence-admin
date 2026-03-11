<script lang="ts" setup>
import type { LLMConfigResponse } from '~/types'
import { formatDate } from '~/utils'

const auth = useAuth()
const toast = useToast()
const { t } = useI18n()
const orgId = computed(() => auth.currentOrgId.value || '')
const showAdd = ref(false)
const editingConfig = ref<LLMConfigResponse | null>(null)

const { data: configs, refresh } = await useFetch<LLMConfigResponse[]>(() => `/api/orgs/${orgId.value}/llm-configs`, { watch: [orgId] })

function providerLabel(provider: string): string {
  const key = `providers.${provider}`
  const val = t(key)
  return val !== key ? val : provider
}

function handleModalClose() {
  showAdd.value = false
  editingConfig.value = null
  refresh()
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
    await $fetch(`/api/orgs/${orgId.value}/llm-configs/${configId}`, { method: 'DELETE' })
    await refresh()
    toast.add({ title: t('settings.configDeleted'), icon: 'i-lucide-check' })
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status
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

const toggling = ref<string | null>(null)

async function toggleEnabled(config: LLMConfigResponse) {
  toggling.value = config.id
  try {
    await $fetch(`/api/orgs/${orgId.value}/llm-configs/${config.id}/status`, {
      method: 'PATCH'
    })
    await refresh()
    toast.add({
      title: config.is_enabled ? t('settings.configDisabled') : t('settings.configEnabled'),
      icon: 'i-lucide-check'
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
  <div class="flex flex-col gap-6">
    <UPageCard :description="t('settings.llmConfigsDescription')" orientation="horizontal" :title="t('settings.llmConfigs')" variant="naked">
      <UButton v-if="auth.isOrgAdmin.value" class="w-fit lg:ms-auto" icon="i-lucide-plus" :label="t('settings.addConfig')" @click="showAdd = true" />
    </UPageCard>

    <UCard>
      <UTable :columns="columns" :data="configs || []">
        <template #provider-cell="{ row }">
          <span :class="{ 'opacity-60': row.original.is_enabled === false }">{{ providerLabel(row.original.provider) }}</span>
        </template>

        <template #is_enabled-cell="{ row }">
          <UBadge :color="row.original.is_enabled ? 'success' : 'neutral'" size="sm" variant="subtle">
            {{ row.original.is_enabled ? t('common.enabled') : t('common.disabled') }}
          </UBadge>
        </template>

        <template #base_url-cell="{ row }">
          <span class="text-dimmed">{{ row.original.base_url || t('common.empty') }}</span>
        </template>

        <template #created_at-cell="{ row }">
          <span class="text-sm text-dimmed">{{ formatDate(row.original.created_at) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-1">
            <template v-if="auth.isOrgAdmin.value">
              <UButton color="neutral" icon="i-lucide-pencil" size="xs" variant="ghost" @click="startEdit(row.original)" />
              <UButton
                :icon="row.original.is_enabled ? 'i-lucide-toggle-right' : 'i-lucide-toggle-left'"
                :loading="toggling === row.original.id"
                size="xs"
                :title="row.original.is_enabled ? t('settings.disableConfig') : t('settings.enableConfig')"
                variant="ghost"
                @click="toggleEnabled(row.original)"
              />
            </template>
            <UPopover v-if="auth.isSysAdmin.value">
              <UButton color="error" icon="i-lucide-trash-2" size="xs" variant="ghost" />
              <template #content="{ close }">
                <div class="p-4 min-w-48">
                  <p class="text-sm text-dimmed mb-3">{{ t('settings.deleteConfigConfirm', { name: row.original.name }) }}</p>
                  <div class="flex justify-end gap-2">
                    <UButton color="neutral" variant="ghost" :label="t('common.cancel')" @click="close" />
                    <UButton
                      color="error"
                      :label="t('common.delete')"
                      :loading="deleting === row.original.id"
                      @click="async () => { await deleteConfig(row.original.id); close() }"
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
</template>
