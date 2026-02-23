<script lang="ts" setup>
import { reactive } from 'vue'

const props = defineProps<{
  orgId: string
  initialValue?: Record<string, unknown>
  disabled?: boolean
  supportedProviders?: string[] | null
}>()

const orgIdRef = computed(() => props.orgId)
const initialValueRef = computed(() => props.initialValue)
const supportedProvidersRef = computed(() => props.supportedProviders ?? null)
const disabledRef = computed(() => props.disabled ?? false)

const supervisor = useLangGraphSupervisor(orgIdRef, initialValueRef, supportedProvidersRef, disabledRef)

provide('langGraphSupervisor', reactive(supervisor))

defineExpose({
  isValid: () => supervisor.isValid(),
  getValue: () => supervisor.getValue()
})
</script>

<template>
  <slot />
</template>
