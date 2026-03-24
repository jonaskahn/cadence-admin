<script lang="ts" setup>
import type { GroundedNodeKey } from '~/composables/langgraphOrchestratorConfig/nodeKeys'
import { GROUNDED_NODE_KEYS } from '~/composables/langgraphOrchestratorConfig/nodeKeys'

const { t } = useI18n()

const groundedConfig = defineModel<Record<string, unknown>>({ required: true })

function featureToggleFor(key: GroundedNodeKey): 'llm_validation' | undefined {
  if (key === 'validation_node') return 'llm_validation'
  return undefined
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col gap-8">
    <div class="flex min-w-0 flex-col gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <UIcon name="i-lucide-anchor" />
        <span class="font-semibold">{{ t('aiApps.grounded.settingsTitle') }}</span>
      </div>
      <USeparator />
    </div>

    <UCard variant="soft" class="min-w-0 w-full">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-layers" />
          <span class="font-semibold">{{ t('aiApps.grounded.workflowSettings') }}</span>
        </div>
      </template>
      <GroundedModeSettings v-model="groundedConfig" />
    </UCard>

    <USeparator :label="t('aiApps.supervisor.nodeOverrides')" />

    <div class="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
      <LangGraphSupervisorNodeOverrideCard v-for="key in GROUNDED_NODE_KEYS" :key="key" :node-key="key" :feature-toggle="featureToggleFor(key)" />
    </div>
  </div>
</template>
