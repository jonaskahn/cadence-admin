<script setup lang="ts">
const supervisor = inject<ReturnType<typeof useLangGraphSupervisor>>('langGraphSupervisor')
if (!supervisor) throw new Error('LangGraphDefaultLLMConfig must be used inside LangGraphSupervisorProvider')

const { t } = useI18n()
const { disabled } = defineProps<{ disabled?: boolean }>()

function toggleDefaultModelManual() {
  supervisor.defaultModelManual = !supervisor.defaultModelManual
  supervisor.defaultModelName = ''
}
</script>

<template>
  <div class="flex flex-col flex-col-1 gap-4">
    <UFormField :description="t('langGraphSupervisor.defaultLlmConfigDescription')" :label="t('langGraphSupervisor.defaultLlmConfig')">
      <USelect
        v-model="supervisor.defaultLlmConfigId"
        :disabled="disabled"
        :items="supervisor.llmConfigOptions"
        :loading="supervisor.llmConfigsLoading"
        class="w-full"
        :placeholder="t('langGraphSupervisor.placeholderSelectConfig')"
      />
    </UFormField>

    <UFormField :description="t('langGraphSupervisor.defaultModelDescription')" :label="t('langGraphSupervisor.defaultModel')">
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
          :placeholder="t('langGraphSupervisor.placeholderSelectModel')"
        />
        <UButton
          :icon="supervisor.defaultModelManual ? 'i-lucide-list' : 'i-lucide-pencil'"
          :title="supervisor.defaultModelManual ? t('settings.selectFromList') : t('settings.enterManually')"
          @click="toggleDefaultModelManual"
        />
      </div>
    </UFormField>

    <UFormField :description="t('langGraphSupervisor.defaultTemperatureDescription')" :label="t('langGraphSupervisor.defaultTemperature')">
      <UInput v-model.number="supervisor.defaultTemperature" :disabled="disabled" :max="2" :min="0" :step="0.1" class="w-full" type="number" />
    </UFormField>

    <UFormField :description="t('langGraphSupervisor.defaultMaxTokensDescription')" :label="t('langGraphSupervisor.defaultMaxTokens')">
      <UInput v-model.number="supervisor.defaultMaxTokens" :disabled="disabled" :min="256" class="w-full" type="number" />
    </UFormField>
  </div>
</template>
