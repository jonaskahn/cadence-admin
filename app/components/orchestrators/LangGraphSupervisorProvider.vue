<script lang="ts" setup>
import { reactive } from 'vue'

const props = defineProps<{
  orgId: string
  initialValue?: Record<string, unknown>
  disabled?: boolean
  supportedProviders?: string[] | null
  mode?: string
  groundedModeConfig?: Record<string, unknown>
}>()

const orgIdRef = computed(() => props.orgId)
const initialValueRef = computed(() => props.initialValue)
const supportedProvidersRef = computed(() => props.supportedProviders ?? null)
const disabledRef = computed(() => props.disabled ?? false)

const supervisor = useLangGraphSupervisor(orgIdRef, initialValueRef, supportedProvidersRef, disabledRef)

provide('langGraphSupervisor', reactive(supervisor))

function getValue() {
  const base = supervisor.getValue()
  if (props.mode === 'grounded' && props.groundedModeConfig) {
    const groundedNodeOverrides = supervisor.getGroundedNodeOverrides()
    const modeConfig = (base.mode_config ?? {}) as Record<string, unknown>
    return {
      ...base,
      mode_config: {
        ...modeConfig,
        ...props.groundedModeConfig,
        ...groundedNodeOverrides
      }
    }
  }
  return base
}

defineExpose({
  isValid: () => supervisor.isValid(),
  getValue
})
</script>

<template>
  <slot />
</template>
