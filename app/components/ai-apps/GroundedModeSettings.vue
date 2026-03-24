<script lang="ts" setup>
const { t } = useI18n()

const scopeModel = defineModel<Record<string, unknown>>({ required: true })

const orchestratorConfig = inject<ReturnType<typeof useLangGraphOrchestratorConfig>>('langGraphOrchestratorConfig')
if (!orchestratorConfig) {
  throw new Error('GroundedModeSettings must be used inside LangGraphAiAppConfigProvider')
}

const { modeConfig } = orchestratorConfig

const scopeRules = computed({
  get: () => String(scopeModel.value.scope_rules ?? ''),
  set: (v: string) => {
    scopeModel.value = { ...scopeModel.value, scope_rules: v }
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <UFormField :label="t('aiApps.grounded.scopeRules')" :description="t('aiApps.grounded.scopeRulesDesc')">
      <UTextarea v-model="scopeRules" class="w-full font-mono text-sm" :rows="4" :placeholder="t('aiApps.grounded.scopeRulesPlaceholder')" />
    </UFormField>
    <UFormField :label="t('aiApps.grounded.maxAgentHops')" :description="t('aiApps.grounded.maxAgentHopsDesc')">
      <UInput v-model.number="modeConfig.max_agent_hops" type="number" class="w-full" />
    </UFormField>
    <UFormField :label="t('aiApps.grounded.maxToolRounds')" :description="t('aiApps.grounded.maxToolRoundsDesc')">
      <UInput v-model.number="modeConfig.max_tool_rounds" type="number" class="w-full" />
    </UFormField>
  </div>
</template>
