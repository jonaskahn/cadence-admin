<script setup lang="ts">
/**
 * Reusable info popover for contextual help.
 * Shows title and description on click. Use next to page/section titles or form field labels.
 */

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

withDefaults(
  defineProps<{
    /** i18n key for the popover title */
    titleKey: string
    /** i18n key for the popover description */
    descriptionKey: string
    /** Size of the info icon button */
    size?: ButtonSize
  }>(),
  {
    size: 'xs'
  }
)

const { t } = useI18n()
</script>

<template>
  <UPopover>
    <UButton icon="i-lucide-info" :size="size" color="primary" variant="ghost" />
    <template #content>
      <div class="flex max-w-md min-w-64 flex-col gap-3 p-4">
        <p class="text-sm font-semibold">{{ t(titleKey) }}</p>
        <MDC
          :value="t(descriptionKey)"
          class="prose prose-sm dark:prose-invert text-dimmed max-w-none [&_*]:text-sm [&_ol]:my-1 [&_p]:my-1 [&_ul]:my-1"
          tag="div"
        />
      </div>
    </template>
  </UPopover>
</template>
