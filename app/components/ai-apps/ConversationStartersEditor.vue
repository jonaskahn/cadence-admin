<script lang="ts" setup>
import { BCP47_LANGUAGES, bcp47LabelFor } from '~/utils/bcp47Languages'

const MAX_QUESTIONS = 5

const props = withDefaults(
  defineProps<{
    modelValue: { language: string; questions: string[] }[]
    disabled?: boolean
  }>(),
  { disabled: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: { language: string; questions: string[] }[]]
}>()

const { t } = useI18n()

type Bcp47Code = (typeof BCP47_LANGUAGES)[number]['value']

const pendingLanguage = ref<Bcp47Code | undefined>(undefined)

const usedLanguages = computed(() => new Set(props.modelValue.map((r) => r.language)))

const languageSelectItems = computed(() =>
  BCP47_LANGUAGES.filter((l) => !usedLanguages.value.has(l.value)).map((l) => ({
    label: l.label,
    value: l.value
  }))
)

const canAddLanguage = computed(
  () =>
    !!pendingLanguage.value &&
    !usedLanguages.value.has(pendingLanguage.value) &&
    languageSelectItems.value.length > 0 &&
    !props.disabled
)

function emitRows(rows: { language: string; questions: string[] }[]) {
  emit(
    'update:modelValue',
    rows.map((r) => ({ ...r, questions: [...r.questions] }))
  )
}

function addLanguage() {
  if (!canAddLanguage.value || !pendingLanguage.value) return
  emitRows([...props.modelValue, { language: pendingLanguage.value, questions: [''] }])
  pendingLanguage.value = undefined
}

function removeLanguage(index: number) {
  emitRows(props.modelValue.filter((_, i) => i !== index))
}

function addQuestion(langIndex: number) {
  const rows = [...props.modelValue]
  const row = rows[langIndex]
  if (!row || row.questions.length >= MAX_QUESTIONS) return
  rows[langIndex] = { ...row, questions: [...row.questions, ''] }
  emitRows(rows)
}

function removeQuestion(langIndex: number, qIndex: number) {
  const rows = [...props.modelValue]
  const row = rows[langIndex]
  if (!row) return
  const nextQs = row.questions.filter((_, i) => i !== qIndex)
  rows[langIndex] = { ...row, questions: nextQs.length === 0 ? [''] : nextQs }
  emitRows(rows)
}

function setQuestion(langIndex: number, qIndex: number, value: string) {
  const rows = props.modelValue.map((r, ri) => {
    if (ri !== langIndex) return { ...r, questions: [...r.questions] }
    const qs = [...r.questions]
    qs[qIndex] = value
    return { ...r, questions: qs }
  })
  emitRows(rows)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
      <UFormField :label="t('aiApps.conversationStarters.selectLanguage')" class="min-w-0 flex-1 sm:max-w-xs">
        <USelect
          v-model="pendingLanguage"
          :items="languageSelectItems"
          class="w-full"
          :placeholder="t('aiApps.conversationStarters.selectLanguage')"
          :disabled="disabled || languageSelectItems.length === 0"
          label-key="label"
          value-key="value"
        />
      </UFormField>
      <UButton
        color="primary"
        icon="i-lucide-plus"
        :label="t('aiApps.conversationStarters.addLanguage')"
        :disabled="!canAddLanguage"
        @click="addLanguage"
      />
    </div>

    <p v-if="modelValue.length === 0" class="text-dimmed text-sm">
      {{ t('aiApps.conversationStarters.noStarters') }}
    </p>

    <div v-for="(row, li) in modelValue" :key="row.language" class="border-default rounded-lg border p-4">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span class="font-medium">{{ bcp47LabelFor(row.language) }}</span>
        <UButton
          color="neutral"
          icon="i-lucide-x"
          size="xs"
          variant="ghost"
          :aria-label="t('aiApps.conversationStarters.removeLanguage')"
          :disabled="disabled"
          @click="removeLanguage(li)"
        />
      </div>
      <div class="flex flex-col gap-2">
        <div v-for="(q, qi) in row.questions" :key="qi" class="flex items-start gap-2">
          <UInput
            :model-value="q"
            class="min-w-0 flex-1"
            :placeholder="t('aiApps.conversationStarters.questionPlaceholder')"
            :disabled="disabled"
            @update:model-value="(v) => setQuestion(li, qi, String(v ?? ''))"
          />
          <UButton
            color="neutral"
            icon="i-lucide-x"
            size="sm"
            square
            variant="ghost"
            :aria-label="t('aiApps.conversationStarters.removeQuestion')"
            :disabled="disabled"
            @click="removeQuestion(li, qi)"
          />
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            color="neutral"
            icon="i-lucide-plus"
            size="xs"
            variant="soft"
            :label="t('aiApps.conversationStarters.addQuestion')"
            :disabled="disabled || row.questions.length >= MAX_QUESTIONS"
            @click="addQuestion(li)"
          />
          <span v-if="row.questions.length >= MAX_QUESTIONS" class="text-dimmed text-xs">
            {{ t('aiApps.conversationStarters.maxQuestionsReached') }}
          </span>
          <span v-else class="text-dimmed text-xs">
            {{ t('aiApps.conversationStarters.questionsRemaining', { count: MAX_QUESTIONS - row.questions.length }) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
