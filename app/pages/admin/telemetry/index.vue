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

watch(config, (val) => {
  if (val) Object.assign(form.value, val)
}, { immediate: true })

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

const showEndpointFields = computed(() =>
  form.value.exporter !== 'console' && form.value.exporter !== 'none'
)

const showSampleRate = computed(() => form.value.trace_sampler === 'traceid_ratio')

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
  <div class="min-w-0 flex-1 flex flex-col overflow-hidden">
    <UDashboardPanel id="admin-telemetry">
      <template #header>
        <UDashboardNavbar :title="t('admin.telemetryConfig')">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="p-6 flex flex-col gap-6 max-w-2xl">
          <UAlert
            color="info"
            icon="i-lucide-radio-tower"
            :title="t('admin.telemetryConfig')"
            :description="t('admin.telemetryConfigDescription')"
            variant="subtle"
          />

          <!-- General -->
          <UCard variant="soft">
            <template #header>
              <p class="font-semibold text-sm">General</p>
            </template>
            <div class="flex flex-col gap-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">{{ t('admin.otelEnabled') }}</span>
                <UToggle v-model="form.enabled" />
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
          <UCard variant="soft">
            <template #header>
              <p class="font-semibold text-sm">Export</p>
            </template>
            <div class="flex flex-col gap-4">
              <UFormField :label="t('admin.otelExporter')">
                <USelect v-model="form.exporter" :items="EXPORTER_OPTIONS" value-key="value" label-key="label" class="w-full" />
              </UFormField>
              <template v-if="showEndpointFields">
                <UFormField :label="t('admin.otelEndpoint')">
                  <UInput v-model="form.endpoint" class="w-full" placeholder="http://localhost:4317" />
                </UFormField>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">{{ t('admin.otelEndpointInsecure') }}</span>
                  <UToggle v-model="form.endpoint_insecure" />
                </div>
                <UFormField :label="t('admin.otelHeaders')" :description="t('admin.otelHeadersHint')">
                  <UInput v-model="form.headers" class="w-full" placeholder="Authorization=Bearer token123" />
                </UFormField>
              </template>
            </div>
          </UCard>

          <!-- Signals -->
          <UCard variant="soft">
            <template #header>
              <p class="font-semibold text-sm">Signals</p>
            </template>
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">{{ t('admin.otelTracesEnabled') }}</span>
                <UToggle v-model="form.traces_enabled" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">{{ t('admin.otelMetricsEnabled') }}</span>
                <UToggle v-model="form.metrics_enabled" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">{{ t('admin.otelLogsEnabled') }}</span>
                <UToggle v-model="form.logs_enabled" />
              </div>
            </div>
          </UCard>

          <!-- Sampling -->
          <UCard variant="soft">
            <template #header>
              <p class="font-semibold text-sm">Sampling</p>
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
          <UCard variant="soft">
            <template #header>
              <p class="font-semibold text-sm">Performance</p>
            </template>
            <div class="flex flex-col gap-4">
              <UFormField :label="t('admin.otelMetricsInterval')">
                <UInput v-model.number="form.metrics_export_interval_ms" type="number" class="w-full" />
              </UFormField>
            </div>
          </UCard>

          <!-- LLM Instrumentation -->
          <UCard variant="soft">
            <template #header>
              <p class="font-semibold text-sm">LLM Instrumentation</p>
            </template>
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">{{ t('admin.otelInstrumentLangchain') }}</span>
                <UToggle v-model="form.instrument_langchain" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">{{ t('admin.otelInstrumentOpenAIAgents') }}</span>
                <UToggle v-model="form.instrument_openai_agents" />
              </div>
            </div>
          </UCard>

          <!-- Propagation -->
          <UCard variant="soft">
            <template #header>
              <p class="font-semibold text-sm">Propagation</p>
            </template>
            <div class="flex flex-col gap-4">
              <UFormField :label="t('admin.otelPropagation')" :description="t('admin.otelPropagationHint')">
                <UInput v-model="form.propagation" class="w-full" placeholder="tracecontext,baggage" />
              </UFormField>
            </div>
          </UCard>

          <div class="flex justify-end">
            <ConfirmActionPopover
              label-key="common.save"
              icon="i-lucide-save"
              size="sm"
              confirm-title-key="common.saveConfirmTitle"
              confirm-message-key="common.saveConfirmMessage"
              confirm-label-key="common.saveConfirmFriendly"
              :loading="saving"
              :on-confirm="save"
            />
          </div>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
