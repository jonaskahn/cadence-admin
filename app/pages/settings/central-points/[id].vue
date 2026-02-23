<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { CentralPointResponse, OrchestratorResponse } from '~/types'
import { getApiErrorMessage } from '~/utils'

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const auth = useAuth()
const toast = useToast()
const { t } = useI18n()

const centerPointId = route.params.id as string
const orgId = computed(() => auth.currentOrgId.value || '')

const { data: centerPoint, refresh } = await useFetch<CentralPointResponse>(() => `/api/orgs/${orgId.value}/central-points/${centerPointId}`, {
  watch: [orgId]
})

const { data: orchestrators } = await useFetch<OrchestratorResponse[]>(() => `/api/orgs/${orgId.value}/orchestrators`, { watch: [orgId] })

// ── Basic info form ──────────────────────────────────────────────────────────

const schema = computed(() =>
  z.object({
    name: z.string().min(1, t('common.nameRequired')).max(255),
    description: z.string().optional().nullable(),
    orchestrator_id: z.string().min(1, t('centralPoints.orchestratorRequired')),
    visibility: z.enum(['public', 'private'])
  })
)

type Schema = {
  name: string
  description?: string | null
  orchestrator_id: string
  visibility: 'public' | 'private'
}

const state = reactive<Partial<Schema>>({
  name: '',
  description: null,
  orchestrator_id: '',
  visibility: 'private'
})

watch(
  centerPoint,
  (cp) => {
    if (!cp) return
    state.name = cp.name
    state.description = cp.description
    state.orchestrator_id = cp.orchestrator_id
    state.visibility = cp.visibility as 'public' | 'private'
  },
  { immediate: true }
)

const orchestratorOptions = computed(() =>
  (orchestrators.value || []).filter((o) => o.status === 'active').map((o) => ({ label: o.name, value: o.instance_id }))
)

const visibilityItems = computed(() => [
  { label: t('centralPoints.visibilityPrivate'), value: 'private' },
  { label: t('centralPoints.visibilityPublic'), value: 'public' }
])

const saving = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    await $fetch(`/api/orgs/${orgId.value}/central-points/${centerPointId}`, {
      method: 'PATCH',
      body: {
        name: event.data.name,
        description: event.data.description ?? null,
        orchestrator_id: event.data.orchestrator_id,
        visibility: event.data.visibility
      }
    })
    await refresh()
    toast.add({ title: t('centralPoints.updatedSuccess'), icon: 'i-lucide-check', color: 'success' })
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, t('centralPoints.failedUpdate'))
    toast.add({ title: t('errors.error'), description: msg, color: 'error' })
  } finally {
    saving.value = false
  }
}

// ── API integration ──────────────────────────────────────────────────────────

const baseUrl = ref('https://your-instance.com')
onMounted(() => {
  baseUrl.value = window.location.origin
})

const isPrivate = computed(() => centerPoint.value?.visibility === 'private')

const langTabs = [
  { label: 'cURL', slot: 'curl' },
  { label: 'Python', slot: 'python' },
  { label: 'JavaScript', slot: 'js' },
  { label: 'TypeScript', slot: 'ts' },
  { label: 'Go', slot: 'go' }
]

const curlCode = computed(() => {
  const authLine = isPrivate.value ? `\n  -H 'Authorization: Bearer YOUR_TOKEN' \\` : ''
  return `curl -X POST '${baseUrl.value}/api/chat/completion' \\
  -H 'Content-Type: application/json' \\${authLine}
  -d '{
    "cid": "${centerPointId}",
    "message": "Hello!",
    "stream": false
  }'`
})

const pythonCode = computed(() => {
  const authLine = isPrivate.value ? `\n        'Authorization': 'Bearer YOUR_TOKEN',` : ''
  return `import requests

response = requests.post(
    '${baseUrl.value}/api/chat/completion',
    headers={
        'Content-Type': 'application/json',${authLine}
    },
    json={
        'cid': '${centerPointId}',
        'message': 'Hello!',
        'stream': False,
    }
)

data = response.json()
print(data['response'])`
})

