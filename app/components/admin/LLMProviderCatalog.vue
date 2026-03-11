<script lang="ts" setup>
import type { ProviderModelCatalogEntry } from '~/types'
import { LLM_PROVIDERS } from '~/utils'

const { t } = useI18n()
const { models, loading, fetchAll, toggleActive } = useProviderModelCatalog()

function providerLabel(provider: string): string {
  const key = `providers.${provider}`
  const val = t(key)
  return val !== key ? val : provider
}

onMounted(fetchAll)

const ALL_PROVIDERS = 'all'
const selectedProvider = ref(ALL_PROVIDERS)

const providerFilterItems = computed(() => [
  { label: t('admin.allProviders'), value: ALL_PROVIDERS },
  ...LLM_PROVIDERS.map((p) => ({ label: providerLabel(p), value: p }))
])

const filteredModels = computed(() =>
  selectedProvider.value === ALL_PROVIDERS ? models.value : models.value.filter((m) => m.provider === selectedProvider.value)
)

const columns = computed(() => [
  { accessorKey: 'provider', header: t('admin.provider') },
  { accessorKey: 'model_id', header: t('admin.modelId') },
  { accessorKey: 'display_name', header: t('admin.displayName') },
  { accessorKey: 'aliases', header: t('admin.aliases') },
  { accessorKey: 'status', header: t('admin.status') },
  { id: 'actions' }
])

const modalOpen = ref(false)
const editingModel = ref<ProviderModelCatalogEntry | undefined>(undefined)

function openAdd(): void {
  editingModel.value = undefined
  modalOpen.value = true
}

function openEdit(model: ProviderModelCatalogEntry): void {
  editingModel.value = model
  modalOpen.value = true
}

async function onModalClose(): Promise<void> {
  modalOpen.value = false
  await fetchAll()
}

const toggling = ref<string | null>(null)

async function onToggleActive(model: ProviderModelCatalogEntry) {
  const key = `${model.provider}:${model.model_id}`
  toggling.value = key
  try {
    await toggleActive(model)
  } finally {
    toggling.value = null
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UAlert
      color="info"
      icon="i-lucide-brain-circuit"
      :title="t('admin.platformModelCatalog')"
      :description="t('admin.platformModelCatalogDesc')"
      variant="subtle"
    />

    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <UButton icon="i-lucide-plus" :label="t('admin.addModel')" size="sm" @click="openAdd" />
          <USelect
            v-model="selectedProvider"
            :items="providerFilterItems"
            value-key="value"
            label-key="label"
            class="w-56"
            :placeholder="t('admin.allProviders')"
          />
        </div>
      </template>

      <div v-if="loading" class="flex flex-col gap-3 p-4">
        <USkeleton v-for="n in 6" :key="n" class="h-10 w-full" />
      </div>

      <UTable v-else :columns="columns" :data="filteredModels" :empty-state="{ icon: 'i-lucide-database', label: t('admin.noModelsFound') }">
        <template #provider-cell="{ row }">
          <UBadge color="neutral" variant="subtle">
            {{ providerLabel(row.original.provider) }}
          </UBadge>
        </template>

        <template #aliases-cell="{ row }">
          <div class="flex flex-wrap gap-1">
            <template v-if="row.original.aliases?.length">
              <UBadge v-for="alias in row.original.aliases" :key="alias" variant="soft" color="neutral">
                {{ alias }}
              </UBadge>
            </template>
            <span v-else class="text-dimmed text-sm">{{ t('common.empty') }}</span>
          </div>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="row.original.enabled ? 'success' : 'neutral'"
            :label="row.original.enabled ? t('plugins.enabled') : t('plugins.disabled')"
            variant="subtle"
          />
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end gap-2">
            <UPopover>
              <UButton
                :icon="row.original.enabled ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :label="row.original.enabled ? t('admin.disable') : t('admin.enable')"
                :color="row.original.enabled ? 'neutral' : 'success'"
                size="xs"
                variant="outline"
              />
              <template #content="{ close }">
                <div class="p-4 min-w-48">
                  <p class="text-sm text-dimmed mb-3">
                    {{ row.original.enabled ? t('admin.disableModelConfirm') : t('admin.enableModelConfirm') }}
                  </p>
                  <div class="flex justify-end gap-2">
                    <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
                    <UButton
                      variant="outline"
                      :color="row.original.enabled ? 'neutral' : 'success'"
                      :label="row.original.enabled ? t('admin.disable') : t('admin.enable')"
                      :loading="toggling === `${row.original.provider}:${row.original.model_id}`"
                      @click="async () => { await onToggleActive(row.original); close() }"
                    />
                  </div>
                </div>
              </template>
            </UPopover>
            <UButton icon="i-lucide-pencil" :label="t('common.edit')" size="xs" @click="openEdit(row.original)" />
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="modalOpen">
      <template #content>
        <ProviderModelModal :initial-value="editingModel" @close="onModalClose" />
      </template>
    </UModal>
  </div>
</template>
