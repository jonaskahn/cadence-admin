<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    code?: string | null
    message?: string | null
    requestId?: string | null
  }>(),
  {
    code: null,
    message: null,
    requestId: null
  }
)

const { t } = useI18n()
const { copy, copied } = useClipboard()

const hasContent = computed(() => !!(props.code?.trim() || props.message?.trim() || props.requestId?.trim()))

const title = computed(() => {
  const c = props.code?.trim()
  const m = props.message?.trim()
  if (c && m) return `${c} · ${m}`
  if (m) return m
  if (c) return c
  return t('errors.error')
})

async function copyRequestId() {
  if (props.requestId) {
    await copy(props.requestId)
  }
}

const copyAriaLabel = computed(() => (copied.value ? t('errors.copied') : t('errors.copy')))
</script>

<template>
  <UAlert
    v-if="hasContent"
    class="border-error/20"
    color="error"
    icon="i-lucide-circle-alert"
    variant="subtle"
    :title="title"
  >
    <template v-if="requestId" #description>
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <span class="text-dimmed shrink-0 text-xs font-medium tracking-wide uppercase">{{
          t('errors.requestId')
        }}</span>
        <code class="bg-elevated text-default min-w-0 flex-1 rounded-md px-2 py-1.5 font-mono text-xs break-all">{{
          requestId
        }}</code>
        <UButton
          class="shrink-0"
          color="neutral"
          :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
          size="xs"
          square
          variant="soft"
          :aria-label="copyAriaLabel"
          @click="copyRequestId"
        />
      </div>
    </template>
  </UAlert>
</template>
