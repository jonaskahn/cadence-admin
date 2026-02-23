<script lang="ts" setup>
import type { GraphDefinitionResponse } from '~/types'

// Mermaid requires an id without hyphens because it uses the id as a prefix
// for generated SVG child element ids.

const props = defineProps<{
  instanceId: string
  orgId: string
}>()

const orchestrators = useOrchestrators()
const graphData = ref<GraphDefinitionResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const graphContainer = ref<HTMLDivElement | null>(null)

async function renderMermaid(definition: string) {
  if (!graphContainer.value) return
  try {
    const { default: mermaid } = await import('mermaid')
    mermaid.initialize({ startOnLoad: false, theme: 'neutral' })
    const mermaidCompatibleId = `mg${props.instanceId.replace(/-/g, '')}`
    const { svg } = await mermaid.render(mermaidCompatibleId, definition)
    graphContainer.value.innerHTML = svg
  } catch {
    error.value = 'Failed to render graph diagram'
  }
}

async function renderGraphIfReady() {
  if (!graphData.value?.is_ready || !graphData.value.mermaid) return
  await nextTick()
  await renderMermaid(graphData.value.mermaid)
}

async function loadGraph() {
  loading.value = true
  error.value = null
  try {
    graphData.value = await orchestrators.fetchGraph(props.instanceId)
  } catch {
    error.value = 'Failed to load graph'
  } finally {
    loading.value = false
  }
  await renderGraphIfReady()
}

onMounted(loadGraph)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="loading" class="flex items-center justify-center p-12">
      <UIcon class="size-8 animate-spin" name="i-lucide-loader" />
    </div>

    <template v-else-if="graphData">
      <div v-if="!graphData.is_ready" class="flex flex-col items-center gap-3 p-12 text-center">
        <UIcon class="size-10 text-neutral-400" name="i-lucide-circle-off" />
        <p class="text-dimmed text-sm">Orchestrator is not loaded. Use the <strong>Load</strong> button to initialize it, then refresh.</p>
        <UButton icon="i-lucide-refresh-cw" label="Refresh" size="sm" variant="outline" @click="loadGraph" />
      </div>

      <template v-else>
        <div v-if="error" class="flex flex-col items-center gap-3 p-12 text-center">
          <UIcon class="size-10 text-warning-400" name="i-lucide-triangle-alert" />
          <p class="text-dimmed text-sm">{{ error }}</p>
          <UButton icon="i-lucide-refresh-cw" label="Retry" size="sm" variant="outline" @click="loadGraph" />
        </div>

        <div v-else-if="graphData.mermaid" class="overflow-auto rounded-lg border p-4">
          <div ref="graphContainer" class="flex justify-center" />
        </div>

        <div v-else class="flex flex-col items-center gap-3 p-12 text-center">
          <UIcon class="size-10 text-neutral-400" name="i-lucide-share-2" />
          <p class="text-dimmed text-sm">Graph visualization is not available for this orchestrator.</p>
        </div>
      </template>
    </template>

    <div v-else-if="error" class="flex flex-col items-center gap-3 p-12 text-center">
      <UIcon class="size-10 text-warning-400" name="i-lucide-triangle-alert" />
      <p class="text-dimmed text-sm">{{ error }}</p>
      <UButton icon="i-lucide-refresh-cw" label="Retry" size="sm" variant="outline" @click="loadGraph" />
    </div>
  </div>
</template>
