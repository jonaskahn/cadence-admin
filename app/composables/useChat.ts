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

function errorPayloadForShowError(
  status: number,
  body: Record<string, unknown> | null,
  fallbackMessage: string
): { statusCode: number; data: Record<string, unknown> } {
  if (body && typeof body.code === 'string' && typeof body.message === 'string') {
    return {
      statusCode: status,
      data: {
        statusCode: typeof body.statusCode === 'number' ? body.statusCode : status,
        code: body.code,
        message: body.message,
        request_id: typeof body.request_id === 'string' ? body.request_id : '',
        ...(typeof body.field === 'string' ? { field: body.field } : {}),
        ...(body.details !== undefined && body.details !== null && typeof body.details === 'object'
          ? { details: body.details }
          : {})
      }
    }
  }
  const msg = body && typeof body.message === 'string' ? body.message : fallbackMessage.slice(0, 2000)
  return {
    statusCode: status,
    data: {
      statusCode: status,
      code: 'SY-9000',
      message: msg,
      request_id: typeof body?.request_id === 'string' ? body.request_id : ''
    }
  }
}

export function useChat() {
  const auth = useAuth()
  const toast = useToast()
  const { t, locale } = useI18n()
  const { showError } = useApiErrorToast()

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

    let streamHadError = false

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
        const text = await response.text()
        let parsed: Record<string, unknown> | null = null
        try {
          const j = JSON.parse(text) as unknown
          if (j && typeof j === 'object' && !Array.isArray(j)) {
            parsed = j as Record<string, unknown>
          }
        } catch {
          void 0
        }
        showError(
          errorPayloadForShowError(response.status, parsed, text || t('chat.chatError')),
          t('chat.chatError'),
          t('chat.chatError')
        )
        return
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
          if (event.type === 'error') {
            streamHadError = true
            const d = event.data as Record<string, unknown>
            const payload: Record<string, unknown> = {
              code: typeof d.code === 'string' ? d.code : 'SY-9000',
              message: typeof d.message === 'string' ? d.message : t('chat.chatError')
            }
            if (typeof d.field === 'string') payload.field = d.field
            if (d.details !== undefined && d.details !== null && typeof d.details === 'object') {
              payload.details = d.details
            }
            showError(
              errorPayloadForShowError(422, payload, t('chat.chatError')),
              t('chat.chatError'),
              typeof d.message === 'string' ? d.message : t('chat.chatError')
            )
            return
          }
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

      if (streamHadError) {
        return
      }

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
      showError(err, t('chat.chatError'), t('chat.chatError'))
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