const jsCode = computed(() => {
  const authHeader = isPrivate.value ? `\n  'Authorization': 'Bearer YOUR_TOKEN',` : ''
  return `const response = await fetch('${baseUrl.value}/api/chat/completion', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',${authHeader}
  },
  body: JSON.stringify({
    cid: '${centerPointId}',
    message: 'Hello!',
    stream: false,
  }),
});

const data = await response.json();
console.log(data.response);`
})

const tsCode = computed(() => {
  const authHeader = isPrivate.value ? `\n    'Authorization': 'Bearer YOUR_TOKEN',` : ''
  return `interface ChatResponse {
  session_id: string;
  response: string;
  agent_hops: number;
  current_agent: string;
}

const response = await fetch('${baseUrl.value}/api/chat/completion', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',${authHeader}
  },
  body: JSON.stringify({
    cid: '${centerPointId}',
    message: 'Hello!',
    stream: false,
  }),
});

const data: ChatResponse = await response.json();
console.log(data.response);`
})

const goCode = computed(() => {
  const authLine = isPrivate.value ? `\n\treq.Header.Set("Authorization", "Bearer YOUR_TOKEN")` : ''
  return `package main

import (
\t"bytes"
\t"encoding/json"
\t"fmt"
\t"net/http"
)

func main() {
\tpayload := map[string]interface{}{
\t\t"cid": "${centerPointId}",
\t\t"message":         "Hello!",
\t\t"stream":          false,
\t}
\tbody, _ := json.Marshal(payload)

\treq, _ := http.NewRequest(
\t\t"POST",
\t\t"${baseUrl.value}/api/chat/completion",
\t\tbytes.NewReader(body),
\t)
\treq.Header.Set("Content-Type", "application/json")${authLine}

\tclient := &http.Client{}
\tresp, _ := client.Do(req)
\tdefer resp.Body.Close()

\tvar result map[string]interface{}
\tjson.NewDecoder(resp.Body).Decode(&result)
\tfmt.Println(result["response"])
}`
})

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: t('centralPoints.copiedToClipboard'), icon: 'i-lucide-check', color: 'success' })
  } catch {
    toast.add({ title: t('centralPoints.failedCopy'), color: 'error' })
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 pt-4">
    <!-- Back navigation -->
    <div>
      <UButton
        color="neutral"
        icon="i-lucide-arrow-left"
        :label="t('centralPoints.backToCenterPoints')"
        variant="ghost"
        @click="router.push(localePath('/settings/central-points'))"
      />
    </div>

    <!-- Not found -->
    <div v-if="!centerPoint" class="py-12 text-center">
      <UIcon class="mx-auto mb-3 size-10 text-dimmed" name="i-lucide-radio" />
      <p class="text-dimmed">{{ t('centralPoints.notFound') }}</p>
    </div>

    <template v-else>
      <!-- Title -->
      <div>
        <h2 class="text-xl font-semibold">{{ centerPoint.name }}</h2>
        <p class="mt-0.5 text-sm text-dimmed">
          {{ t('centralPoints.editSubtitle') }}
        </p>
      </div>

      <!-- Section 1: Basic Information -->
      <UCard>
        <template #header>
          <p class="font-semibold">{{ t('centralPoints.basicInfo') }}</p>
        </template>

        <UForm :schema="schema" :state="state" class="flex flex-col gap-4" @submit="onSubmit">
          <UFormField :label="t('centralPoints.name')" name="name">
            <UInput v-model="state.name" class="w-full" :placeholder="t('centralPoints.namePlaceholder')" />
          </UFormField>
          <UFormField :label="t('settings.description')" name="description">
            <UTextarea v-model="state.description" class="w-full" :placeholder="t('centralPoints.descriptionPlaceholder')" />
          </UFormField>
          <UFormField :label="t('centralPoints.orchestrator')" name="orchestrator_id">
            <USelect
              v-model="state.orchestrator_id"
              :items="orchestratorOptions"
              class="w-full"
              label-key="label"
              :placeholder="t('centralPoints.selectOrchestrator')"
              value-key="value"
            />
          </UFormField>
          <UFormField :label="t('centralPoints.visibility')" name="visibility">
            <USelect v-model="state.visibility" :items="visibilityItems" class="w-full" label-key="label" value-key="value" />
          </UFormField>
          <div class="flex justify-end">
            <UButton :loading="saving" :label="t('centralPoints.saveChanges')" type="submit" />
          </div>
        </UForm>
      </UCard>

      <!-- Section 2: API Integration -->
      <UCard>
        <template #header>
          <p class="font-semibold">{{ t('centralPoints.apiIntegration') }}</p>
          <p class="mt-0.5 text-sm text-dimmed">
            {{ t('centralPoints.apiIntegrationDescription') }}
          </p>
        </template>

        <div class="flex flex-col gap-6">
          <!-- Central Point ID -->
          <div>
            <p class="mb-1.5 text-sm font-medium">{{ t('centralPoints.centerPointId') }}</p>
            <div class="flex items-center gap-2">
              <code class="flex-1 break-all rounded-md bg-elevated px-3 py-2 font-mono text-sm">
                {{ centerPoint.id }}
              </code>
              <UButton color="neutral" icon="i-lucide-copy" size="sm" variant="outline" @click="copyToClipboard(centerPoint?.id ?? '')" />
            </div>
          </div>

          <!-- Auth notice -->
          <UAlert
            v-if="isPrivate"
            color="warning"
            :description="t('centralPoints.privateAuthDescription')"
            icon="i-lucide-lock"
            :title="t('centralPoints.privateAuthRequired')"
            variant="subtle"
          />
          <UAlert
            v-else
            color="info"
            :description="t('centralPoints.publicNoAuthDescription')"
            icon="i-lucide-globe"
            :title="t('centralPoints.publicNoAuth')"
            variant="subtle"
          />

          <!-- Endpoint -->
          <div>
            <p class="mb-2 text-sm font-medium">{{ t('centralPoints.endpoint') }}</p>
            <div class="flex flex-wrap items-center gap-2">
              <UBadge color="success" size="sm" variant="subtle">POST</UBadge>
              <code class="font-mono text-sm text-dimmed">{{ baseUrl }}/api/chat/completion</code>
            </div>
          </div>

          <!-- Code examples -->
          <div>
            <p class="mb-3 text-sm font-medium">{{ t('centralPoints.codeExamples') }}</p>
            <UTabs :items="langTabs" variant="link">
              <template #curl>
                <div class="relative mt-3">
                  <pre
                    class="overflow-x-auto rounded-lg bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100 dark:bg-neutral-900"
                  ><code>{{ curlCode }}</code></pre>
                  <UButton class="absolute right-2 top-2" color="neutral" icon="i-lucide-copy" size="xs" variant="ghost" @click="copyToClipboard(curlCode)" />
                </div>
              </template>

              <template #python>
                <div class="relative mt-3">
                  <pre
                    class="overflow-x-auto rounded-lg bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100 dark:bg-neutral-900"
                  ><code>{{ pythonCode }}</code></pre>
                  <UButton class="absolute right-2 top-2" color="neutral" icon="i-lucide-copy" size="xs" variant="ghost" @click="copyToClipboard(pythonCode)" />
                </div>
              </template>

              <template #js>
                <div class="relative mt-3">
                  <pre
                    class="overflow-x-auto rounded-lg bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100 dark:bg-neutral-900"
                  ><code>{{ jsCode }}</code></pre>
                  <UButton class="absolute right-2 top-2" color="neutral" icon="i-lucide-copy" size="xs" variant="ghost" @click="copyToClipboard(jsCode)" />
                </div>
              </template>

              <template #ts>
                <div class="relative mt-3">
                  <pre
                    class="overflow-x-auto rounded-lg bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100 dark:bg-neutral-900"
                  ><code>{{ tsCode }}</code></pre>
                  <UButton class="absolute right-2 top-2" color="neutral" icon="i-lucide-copy" size="xs" variant="ghost" @click="copyToClipboard(tsCode)" />
                </div>
              </template>

              <template #go>
                <div class="relative mt-3">
                  <pre
                    class="overflow-x-auto rounded-lg bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100 dark:bg-neutral-900"
                  ><code>{{ goCode }}</code></pre>
                  <UButton class="absolute right-2 top-2" color="neutral" icon="i-lucide-copy" size="xs" variant="ghost" @click="copyToClipboard(goCode)" />
                </div>
              </template>
            </UTabs>
          </div>
        </div>
      </UCard>
    </template>
  </div>
</template>
