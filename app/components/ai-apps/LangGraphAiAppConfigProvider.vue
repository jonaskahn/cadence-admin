<script lang="ts" setup>
import type { OrchestratorDefaults } from '~/types'

const props = withDefaults(
  defineProps<{
    orgId: string
    initialValue?: Record<string, unknown>
    supportedProviders?: string[] | null
    disabled?: boolean
    mode?: string
    groundedModeConfig?: Record<string, unknown>
    orchestratorDefaults?: OrchestratorDefaults | null
    requireDefaultLlm?: boolean
  }>(),
  {
    disabled: false,
    mode: 'supervisor',
    groundedModeConfig: () => ({}),
    requireDefaultLlm: false
  }
)

const orgIdRef = toRef(props, 'orgId')
const initialValueRef = toRef(props, 'initialValue')
const supportedProvidersRef = toRef(props, 'supportedProviders')
const disabledRef = toRef(props, 'disabled')
const orchestratorDefaultsRef = toRef(props, 'orchestratorDefaults')
const requireDefaultLlmRef = toRef(props, 'requireDefaultLlm')
const isGroundedMode = computed(() => props.mode === 'grounded')

const orchestratorConfig = useLangGraphOrchestratorConfig(
  orgIdRef,
  initialValueRef,
  supportedProvidersRef,
  disabledRef,
  orchestratorDefaultsRef,
  isGroundedMode,
  requireDefaultLlmRef
)

provide('langGraphOrchestratorConfig', orchestratorConfig)

function getValue(): Record<string, unknown> {
  if (props.mode === 'grounded') {
    return orchestratorConfig.getGroundedValue(props.groundedModeConfig ?? {})
  }
  return orchestratorConfig.getValue()
}

function isValid(): boolean {
  return orchestratorConfig.isValid()
}

defineExpose({ getValue, isValid })
</script>

<template>
  <div class="contents">
    <slot />
  </div>
</template>
