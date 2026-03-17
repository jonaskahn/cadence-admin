<script setup lang="ts">
const supervisor = inject<ReturnType<typeof useLangGraphSupervisor>>('langGraphSupervisor')
if (!supervisor) throw new Error('LangGraphDefaultLLMConfig must be used inside LangGraphSupervisorProvider')

const { t } = useI18n()
const { disabled } = defineProps<{ disabled?: boolean }>()

const llmConfigPlaceholder = computed(() => {
  if (unref(supervisor.llmConfigsLoading)) return t('langGraphSupervisor.placeholderLoading')
  const opts = unref(supervisor.llmConfigOptions)
  if (!opts?.length) return t('langGraphSupervisor.placeholderNoConfigs')
  return t('langGraphSupervisor.placeholderSelectConfig')
})

function toggleDefaultModelManual() {
  supervisor.defaultModelManual = !supervisor.defaultModelManual
  supervisor.defaultModelName = undefined
}
</script>

<template>
  <div v-if="supervisor" class="flex flex-col gap-4 min-w-0">
    <div class="grid grid-cols-1 gap-4">
      <UFormField :description="t('langGraphSupervisor.defaultLlmConfigDescription')" :label="t('langGraphSupervisor.defaultLlmConfig')" required>
        <USelect
          v-model="supervisor.defaultLlmConfigId"
          :disabled="disabled || supervisor.llmConfigsLoading || supervisor.llmConfigOptions.length === 0"
          :items="supervisor.llmConfigOptions"
          :loading="supervisor.llmConfigsLoading"
          :placeholder="llmConfigPlaceholder"
          class="w-full"
          label-key="label"
          value-key="value"
        />
      </UFormField>

      <UFormField :description="t('langGraphSupervisor.defaultModelDescription')" :label="t('langGraphSupervisor.defaultModel')" required>
        <div class="flex gap-2 items-center w-full">
          <UInput
            v-if="supervisor.defaultModelManual"
            v-model="supervisor.defaultModelName"
            :disabled="disabled"
            class="flex-1"
            :placeholder="t('settings.modelPlaceholder')"
          />
          <USelect
            v-else
            v-model="supervisor.defaultModelName"
            :disabled="disabled"
            :items="supervisor.defaultModelOptions"
            class="flex-1"
            label-key="label"
            :placeholder="t('langGraphSupervisor.placeholderSelectModel')"
            value-key="value"
          />
          <UButton
            :icon="supervisor.defaultModelManual ? 'i-lucide-list' : 'i-lucide-pencil'"
            :title="supervisor.defaultModelManual ? t('settings.selectFromList') : t('settings.enterManually')"
            color="neutral"
            variant="outline"
            @click="toggleDefaultModelManual"
          />
        </div>
      </UFormField>
    </div>

    <div class="grid grid-cols-1 gap-4">
      <UFormField :description="t('langGraphSupervisor.defaultTemperatureDescription')" :label="t('langGraphSupervisor.defaultTemperature')" required>
        <UInput
          v-model.number="supervisor.defaultTemperature"
          :disabled="disabled"
          :max="2"
          :min="0"
          :step="0.1"
          class="w-full"
          :placeholder="t('langGraphSupervisor.placeholderSystemDefault')"
          type="number"
        />
      </UFormField>
      <UFormField :description="t('langGraphSupervisor.defaultMaxTokensDescription')" :label="t('langGraphSupervisor.defaultMaxTokens')" required>
        <UInput
          v-model.number="supervisor.defaultMaxTokens"
          :disabled="disabled"
          :max="4096"
          :min="1024"
          class="w-full"
          :placeholder="t('langGraphSupervisor.placeholderSystemDefault')"
          type="number"
        />
      </UFormField>
    </div>
  </div>
</template>
