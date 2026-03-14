<script setup lang="ts">
/**
 * Reusable confirmation popover for Save/Update/Delete actions.
 * Standardizes button labels and friendly confirmation copy across the app.
 */

type ButtonColor = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'neutral'
type ButtonVariant = 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const props = withDefaults(
  defineProps<{
    /** i18n key for the trigger button label (e.g. common.save, common.update, common.delete) */
    labelKey: string
    /** Optional raw label; overrides labelKey if provided */
    label?: string
    /** Icon for the trigger button */
    icon?: string
    /** Button color (e.g. primary, error for delete) */
    color?: ButtonColor
    /** Button variant */
    variant?: ButtonVariant
    /** Button size */
    size?: ButtonSize
    /** i18n key for the popover title (e.g. common.saveConfirmTitle = "Save") */
    confirmTitleKey: string
    /** i18n key for the popover description (clear, meaningful explanation of the action) */
    confirmMessageKey: string
    /** Params for the confirmation message (e.g. { name: 'foo' }) */
    confirmMessageParams?: Record<string, string>
    /** i18n key for the confirm button label (e.g. common.saveConfirmFriendly = "Let's save it"); defaults to labelKey */
    confirmLabelKey?: string
    /** Icon for the confirm button */
    confirmIcon?: string
    /** Color for the confirm button (e.g. error for delete) */
    confirmColor?: ButtonColor
    /** Variant for the confirm button */
    confirmVariant?: ButtonVariant
    /** Loading state for the confirm button */
    loading?: boolean
    /** type attribute for trigger button (e.g. "button" to prevent form submit) */
    type?: 'button' | 'submit'
    /** Handler called when user confirms; can be sync or async. Popover closes after it completes. */
    onConfirm?: () => void | Promise<void>
  }>(),
  {
    confirmLabelKey: undefined,
    variant: 'outline',
    confirmVariant: 'outline',
    type: 'button'
  }
)

const emit = defineEmits<{
  confirm: []
}>()

const { t } = useI18n()

const triggerLabel = computed(() => props.label ?? t(props.labelKey))
const confirmLabel = computed(() => t(props.confirmLabelKey ?? props.labelKey))
const confirmTitle = computed(() => t(props.confirmTitleKey))
const confirmMessage = computed(() => (props.confirmMessageParams ? t(props.confirmMessageKey, props.confirmMessageParams) : t(props.confirmMessageKey)))

async function handleConfirm(close: () => void) {
  const fn = props.onConfirm
  if (fn) {
    const result = fn()
    if (result && typeof result.then === 'function') {
      await result
    }
  }
  emit('confirm')
  close()
}
</script>

<template>
  <UPopover>
    <UButton :type="type" :icon="icon" :color="color" :variant="variant" :size="size" :label="triggerLabel" />
    <template #content="{ close }">
      <div class="flex flex-col gap-3 p-4 min-w-56">
        <!-- Row 1: Title -->
        <p class="font-semibold text-sm">{{ confirmTitle }}</p>
        <!-- Row 2: Description -->
        <p v-if="!$slots.default" class="text-sm text-dimmed">{{ confirmMessage }}</p>
        <slot v-else />
        <!-- Row 3: Action -->
        <div class="flex justify-end gap-2 pt-1">
          <UButton color="neutral" :label="t('common.cancel')" variant="ghost" @click="close" />
          <UButton
            :variant="confirmVariant"
            :color="confirmColor"
            :icon="confirmIcon ?? icon"
            :loading="loading"
            :label="confirmLabel"
            @click="handleConfirm(close)"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
