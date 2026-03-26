<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    /** Key in `/api/engine/supervisor/prompts` merged map (e.g. router_node, autocompact). */
    promptKey: string
    modelValue: string
    disabled?: boolean
    rows?: number
  }>(),
  {
    disabled: false,
    rows: 2
  }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { t } = useI18n()
const toast = useToast()

const orchestratorConfig = inject<ReturnType<typeof useLangGraphOrchestratorConfig>>('langGraphOrchestratorConfig')
if (!orchestratorConfig) {
  throw new Error('LangGraphPromptOverrideField must be used inside LangGraphAiAppConfigProvider')
}

const { defaultPrompts } = toRefs(orchestratorConfig)

const localValue = computed({
  get: () => props.modelValue,
  set: (v: string) => emit('update:modelValue', v)
})

const defaultText = computed(() => defaultPrompts.value?.[props.promptKey] ?? '')
const hasDefault = computed(() => defaultText.value.length > 0)
const showPeek = ref(false)

const peekTitle = computed(() =>
  showPeek.value ? t('langGraphSupervisor.hideDefaultPrompt') : t('langGraphSupervisor.viewDefaultPrompt')
)

async function copyDefaultPrompt() {
  const text = defaultText.value
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: t('footer.copied'), icon: 'i-lucide-check', color: 'success' })
  } catch {
    toast.add({ title: t('footer.failedCopy'), color: 'error' })
  }
}
</script>

<template>
  <UFormField :description="t('settings.promptOverrideDescription')">
    <template #label>
      <div class="flex items-center gap-1">
        <span>{{ t('settings.promptOverride') }}</span>
        <UButton
          v-if="hasDefault"
          type="button"
          color="neutral"
          variant="ghost"
          icon="i-lucide-file-text"
          size="xs"
          class="shrink-0"
          :aria-pressed="showPeek"
          :aria-label="peekTitle"
          :title="peekTitle"
          :disabled="disabled"
          @click="showPeek = !showPeek"
        />
      </div>
    </template>
    <div class="flex flex-col gap-2">
      <UTextarea
        v-model="localValue"
        :disabled="disabled"
        :rows="rows"
        class="w-full"
        :placeholder="!props.modelValue.trim() ? t('langGraphSupervisor.promptOverridePlaceholderBuiltin') : undefined"
      />
      <div v-show="showPeek" class="border-default bg-muted/30 relative rounded-md border">
        <UButton
          type="button"
          class="absolute top-1 right-1 z-10"
          color="neutral"
          variant="ghost"
          icon="i-lucide-copy"
          size="xs"
          :aria-label="t('langGraphSupervisor.copyDefaultPrompt')"
          :title="t('langGraphSupervisor.copyDefaultPrompt')"
          @click="copyDefaultPrompt"
        />
        <div class="text-dimmed max-h-48 overflow-y-auto p-2 pt-8 pr-10 font-mono text-xs whitespace-pre-wrap">
          {{ defaultText }}
        </div>
      </div>
    </div>
  </UFormField>
</template>
