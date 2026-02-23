<script lang="ts" setup>
import type { AgentStep } from '~/composables/useChat'

const chat = useChat()
const inputText = ref('')

onMounted(() => chat.loadOrchestrators())

const allOrchestrators = computed(() => chat.orchestrators.value.filter((o) => o.status === 'active'))

function isDisabled(o: { tier: string; is_ready: boolean }) {
  return o.tier !== 'hot' || !o.is_ready
}

async function onSend() {
  const msg = inputText.value.trim()
  if (!msg || chat.streaming.value) return
  inputText.value = ''
  await chat.sendMessage(msg)
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
</script>

<template>
  <UDashboardPanel id="chat">
    <template #header>
      <UDashboardNavbar title="Chat">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-trash-2" label="Clear" size="sm" variant="ghost" @click="chat.clearMessages()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex h-full overflow-hidden">
        <div class="w-64 border-r border-default flex flex-col p-4 gap-4 shrink-0">
          <div>
            <p class="text-sm font-medium mb-2">Select Orchestrator</p>
            <div class="flex flex-col gap-2">
              <div
                v-for="orch in allOrchestrators"
                :key="orch.instance_id"
                :class="[
                  isDisabled(orch)
                    ? 'opacity-50 cursor-not-allowed pointer-events-none border-default'
                    : chat.selectedInstanceId.value === orch.instance_id
                      ? 'border-primary bg-primary/5 cursor-pointer'
                      : 'border-default cursor-pointer hover:bg-elevated/50'
                ]"
                class="p-2 rounded border transition-colors"
                @click="!isDisabled(orch) && (chat.selectedInstanceId.value = orch.instance_id)"
              >
                <div class="flex items-center gap-1.5">
                  <UIcon v-if="!isDisabled(orch)" class="size-3 text-success shrink-0" name="i-lucide-circle-check" />
                  <UIcon v-else class="size-3 text-muted shrink-0" name="i-lucide-circle" />
                  <p class="text-sm font-medium truncate">{{ orch.name }}</p>
                </div>
                <p class="text-xs text-dimmed mt-0.5">{{ orch.framework_type }} · {{ orch.mode }}</p>
              </div>
              <p v-if="allOrchestrators.length === 0" class="text-dimmed text-xs text-center py-4">
                No active orchestrators available.<br />
                Create one from the Orchestrators page.
              </p>
            </div>
          </div>

          <div v-if="chat.conversationId.value" class="mt-auto">
            <p class="text-xs text-dimmed">Session ID</p>
            <p class="text-xs font-mono truncate">{{ chat.conversationId.value }}</p>
          </div>
        </div>

        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <div v-for="(msg, idx) in chat.messages.value" :key="idx" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'" class="flex">
              <div :class="msg.role === 'user' ? 'bg-primary text-white' : 'bg-elevated'" class="max-w-[70%] rounded-2xl px-4 py-2">
                <MDC v-if="msg.role === 'assistant'" :value="msg.content" class="prose prose-sm dark:prose-invert max-w-none [&_*]:text-sm" tag="article" />
                <p v-else class="text-sm">{{ msg.content }}</p>

                <details v-if="msg.role === 'assistant' && agentStepsOf(msg.events).length" class="mt-2 pt-2 border-t border-default/40">
                  <summary class="text-xs text-dimmed cursor-pointer select-none">
                    {{ agentStepsOf(msg.events).length }}
                    steps
                  </summary>
                  <div class="mt-1.5 flex flex-col gap-1">
                    <div v-for="step in agentStepsOf(msg.events)" :key="step.key" class="flex items-center gap-1.5 text-xs text-dimmed">
                      <UIcon class="size-3 shrink-0 text-success-400" name="i-lucide-check" />
                      <span>{{ step.fallback }}</span>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            <div v-if="chat.streaming.value" class="flex justify-start">
              <div class="max-w-[70%] min-w-48 rounded-2xl px-4 py-3 bg-elevated flex flex-col gap-2">
                <MDC
                  v-if="chat.currentStreamContent.value"
                  :value="chat.currentStreamContent.value"
                  class="prose prose-sm dark:prose-invert max-w-none [&_*]:text-sm"
                  tag="article"
                />

                <template v-if="chat.currentAgentStep.value">
                  <div class="flex items-center gap-1.5 text-xs text-dimmed">
                    <UIcon class="size-3 shrink-0 animate-spin" name="i-lucide-loader" />
                    <span>{{ chat.currentAgentStep.value.fallback }}</span>
                    <span class="ml-auto tabular-nums"> {{ chat.currentAgentStep.value.progress }}% </span>
                  </div>
                  <div class="h-0.5 rounded-full bg-default overflow-hidden">
                    <div
                      :style="{ width: `${Math.max(chat.currentAgentStep.value.progress, 4)}%` }"
                      class="h-full bg-primary rounded-full transition-[width] duration-500 ease-out"
                    />
                  </div>
                </template>

                <div v-else class="flex items-center gap-1">
                  <span class="size-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                  <span class="size-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                  <span class="size-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>

            <div v-if="chat.messages.value.length === 0 && !chat.streaming.value" class="flex-1 flex items-center justify-center">
              <div class="text-center text-dimmed">
                <UIcon class="size-12 mx-auto mb-3 opacity-30" name="i-lucide-message-square" />
                <p>Select an orchestrator and start chatting</p>
              </div>
            </div>
          </div>

          <div class="border-t border-default p-4">
            <div class="flex gap-2">
              <UTextarea
                v-model="inputText"
                :disabled="chat.streaming.value"
                :rows="2"
                autoresize
                class="flex-1"
                placeholder="Type a message..."
                @keydown="onKeydown"
              />
              <UButton
                :disabled="!inputText.trim() || !chat.selectedInstanceId.value"
                :loading="chat.streaming.value"
                icon="i-lucide-send"
                label="Send"
                @click="onSend"
              />
            </div>
            <div class="flex items-center gap-3 mt-2">
              <UCheckbox v-model="chat.enableStream.value" label="Stream" size="sm" />
              <p class="text-xs text-dimmed">Enter to send · Shift+Enter for newline</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
