import { api } from './client'
import { getToken } from './token'
import type {
  ApiResponse,
  Conversation,
  ConversationDetail,
  ChatRequest,
  ChatResponseData,
  MessageAttachment,
  Message,
  ImagePayload,
} from '@/types/api'

export type {
  Conversation,
  ConversationDetail,
  ChatRequest,
  ChatResponseData,
  MessageAttachment,
  Message,
  ImagePayload,
}

export interface StreamHandlers {
  onToken: (token: string) => void
  onDone: (data: { conversation_id: string; message_id: string }) => void
  onError: (errorMessage: string) => void
}

const getBaseUrl = (): string => {
  return import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8080/api/v1'
}

export const conversationsApi = {
  /**
   * GET /api/v1/ai/conversations
   * Returns array of user's conversation threads, sorted by updated_at DESC.
   */
  list: async (): Promise<Conversation[]> => {
    const res = await api.get<ApiResponse<Conversation[]>>('/ai/conversations')
    return res.data || []
  },

  /**
   * GET /api/v1/ai/conversations/{id}
   * Returns conversation detail with full message history and attachments.
   */
  get: async (id: string): Promise<ConversationDetail> => {
    const res = await api.get<ApiResponse<ConversationDetail>>(`/ai/conversations/${id}`)
    return res.data
  },

  /**
   * DELETE /api/v1/ai/conversations/{id}
   * Deletes a conversation thread and its associated messages and attachments.
   */
  delete: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/ai/conversations/${id}`)
  },

  /**
   * POST /api/v1/ai/chat (Synchronous non-streaming)
   * Sends a message and receives the complete assistant response at once.
   */
  sendNonStream: async (payload: ChatRequest): Promise<ChatResponseData> => {
    const res = await api.post<ApiResponse<ChatResponseData>>('/ai/chat', payload)
    return res.data
  },

  /**
   * POST /api/v1/ai/chat/stream (SSE Streaming)
   * Streams response token-by-token using Server-Sent Events.
   *
   * Backend SSE specification:
   * - event: token -> data: {"token":"..."}
   * - event: done  -> data: {"conversation_id":"...", "message_id":"..."}
   * - event: error -> data: {"error":"..."}
   */
  streamMessage: async (
    payload: ChatRequest,
    handlers: StreamHandlers,
    signal?: AbortSignal
  ): Promise<void> => {
    const token = getToken()
    const baseUrl = getBaseUrl()
    
    // Per backend docs: SSE accepts token via header OR ?token= query parameter
    const url = `${baseUrl}/ai/chat/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal,
    })

    // Handle HTTP errors before streaming starts (401, 404, 429, 502, etc.)
    if (!response.ok) {
      let errMsg = `Streaming failed with HTTP ${response.status}`
      try {
        const errJson = await response.json()
        errMsg = errJson.error?.message || errMsg
      } catch {
        // Body was not JSON
      }
      throw new Error(errMsg)
    }

    if (!response.body) {
      throw new Error('Response stream body is empty')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const eventBlock of events) {
          if (!eventBlock.trim()) continue
          const lines = eventBlock.split('\n')
          let eventType = ''
          let eventData = ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim()
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6).trim()
            }
          }

          if (eventType === 'token' && eventData) {
            try {
              const parsed = JSON.parse(eventData)
              if (typeof parsed.token === 'string') {
                handlers.onToken(parsed.token)
              }
            } catch {
              // ignore parse errors on fragmented tokens
            }
          } else if (eventType === 'done' && eventData) {
            try {
              const parsed = JSON.parse(eventData)
              handlers.onDone({
                conversation_id: parsed.conversation_id || '',
                message_id: parsed.message_id || '',
              })
            } catch {
              handlers.onDone({ conversation_id: '', message_id: '' })
            }
          } else if (eventType === 'error' && eventData) {
            try {
              const parsed = JSON.parse(eventData)
              handlers.onError(parsed.error || 'Streaming error from AI provider')
            } catch {
              handlers.onError(eventData)
            }
          }
        }
      }
    } catch (err: unknown) {
      if (signal?.aborted) return
      throw err
    }
  },

  /**
   * GET /api/v1/ai/attachments/{id}
   * Generates the URL to fetch a binary attachment image.
   */
  getAttachmentUrl: (attachmentId: string): string => {
    const baseUrl = getBaseUrl()
    return `${baseUrl}/ai/attachments/${attachmentId}`
  },
}
