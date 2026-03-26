<script lang="ts" setup>
import type { AgentStep, ToolResultEvent } from '~/composables/useChat'

const chat = useChat()
const { t } = useI18n()
const inputText = ref('')

onMounted(() => {
  chat.loadAiApps()
  chat.loadConversations()
})

const readyAiApps = computed(() =>
  chat.aiApps.value.filter((o) => o.status === 'active' && o.is_ready && !o.is_deleted)
)

const selectedAiApp = computed(
  () => readyAiApps.value.find((o) => o.instance_id === chat.selectedInstanceId.value) ?? null
)
const isGrounded = computed(() => selectedAiApp.value?.mode === 'grounded')

async function onSend() {
  const msg = inputText.value.trim()
  if (!msg || chat.streaming.value) return
  inputText.value = ''
  await chat.sendMessage(msg)
  await chat.loadConversations()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    onSend()
  }
}

function agentStepsOf(events?: { type: string; data: unknown }[]): AgentStep[] {
  return (events ?? [])
    .filter((e) => e.type === 'agent')
    .map((e) => e.data as AgentStep)
    .filter((s) => s.key !== 'msg.orchestrator.end')
}

function toolResultsOf(events?: { type: string; data: unknown }[]): ToolResultEvent[] {
  return (events ?? []).filter((e) => e.type === 'tool').map((e) => e.data as ToolResultEvent)
}

interface LinkItem {
  title?: string
  url?: string
}

function linkItemsOf(result: ToolResultEvent): LinkItem[] {
  if (!Array.isArray(result.data)) return []
  return (result.data as LinkItem[]).filter((item) => item?.url)
}
</script>

