export interface SseChatEvent {
  type: string
  data: unknown
}

const SSE_EVENT_PREFIX = 'event: '
const SSE_DATA_PREFIX = 'data: '
const MESSAGE_EVENT_TYPE = 'message'

interface StreamCallbacks {
  onContent: (chunk: string) => void
  onEvent: (event: SseChatEvent) => void
  onSessionId: (id: string) => void
}

function isMessageContentEvent(eventType: string | null, parsed: Record<string, unknown>): boolean {
  return eventType === MESSAGE_EVENT_TYPE || (!eventType && !!parsed.content)
}

export async function processChatSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  callbacks: StreamCallbacks
): Promise<void> {
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
          continue
        }
      }
    }
  }
}
