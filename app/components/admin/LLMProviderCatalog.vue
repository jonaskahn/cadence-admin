<script lang="ts" setup>
import type { ProviderModelCatalogEntry } from '~/types'
import { LLM_PROVIDERS } from '~/utils'
import { MODEL_CATEGORIES } from '~/utils/providerModelCatalog'

const { t } = useI18n()
const { providerLabel, adminModelCategoryLabel } = useI18nEntityLabels()
const { models, loading, fetchAll, toggleActive } = useProviderModelCatalog()

function formatCatalogPrice(value: string | null, currency: string): string {
  if (value == null || value === '') return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return value
  const code = currency?.length === 3 ? currency : 'USD'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 8
    }).format(n)
  } catch {
    return `${value} ${currency}`
  }
}

onMounted(fetchAll)

const ALL_PROVIDERS = 'all'
const ALL_CATEGORIES = 'all'
const selectedProvider = ref(ALL_PROVIDERS)
const selectedCategory = ref(ALL_CATEGORIES)

const providerFilterItems = computed(() => [
  { label: t('admin.allProviders'), value: ALL_PROVIDERS },
  ...LLM_PROVIDERS.map((p) => ({ label: providerLabel(p), value: p }))
])

const categoryFilterItems = computed(() => [
  { label: t('admin.allCategories'), value: ALL_CATEGORIES },
  ...MODEL_CATEGORIES.map((c) => ({ label: adminModelCategoryLabel(c), value: c }))
])

const filteredModels = computed(() => {
  let list =
    selectedProvider.value === ALL_PROVIDERS
      ? models.value
      : models.value.filter((m) => m.provider === selectedProvider.value)
  if (selectedCategory.value !== ALL_CATEGORIES) {
    list = list.filter((m) => m.model_category === selectedCategory.value)
  }
  return list
})

const columns = computed(() => [
  { accessorKey: 'provider', header: t('admin.provider') },
  { accessorKey: 'model_id', header: t('admin.modelId') },
  { accessorKey: 'display_name', header: t('admin.displayName') },
  { accessorKey: 'model_category', header: t('admin.modelCategoryLabel') },
  { id: 'input_price', header: t('admin.inputPriceShort') },
  { id: 'output_price', header: t('admin.outputPriceShort') },
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

async function handleToggleConfirm(model: ProviderModelCatalogEntry, close: () => void) {
  await onToggleActive(model)
  close()
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

    <UCard variant="soft">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <UButton icon="i-lucide-plus" :label="t('admin.addModel')" size="md" @click="openAdd" />
          <div class="flex flex-wrap items-center gap-2">
            <USelect
              v-model="selectedProvider"
              :items="providerFilterItems"
              value-key="value"
              label-key="label"
              class="w-56"
              :placeholder="t('admin.allProviders')"
            />
            <USelect
              v-model="selectedCategory"
              :items="categoryFilterItems"
              value-key="value"
              label-key="label"
              class="w-56"
              :placeholder="t('admin.allCategories')"
            />
          </div>
        </div>
      </template>

      <div v-if="loading" class="flex flex-col gap-3 p-4">
        <USkeleton v-for="n in 6" :key="n" class="h-10 w-full" />
      </div>

      <UTable
        v-else
        :columns="columns"
        :data="filteredModels"
        :empty-state="{ icon: 'i-lucide-database', label: t('admin.noModelsFound') }"
      >
        <template #provider-cell="{ row }">
          <UBadge color="neutral" variant="subtle">
            {{ providerLabel(row.original.provider) }}
          </UBadge>
        </template>

        <template #model_category-cell="{ row }">
          <UBadge color="neutral" variant="soft" size="md">
            {{ adminModelCategoryLabel(row.original.model_category) }}
          </UBadge>
        </template>

        <template #input_price-cell="{ row }">
          <span class="text-sm tabular-nums">
            {{ formatCatalogPrice(row.original.input_price_per_unit, row.original.currency) }}
          </span>
        </template>

        <template #output_price-cell="{ row }">
          <span class="text-sm tabular-nums">
            {{ formatCatalogPrice(row.original.output_price_per_unit, row.original.currency) }}
          </span>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="row.original.enabled ? 'success' : 'error'"
            :label="row.original.enabled ? t('plugins.enabled') : t('plugins.disabled')"
            variant="outline"
            size="md"
          />
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end gap-2">
            <UPopover>
              <UButton
                :icon="row.original.enabled ? 'i-lucide-route-off' : 'i-lucide-route'"
                :label="row.original.enabled ? t('admin.disable') : t('admin.enable')"
                :color="row.original.enabled ? 'neutral' : 'success'"
                size="sm"
              />
              <template #content="{ close }">
                <div class="p-4 min-w-48">
                  <p class="text-sm text-dimmed mb-3">
                    {{ row.original.enabled ? t('admin.disableModelConfirm') : t('admin.enableModelConfirm') }}
                  </p>
                  <div class="flex justify-end gap-2">
                    <UButton color="neutral" size="sm" :label="t('common.cancel')" variant="ghost" @click="close" />
                    <UButton
                      size="sm"
                      :color="row.original.enabled ? 'neutral' : 'success'"
                      :label="row.original.enabled ? t('admin.disable') : t('admin.enable')"
                      :loading="toggling === `${row.original.provider}:${row.original.model_id}`"
                      @click="handleToggleConfirm(row.original, close)"
                    />
                  </div>
                </div>
              </template>
            </UPopover>
            <UButton icon="i-lucide-pencil" :label="t('common.edit')" size="sm" @click="openEdit(row.original)" />
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
