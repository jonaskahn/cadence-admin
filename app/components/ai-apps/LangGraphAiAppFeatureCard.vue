<script lang="ts" setup>
/**
 * LangGraph follow-up / auto-compact: header switch binds directly to `mode_config.enabled_suggestion` or
 * `enabled_auto_compact`. Same value controls card fold (open = on). Inner node fields use `hide-header-switch`.
 */
const props = defineProps<{
  feature: 'suggestion' | 'autocompact'
  sectionLabel: string
}>()

const orchestratorConfig = inject<ReturnType<typeof useLangGraphOrchestratorConfig>>('langGraphOrchestratorConfig')
if (!orchestratorConfig) {
  throw new Error('LangGraphAiAppFeatureCard must be used inside LangGraphAiAppConfigProvider')
}

const { modeConfig } = orchestratorConfig

const enabled = computed({
  get: () => (props.feature === 'suggestion' ? modeConfig.enabled_suggestion : modeConfig.enabled_auto_compact),
  set: (v: boolean) => {
    if (props.feature === 'suggestion') {
      modeConfig.enabled_suggestion = v
    } else {
      modeConfig.enabled_auto_compact = v
    }
  }
})
</script>

<template>
  <AiAppCollapsibleFeatureCard v-model:enabled="enabled" :section-label="sectionLabel">
    <template #header>
      <slot name="header" />
    </template>
    <LangGraphModeFeatureNodeCard :feature="feature" hide-header-switch />
  </AiAppCollapsibleFeatureCard>
</template>
