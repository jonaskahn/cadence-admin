<script lang="ts" setup>
import { SUPERVISOR_NODE_KEYS } from '~/composables/langgraphOrchestratorConfig/nodeKeys'

const { t } = useI18n()

withDefaults(
  defineProps<{
    /** Hide the section title row (Supervisor Settings + info popover) */
    hideHeader?: boolean
  }>(),
  { hideHeader: false }
)

function featureToggleFor(
  key: (typeof SUPERVISOR_NODE_KEYS)[number]
): 'llm_validation' | 'clarification_intent' | undefined {
  if (key === 'validation_node') return 'llm_validation'
  if (key === 'clarifier_node') return 'clarification_intent'
  return undefined
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col gap-8">
    <div v-if="!hideHeader" class="flex min-w-0 flex-col gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <span class="font-semibold">{{ t('aiApps.create.supervisorSettings') }}</span>
        <InfoPopover
          title-key="info.aiAppSections.supervisorLlmConfig.title"
          description-key="info.aiAppSections.supervisorLlmConfig.description"
        />
      </div>
      <USeparator />
    </div>

    <LangGraphSupervisorParallelToolsCard class="w-full min-w-0" />

    <USeparator :label="t('aiApps.supervisor.nodeOverrides')" />

    <div class="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
      <LangGraphSupervisorNodeOverrideCard
        v-for="key in SUPERVISOR_NODE_KEYS"
        :key="key"
        :node-key="key"
        :feature-toggle="featureToggleFor(key)"
      />
    </div>
  </div>
</template>
