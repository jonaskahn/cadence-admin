<script lang="ts" setup>
import type { TelemetryConfigResponse } from '~/types'
import { getApiErrorMessage } from '~/utils'

const toast = useToast()
const { t } = useI18n()
const { withOverlay } = useLoadingOverlay()

const { data: config, refresh } = await useApiFetch<TelemetryConfigResponse>('/api/admin/telemetry')

const form = ref<TelemetryConfigResponse>({
  enabled: false,
  service_name: '',
  service_version: '',
  environment: '',
  exporter: 'console',
  endpoint: '',
  endpoint_insecure: true,
  headers: '',
  traces_enabled: true,
  metrics_enabled: true,
  logs_enabled: true,
  trace_sampler: 'always_on',
  trace_sample_rate: 1.0,
  metrics_export_interval_ms: 60000,
  instrument_langchain: true,
  instrument_openai_agents: true,
  propagation: 'tracecontext,baggage'
})

watch(
  config,
  (val) => {
    if (val) Object.assign(form.value, val)
  },
  { immediate: true }
)

const EXPORTER_OPTIONS = [
  { label: 'Console', value: 'console' },
  { label: 'OTLP gRPC', value: 'otlp_grpc' },
  { label: 'OTLP HTTP', value: 'otlp_http' },
  { label: 'None', value: 'none' }
]

const SAMPLER_OPTIONS = [
  { label: 'Always On', value: 'always_on' },
  { label: 'Always Off', value: 'always_off' },
  { label: 'TraceId Ratio', value: 'traceid_ratio' }
]

const showEndpointFields = computed(() => form.value.exporter !== 'console' && form.value.exporter !== 'none')

const showSampleRate = computed(() => form.value.trace_sampler === 'traceid_ratio')

const statusSummary = computed(() => {
  const exporterLabel = EXPORTER_OPTIONS.find((o) => o.value === form.value.exporter)?.label ?? form.value.exporter
  const activeCount = [form.value.traces_enabled, form.value.metrics_enabled, form.value.logs_enabled].filter(Boolean).length
  return {
    enabled: form.value.enabled,
    exporter: exporterLabel,
    activeSignals: activeCount
  }
})

const saving = ref(false)

