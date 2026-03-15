import type { OrchestratorResponse } from '~/types'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  events?: ChatEvent[]
  suggestions?: string[]
}

interface ChatEvent {
  type: string
  data: unknown
}

export interface AgentStep {
  key: string
  progress: number
  fallback: string
}

export interface ToolResultEvent {
  tool_name: string
  plugin_id: string
  data: unknown
}

const SSE_EVENT_PREFIX = 'event: '
const SSE_DATA_PREFIX = 'data: '
const MESSAGE_EVENT_TYPE = 'message'

interface StreamCallbacks {
  onContent: (chunk: string) => void
  onEvent: (event: ChatEvent) => void
  onSessionId: (id: string) => void
}

function isMessageContentEvent(eventType: string | null, parsed: Record<string, unknown>): boolean {
  return eventType === MESSAGE_EVENT_TYPE || (!eventType && !!parsed.content)
}

async function processSSEStream(reader: ReadableStreamDefaultReader<Uint8Array>, callbacks: StreamCallbacks): Promise<void> {
  const decoder = new TextDecoder()
  let buffer = ''
  let currentEventType: string | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line === '') {
        currentEventType = null
      } else if (line.startsWith(SSE_EVENT_PREFIX)) {
        currentEventType = line.slice(SSE_EVENT_PREFIX.length).trim()
      } else if (line.startsWith(SSE_DATA_PREFIX)) {
        const rawData = line.slice(SSE_DATA_PREFIX.length).trim()
        try {
          const parsed = JSON.parse(rawData) as Record<string, unknown>
          if (isMessageContentEvent(currentEventType, parsed)) {
            callbacks.onContent((parsed.content as string) ?? '')
          } else if (currentEventType && currentEventType !== MESSAGE_EVENT_TYPE) {
            callbacks.onEvent({ type: currentEventType, data: parsed })
          }
          if (parsed.session_id) {
            callbacks.onSessionId(parsed.session_id as string)
          }
        } catch {
          /* ignore parse errors */
        }
      }
    }
  }
}

export function useChat() {
  const auth = useAuth()
  const toast = useToast()
  const { t } = useI18n()

  const orgId = computed(() => auth.currentOrgId.value || '')
  const orchestrators = ref<OrchestratorResponse[]>([])
  const selectedInstanceId = ref<string | null>(null)
  const messages = ref<ChatMessage[]>([])
  const conversationId = ref<string | null>(null)
  const enableStream = ref(true)
  const streaming = ref(false)
  const currentStreamContent = ref('')
  const currentSuggestionContent = ref('')
  const currentEvents = ref<ChatEvent[]>([])
  const currentAgentStep = ref<AgentStep | null>(null)
  const currentToolResults = ref<ToolResultEvent[]>([])

  async function loadOrchestrators(): Promise<void> {
    if (!orgId.value) return
    orchestrators.value = await $fetch<OrchestratorResponse[]>(`/api/orgs/${orgId.value}/orchestrators`)
  }

  function resetStreamState(): void {
    streaming.value = false
    currentStreamContent.value = ''
    currentSuggestionContent.value = ''
    currentEvents.value = []
    currentAgentStep.value = null
    currentToolResults.value = []
  }

  function saveNonStreamingResponse(data: { session_id: string; response: string }): void {
    conversationId.value = data.session_id
    messages.value.push({ role: 'assistant', content: data.response, timestamp: new Date(), events: [] })
  }

  async function sendMessage(message: string): Promise<void> {
    if (!selectedInstanceId.value || !orgId.value) {
      toast.add({ title: t('chat.selectOrchestratorFirst'), color: 'warning' })
      return
    }

    messages.value.push({ role: 'user', content: message, timestamp: new Date() })
    streaming.value = true
    currentStreamContent.value = ''
    currentSuggestionContent.value = ''
    currentEvents.value = []
    currentAgentStep.value = null

    try {
      const response = await fetch('/api/chat/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          'X-ORG-ID': orgId.value,
          'X-INSTANCE-ID': selectedInstanceId.value ?? ''
        },
        body: JSON.stringify({
          message,
          conversation_id: conversationId.value,
          stream: enableStream.value
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      if (!enableStream.value) {
        saveNonStreamingResponse((await response.json()) as { session_id: string; response: string })
        return
      }

      const reader = response.body!.getReader()
      await processSSEStream(reader, {
        onContent: (chunk) => {
          currentStreamContent.value += chunk
        },
        onEvent: (event) => {
          currentEvents.value.push(event)
          if (event.type === 'agent') currentAgentStep.value = event.data as AgentStep
          if (event.type === 'tool') currentToolResults.value.push(event.data as ToolResultEvent)
          if (event.type === 'suggestion') {
            const data = event.data as { content?: string }
            currentSuggestionContent.value += data?.content ?? ''
          }
        },
        onSessionId: (id) => {
          conversationId.value = id
        }
      })

      const suggestions = currentSuggestionContent.value
        .split('\n')
        .map((s) => s.replace(/^[-\d.]+\s*/, '').trim())
        .filter(Boolean)

      messages.value.push({
        role: 'assistant',
        content: currentStreamContent.value,
        timestamp: new Date(),
        events: [...currentEvents.value],
        suggestions: suggestions.length ? suggestions : undefined
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Stream error'
      toast.add({ title: t('chat.chatError'), description: msg, color: 'error' })
    } finally {
      resetStreamState()
    }
  }

  function clearMessages(): void {
    messages.value = []
    conversationId.value = null
  }

  return {
    orchestrators,
    selectedInstanceId,
    messages,
    conversationId,
    enableStream,
    streaming,
    currentStreamContent,
    currentSuggestionContent,
    currentEvents,
    currentAgentStep,
    currentToolResults,
    loadOrchestrators,
    sendMessage,
    clearMessages
  }
}