<template>
  <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
    <UDashboardPanel id="chat">
      <template #header>
        <UDashboardNavbar :title="t('chat.title')">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <div class="flex items-center gap-2">
              <InfoPopover title-key="info.pages.chat.title" description-key="info.pages.chat.description" />
            </div>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="flex h-full overflow-hidden">
          <div class="border-default flex w-64 shrink-0 flex-col border-r">
            <div class="border-default border-b p-3">
              <UButton icon="i-lucide-plus" :label="t('chat.newThread')" block @click="chat.newConversation()" />
            </div>
            <div class="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
              <div
                v-for="convo in chat.conversations.value"
                :key="convo.id"
                :class="chat.conversationId.value === convo.id ? 'bg-primary/10 text-primary' : 'hover:bg-elevated/50'"
                class="cursor-pointer rounded-lg p-2.5 transition-colors"
                @click="chat.selectConversation(convo.id)"
              >
                <p class="truncate text-sm font-medium">{{ convo.title || t('chat.untitledThread') }}</p>
                <p class="text-dimmed mt-0.5 text-xs">{{ formatDate(convo.created_at) }}</p>
              </div>
              <p v-if="chat.conversations.value.length === 0" class="text-dimmed py-6 text-center text-xs">
                {{ t('chat.noThreadsYet') }}
              </p>
            </div>
          </div>

          <div class="flex flex-1 flex-col overflow-hidden">
            <div class="border-default flex shrink-0 items-center gap-3 border-b p-3">
              <USelect
                v-model="chat.selectedInstanceId.value"
                :items="readyAiApps.map((o) => ({ label: o.name, value: o.instance_id }))"
                :placeholder="t('chat.selectAiApp')"
                class="w-64"
                variant="soft"
                :ui="{
                  base: [
                    'relative group rounded-md inline-flex items-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-100 shadow-xs',
                    'transition-colors'
                  ]
                }"
              />
              <UInput
                v-if="isGrounded"
                v-model="chat.resourceId.value"
                :placeholder="t('chat.resourceIdPlaceholder')"
                class="flex-1"
                icon="i-lucide-link"
                clearable
                variant="soft"
              />
            </div>
            <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              <div
                v-for="(msg, idx) in chat.messages.value"
                :key="idx"
                :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
                class="flex"
              >
                <div class="flex max-w-[70%] flex-col">
                  <div
                    :class="msg.role === 'user' ? 'bg-primary text-white' : 'bg-elevated'"
                    class="rounded-2xl px-4 py-2.5"
                  >
                    <MDC
                      v-if="msg.role === 'assistant'"
                      :value="msg.content"
                      class="prose prose-sm dark:prose-invert max-w-none [&_*]:text-sm"
                      tag="article"
                    />
                    <p v-else class="text-sm">{{ msg.content }}</p>

                    <details
                      v-if="
                        msg.role === 'assistant' &&
                        (agentStepsOf(msg.events).length || toolResultsOf(msg.events).length)
                      "
                      class="border-default/40 mt-2 border-t pt-2"
                    >
                      <summary class="text-dimmed cursor-pointer text-xs select-none">
                        <span v-if="agentStepsOf(msg.events).length"
                          >{{ agentStepsOf(msg.events).length }} {{ t('chat.steps') }}</span
                        >
                        <span v-if="agentStepsOf(msg.events).length && toolResultsOf(msg.events).length"> · </span>
                        <span v-if="toolResultsOf(msg.events).length"
                          >{{ toolResultsOf(msg.events).length }} {{ t('chat.sources') }}</span
                        >
                      </summary>
                      <div class="mt-1.5 flex flex-col gap-1">
                        <div
                          v-for="step in agentStepsOf(msg.events)"
                          :key="step.key"
                          class="text-dimmed flex items-center gap-1.5 text-xs"
                        >
                          <UIcon class="text-success-400 size-3 shrink-0" name="i-lucide-check" />
                          <span>{{ step.fallback }}</span>
                        </div>
                      </div>
                      <div v-if="toolResultsOf(msg.events).length" class="mt-1.5 flex flex-col gap-1">
                        <p v-if="agentStepsOf(msg.events).length" class="bg-default/40 my-1 h-px" />
                        <p class="text-dimmed text-xs font-medium">{{ t('chat.sources') }}</p>
                        <template v-for="result in toolResultsOf(msg.events)">
                          <a
                            v-for="(item, i) in linkItemsOf(result)"
                            :key="`${result.tool_name}-${i}`"
                            :href="item.url"
                            class="text-primary truncate text-xs hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                            >{{ item?.title || item?.url }}</a
                          >
                        </template>
                      </div>
                    </details>
                  </div>
                  <div v-if="msg.role === 'assistant' && msg.suggestions?.length" class="mt-2 flex flex-wrap gap-2">
                    <UButton
                      v-for="(suggestion, si) in msg.suggestions"
                      :key="si"
                      size="xs"
                      color="neutral"
                      :label="suggestion"
                      @click="inputText = suggestion"
                    />
                  </div>
                </div>
              </div>

              <div v-if="chat.streaming.value" class="flex justify-start">
                <div class="bg-elevated flex max-w-[70%] min-w-48 flex-col gap-2 rounded-2xl px-4 py-3">
                  <!-- tool results arrive before synthesizer; show source links immediately -->
                  <div v-if="chat.currentToolResults.value.length" class="flex flex-col gap-1.5">
                    <p class="text-dimmed text-xs font-medium">{{ t('chat.sources') }}</p>
                    <template v-for="result in chat.currentToolResults.value">
                      <a
                        v-for="(item, i) in linkItemsOf(result)"
                        :key="`${result.tool_name}-${i}`"
                        :href="item.url"
                        class="text-primary truncate text-xs hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                        >{{ item.title || item.url }}</a
                      >
                    </template>
                    <div class="bg-default/40 mt-0.5 h-px" />
                  </div>

                  <MDC
                    v-if="chat.currentStreamContent.value"
                    :value="chat.currentStreamContent.value"
                    class="prose prose-sm dark:prose-invert max-w-none [&_*]:text-sm"
                    tag="article"
                  />

                  <template v-if="chat.currentAgentStep.value">
                    <div class="text-dimmed flex items-center gap-1.5 text-xs">
                      <UIcon class="size-3 shrink-0 animate-spin" name="i-lucide-loader" />
                      <span>{{ chat.currentAgentStep.value.fallback }}</span>
                    </div>
                  </template>

                  <div v-else class="flex items-center gap-1">
                    <span class="bg-primary size-2 animate-bounce rounded-full [animation-delay:0ms]" />
                    <span class="bg-primary size-2 animate-bounce rounded-full [animation-delay:150ms]" />
                    <span class="bg-primary size-2 animate-bounce rounded-full [animation-delay:300ms]" />
                  </div>
                </div>
              </div>

              <div
                v-if="chat.messages.value.length === 0 && !chat.streaming.value"
                class="flex flex-1 items-center justify-center"
              >
                <div class="text-dimmed text-center">
                  <UIcon class="mx-auto mb-3 size-12 opacity-30" name="i-lucide-message-square" />
                  <p>{{ t('chat.selectAndStart') }}</p>
                </div>
              </div>
            </div>

            <div class="border-default border-t p-4">
              <div class="flex gap-2">
                <UTextarea
                  v-model="inputText"
                  :disabled="chat.streaming.value"
                  :rows="2"
                  autoresize
                  class="flex-1"
                  :placeholder="t('chat.typeMessage')"
                  @keydown="onKeydown"
                />
                <UButton
                  :disabled="!inputText.trim() || !chat.selectedInstanceId.value"
                  :loading="chat.streaming.value"
                  icon="i-lucide-send"
                  :label="t('common.send')"
                  @click="onSend"
                />
              </div>
              <div class="mt-2 flex items-center gap-3">
                <div class="flex items-center gap-2">
                  <USwitch v-model="chat.enableStream.value" size="sm" />
                  <span class="text-sm">{{ t('chat.stream') }}</span>
                </div>
                <p class="text-dimmed text-xs">{{ t('chat.enterToSend') }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