async function save() {
  saving.value = true
  try {
    await withOverlay(async () => {
      await $fetch('/api/admin/telemetry', {
        method: 'PUT',
        body: form.value
      })
      await refresh()
      toast.add({ title: t('admin.telemetrySaved'), icon: 'i-lucide-check', color: 'success' })
    })
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, t('admin.telemetrySaveFailed'))
    toast.add({ title: t('admin.telemetrySaveFailed'), description: msg, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 sm:gap-6 pt-4">
    <UAlert
      color="info"
      icon="i-lucide-radio-tower"
      :title="t('admin.telemetryConfig')"
      :description="t('admin.telemetryConfigDescription')"
      variant="subtle"
    />

    <!-- Status Summary -->
    <UCard variant="soft">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            :class="statusSummary.enabled ? 'text-success' : 'text-dimmed'"
            :name="statusSummary.enabled ? 'i-lucide-check-circle' : 'i-lucide-circle-x'"
            class="size-5"
          />
          <p class="font-semibold text-sm">{{ t('admin.telemetryConfig') }}</p>
        </div>
      </template>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <p class="text-dimmed text-sm">{{ t('admin.otelStatus') }}</p>
          <div class="flex items-center gap-1 mt-1">
            <UIcon
              :class="statusSummary.enabled ? 'text-success' : 'text-dimmed'"
              :name="statusSummary.enabled ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
              class="size-4"
            />
            <span class="text-sm">{{ statusSummary.enabled ? t('common.enabled') : t('common.disabled') }}</span>
          </div>
        </div>
        <div>
          <p class="text-dimmed text-sm">{{ t('admin.otelExporter') }}</p>
          <p class="text-sm font-medium mt-1">{{ statusSummary.exporter }}</p>
        </div>
        <div>
          <p class="text-dimmed text-sm">{{ t('admin.otelActiveSignals') }}</p>
          <p class="text-sm font-medium mt-1">{{ statusSummary.activeSignals }}/3</p>
        </div>
      </div>
    </UCard>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <!-- General -->
      <UCard variant="soft" class="min-w-0">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-settings" class="size-5 text-primary" />
            <p class="font-semibold text-sm">General</p>
          </div>
        </template>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span class="text-sm font-medium">{{ t('admin.otelEnabled') }}</span>
            <USwitch v-model="form.enabled" />
          </div>
          <UFormField label="Service Name">
            <UInput v-model="form.service_name" class="w-full" />
          </UFormField>
          <UFormField label="Service Version">
            <UInput v-model="form.service_version" class="w-full" />
          </UFormField>
          <UFormField label="Environment">
            <UInput v-model="form.environment" class="w-full" placeholder="production" />
          </UFormField>
        </div>
      </UCard>

      <!-- Export -->
      <UCard variant="soft" class="min-w-0">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-send" class="size-5 text-primary" />
            <p class="font-semibold text-sm">Export</p>
          </div>
        </template>
        <div class="flex flex-col gap-4">
          <UFormField :label="t('admin.otelExporter')">
            <USelect v-model="form.exporter" :items="EXPORTER_OPTIONS" value-key="value" label-key="label" class="w-full" />
          </UFormField>
          <template v-if="showEndpointFields">
            <UFormField :label="t('admin.otelEndpoint')">
              <UInput v-model="form.endpoint" class="w-full" placeholder="http://localhost:4317" />
            </UFormField>
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span class="text-sm font-medium">{{ t('admin.otelEndpointInsecure') }}</span>
              <USwitch v-model="form.endpoint_insecure" />
            </div>
            <UFormField :label="t('admin.otelHeaders')" :description="t('admin.otelHeadersHint')">
              <UInput v-model="form.headers" class="w-full" placeholder="Authorization=Bearer token123" />
            </UFormField>
          </template>
        </div>
      </UCard>

      <!-- Signals -->
      <UCard variant="soft" class="min-w-0">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-activity" class="size-5 text-primary" />
            <p class="font-semibold text-sm">Signals</p>
          </div>
        </template>
        <div class="flex flex-col gap-3">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span class="text-sm font-medium">{{ t('admin.otelTracesEnabled') }}</span>
            <USwitch v-model="form.traces_enabled" />
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span class="text-sm font-medium">{{ t('admin.otelMetricsEnabled') }}</span>
            <USwitch v-model="form.metrics_enabled" />
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span class="text-sm font-medium">{{ t('admin.otelLogsEnabled') }}</span>
            <USwitch v-model="form.logs_enabled" />
          </div>
        </div>
      </UCard>

      <!-- Sampling -->
      <UCard variant="soft" class="min-w-0">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-filter" class="size-5 text-primary" />
            <p class="font-semibold text-sm">Sampling</p>
          </div>
        </template>
        <div class="flex flex-col gap-4">
          <UFormField :label="t('admin.otelTraceSampler')">
            <USelect v-model="form.trace_sampler" :items="SAMPLER_OPTIONS" value-key="value" label-key="label" class="w-full" />
          </UFormField>
          <UFormField v-if="showSampleRate" :label="t('admin.otelSampleRate')" :description="t('admin.otelSampleRateHint')">
            <UInput v-model.number="form.trace_sample_rate" type="number" step="0.1" min="0" max="1" class="w-full" />
          </UFormField>
        </div>
      </UCard>

      <!-- Performance -->
      <UCard variant="soft" class="min-w-0">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-gauge" class="size-5 text-primary" />
            <p class="font-semibold text-sm">Performance</p>
          </div>
        </template>
        <div class="flex flex-col gap-4">
          <UFormField :label="t('admin.otelMetricsInterval')">
            <UInput v-model.number="form.metrics_export_interval_ms" type="number" class="w-full" />
          </UFormField>
        </div>
      </UCard>

      <!-- LLM Instrumentation -->
      <UCard variant="soft" class="min-w-0">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-brain-circuit" class="size-5 text-primary" />
            <p class="font-semibold text-sm">LLM Instrumentation</p>
          </div>
        </template>
        <div class="flex flex-col gap-3">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span class="text-sm font-medium">{{ t('admin.otelInstrumentLangchain') }}</span>
            <USwitch v-model="form.instrument_langchain" />
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span class="text-sm font-medium">{{ t('admin.otelInstrumentOpenAIAgents') }}</span>
            <USwitch v-model="form.instrument_openai_agents" />
          </div>
        </div>
      </UCard>

      <!-- Propagation (full width on lg) -->
      <UCard variant="soft" class="min-w-0 lg:col-span-2">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-network" class="size-5 text-primary" />
            <p class="font-semibold text-sm">Propagation</p>
          </div>
        </template>
        <div class="flex flex-col gap-4">
          <UFormField :label="t('admin.otelPropagation')" :description="t('admin.otelPropagationHint')">
            <UInput v-model="form.propagation" class="w-full" placeholder="tracecontext,baggage" />
          </UFormField>
        </div>
      </UCard>
    </div>

    <div class="flex justify-end">
      <ConfirmActionPopover
        label-key="common.save"
        icon="i-lucide-save"
        confirm-title-key="common.saveConfirmTitle"
        confirm-message-key="common.saveConfirmMessage"
        confirm-label-key="common.saveConfirmFriendly"
        :loading="saving"
        :on-confirm="save"
      />
    </div>
  </div>
</template>
