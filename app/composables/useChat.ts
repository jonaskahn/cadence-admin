import type {
  ChatConversationMessageResponse,
  ChatStartersResponse,
  ConversationSummary,
  OrchestratorResponse
} from '~/types'
import { processChatSseStream, type SseChatEvent } from '~/utils/sse'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  /** Provenance when loaded from the API (`human` turns vs compact summaries). */
  source?: 'human' | 'compact'
  events?: SseChatEvent[]
  suggestions?: string[]
}

export interface AgentStep {
  key: string
  fallback: string
}

export interface ToolResultEvent {
  tool_name: string
  plugin_id: string
  data: unknown
}

export function useChat() {
  const auth = useAuth()
  const toast = useToast()
  const { t, locale } = useI18n()

  const orgId = computed(() => auth.currentOrgId.value || '')
  const aiApps = ref<OrchestratorResponse[]>([])
  const conversations = ref<ConversationSummary[]>([])
  const selectedInstanceId = ref<string | undefined>(undefined)
  const messages = ref<ChatMessage[]>([])
  const conversationId = ref<string | null>(null)
  const resourceId = ref<string>('')
  const enableStream = ref(true)
  const streaming = ref(false)
  const currentStreamContent = ref('')
  const currentSuggestionContent = ref('')
  const currentEvents = ref<SseChatEvent[]>([])
  const currentAgentStep = ref<AgentStep | null>(null)
  const currentToolResults = ref<ToolResultEvent[]>([])
  const conversationStarters = ref<string[]>([])
  const startersLoading = ref(false)

  async function loadConversationStarters(): Promise<void> {
    if (!orgId.value || !selectedInstanceId.value || conversationId.value !== null) {
      conversationStarters.value = []
      return
    }
    startersLoading.value = true
    try {
      const res = await $fetch<ChatStartersResponse>('/api/chat/starters', {
        headers: {
          'X-ORG-ID': orgId.value,
          'X-INSTANCE-ID': selectedInstanceId.value,
          'Accept-Language': `${locale.value},en;q=0.5`
        }
      })
      conversationStarters.value = res.questions ?? []
    } catch (err: unknown) {
      conversationStarters.value = []
      const msg = err instanceof Error ? err.message : String(err)
      toast.add({ title: t('chat.startersLoadFailed'), description: msg, color: 'error' })
    } finally {
      startersLoading.value = false
    }
  }

  watch(
    () => [orgId.value, selectedInstanceId.value, conversationId.value] as const,
    async () => {
      conversationStarters.value = []
      const org = orgId.value
      const inst = selectedInstanceId.value
      const conv = conversationId.value
      if (!org || !inst || conv !== null) return
      await loadConversationStarters()
    },
    { immediate: true }
  )

  async function loadAiApps(): Promise<void> {
    if (!orgId.value) return
    try {
      aiApps.value = await $fetch<OrchestratorResponse[]>(`/api/orgs/${orgId.value}/orchestrators`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.add({ title: t('chat.refreshAiAppsFailed'), description: msg, color: 'error' })
    }
  }

  async function loadConversations(): Promise<void> {
    if (!orgId.value) return
    try {
      const result = await $fetch<ConversationSummary[]>('/api/chat/conversations', {
        headers: { 'X-ORG-ID': orgId.value }
      })
      conversations.value = result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } catch {
      return
    }
  }

  async function selectConversation(id: string): Promise<void> {
    messages.value = []
    conversationId.value = id
    const convo = conversations.value.find((c) => c.id === id)
    if (convo?.instance_id) {
      selectedInstanceId.value = convo.instance_id
    }
    try {
      const history = await $fetch<ChatConversationMessageResponse[]>(`/api/chat/conversations/${id}/messages`, {
        headers: { 'X-ORG-ID': orgId.value }
      })
      messages.value = history.map((m) => ({
        role: m.role,
        content: m.content,
        source: m.source,
        timestamp: new Date(),
        events: []
      }))
    } catch {
      return
    }
  }

  function newConversation(): void {
    messages.value = []
    conversationId.value = null
    resourceId.value = ''
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
      toast.add({ title: t('chat.selectAiAppFirst'), color: 'warning' })
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
          stream: enableStream.value,
          resource_id: resourceId.value || undefined
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
      await processChatSseStream(reader, {
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

  return {
    aiApps,
    conversations,
    selectedInstanceId,
    messages,
    conversationId,
    resourceId,
    enableStream,
    streaming,
    currentStreamContent,
    currentSuggestionContent,
    currentEvents,
    currentAgentStep,
    currentToolResults,
    conversationStarters,
    startersLoading,
    loadAiApps,
    loadConversations,
    loadConversationStarters,
    selectConversation,
    newConversation,
    sendMessage,
    clearMessages: newConversation
  }
}
