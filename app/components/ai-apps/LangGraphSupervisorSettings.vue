<script lang="ts" setup>
defineProps<{
  orgId: string
  initialValue?: Record<string, unknown>
  disabled?: boolean
  supportedProviders?: string[] | null
}>()

const providerRef = ref<{ isValid: () => boolean; getValue: () => Record<string, unknown> } | null>(null)

defineExpose({
  isValid: () => providerRef.value?.isValid() ?? false,
  getValue: () => providerRef.value?.getValue() ?? {}
})
</script>

<template>
  <LangGraphAiAppConfigProvider
    ref="providerRef"
    :org-id="orgId"
    :initial-value="initialValue"
    :supported-providers="supportedProviders"
    :disabled="disabled"
    mode="supervisor"
  >
    <LangGraphSupervisorSection />
  </LangGraphAiAppConfigProvider>
</template>
