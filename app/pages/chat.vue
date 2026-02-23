<script setup lang="ts">
const chat = useChat()
const inputText = ref('')

onMounted(() => chat.loadOrchestrators())

const hotOrchestrators = computed(() =>
  chat.orchestrators.value.filter((o) => o.tier === 'hot' && o.status === 'active')
)

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
</script>

<template>
  <UDashboardPanel id="chat">
    <template #header>
      <UDashboardNavbar title="Chat">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-trash-2"
            variant="ghost"
            size="sm"
            label="Clear"
            @click="chat.clearMessages()"
          />
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
                v-for="orch in hotOrchestrators"
                :key="orch.instance_id"
                class="p-2 rounded border cursor-pointer hover:bg-elevated/50 transition-colors"
                :class="
                  chat.selectedInstanceId.value === orch.instance_id
                    ? 'border-primary bg-primary/5'
                    : 'border-default'
                "
                @click="chat.selectedInstanceId.value = orch.instance_id"
              >
                <p class="text-sm font-medium">
                  {{ orch.name }}
                </p>
                <p class="text-xs text-dimmed">{{ orch.framework_type }} · {{ orch.mode }}</p>
              </div>
              <p v-if="hotOrchestrators.length === 0" class="text-dimmed text-xs text-center py-4">
                No hot orchestrators available.<br />
                Load one from the Orchestrators page.
              </p>
            </div>
          </div>

          <div v-if="chat.conversationId.value" class="mt-auto">
            <p class="text-xs text-dimmed">Session ID</p>
            <p class="text-xs font-mono truncate">
              {{ chat.conversationId.value }}
            </p>
          </div>
        </div>

        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <div
              v-for="(msg, idx) in chat.messages.value"
              :key="idx"
              class="flex"
              :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[70%] rounded-2xl px-4 py-2"
                :class="msg.role === 'user' ? 'bg-primary text-white' : 'bg-elevated'"
              >
                <p class="whitespace-pre-wrap text-sm">
                  {{ msg.content }}
                </p>

                <details v-if="msg.role === 'assistant' && msg.events?.length" class="mt-2">
                  <summary class="text-xs text-dimmed cursor-pointer">
                    {{ msg.events.length }} events
                  </summary>
                  <div class="mt-1 flex flex-col gap-1">
                    <div
                      v-for="(ev, eidx) in msg.events"
                      :key="eidx"
                      class="text-xs text-dimmed font-mono"
                    >
                      {{ ev.type }}: {{ JSON.stringify(ev.data) }}
                    </div>
                  </div>
                </details>
              </div>
            </div>

            <div v-if="chat.streaming.value" class="flex justify-start">
              <div class="max-w-[70%] rounded-2xl px-4 py-2 bg-elevated">
                <p v-if="chat.currentStreamContent.value" class="whitespace-pre-wrap text-sm">
                  {{ chat.currentStreamContent.value }}
                </p>
                <div v-else class="flex items-center gap-1">
                  <span
                    class="size-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]"
                  />
                  <span
                    class="size-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]"
                  />
                  <span
                    class="size-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]"
                  />
                </div>
              </div>
            </div>

            <div
              v-if="chat.messages.value.length === 0 && !chat.streaming.value"
              class="flex-1 flex items-center justify-center"
            >
              <div class="text-center text-dimmed">
                <UIcon name="i-lucide-message-square" class="size-12 mx-auto mb-3 opacity-30" />
                <p>Select an orchestrator and start chatting</p>
              </div>
            </div>
          </div>

          <div class="border-t border-default p-4">
            <div class="flex gap-2">
              <UTextarea
                v-model="inputText"
                placeholder="Type a message..."
                :rows="2"
                autoresize
                class="flex-1"
                @keydown="onKeydown"
              />
              <UButton
                icon="i-lucide-send"
                :loading="chat.streaming.value"
                :disabled="!inputText.trim() || !chat.selectedInstanceId.value"
                @click="onSend"
              />
            </div>
            <p class="text-xs text-dimmed mt-1">Enter to send, Shift+Enter for newline</p>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
