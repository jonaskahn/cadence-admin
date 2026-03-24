<script lang="ts" setup>
/**
 * Keyboard / list toggle for model name field; place in UFormField #label next to the title.
 */
const manual = defineModel<boolean>('manual', { default: false })

const props = withDefaults(
  defineProps<{
    options: { label: string; value: string }[]
    disabled?: boolean
    /** Current model id; used to enable "choose from catalog" when it matches an option */
    modelName?: string
  }>(),
  {
    disabled: false,
    modelName: ''
  }
)

const { t } = useI18n()

const showSelect = computed(() => !props.disabled && props.options.length > 0 && !manual.value)

const trimmedName = computed(() => (props.modelName ?? '').trim())

const canToggleToCatalog = computed(() => {
  const v = trimmedName.value
  if (!v) return true
  return props.options.some((o) => o.value === v)
})

function enterManually() {
  manual.value = true
}

function chooseCatalog() {
  if (canToggleToCatalog.value) {
    manual.value = false
  }
}

const visible = computed(() => props.options.length > 0 && !props.disabled)
</script>

<template>
  <div v-if="visible" class="flex shrink-0 items-center">
    <UButton
      v-if="showSelect"
      type="button"
      color="neutral"
      variant="ghost"
      icon="i-lucide-keyboard"
      size="xs"
      square
      class="shrink-0"
      :aria-label="t('langGraphSupervisor.modelNameEnterManually')"
      :title="t('langGraphSupervisor.modelNameEnterManually')"
      @click="enterManually"
    />
    <UButton
      v-else
      type="button"
      color="neutral"
      variant="ghost"
      icon="i-lucide-list"
      size="xs"
      square
      class="shrink-0"
      :disabled="!canToggleToCatalog"
      :aria-label="t('langGraphSupervisor.modelNameChooseFromCatalog')"
      :title="canToggleToCatalog ? t('langGraphSupervisor.modelNameChooseFromCatalog') : t('langGraphSupervisor.modelNameChooseCatalogHint')"
      @click="chooseCatalog"
    />
  </div>
</template>
