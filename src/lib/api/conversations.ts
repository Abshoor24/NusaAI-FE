import { api } from './client'
import { getToken } from './token'

export interface MessageAttachment {
  id: string
  message_id?: string
  file_name: string
  file_type: string
  file_size: number
  mime_type: string
  created_at: string
}

export interface ConversationMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  attachments?: MessageAttachment[]
  created_at: string
}

export interface ConversationSummary {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ConversationDetail {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  messages: ConversationMessage[]
}

export interface ImageAttachmentInput {
  file_name: string
  mime_type: string
  data: string // base64 string
}

export interface SendMessagePayload {
  conversation_id?: string
  message: string
  use_rag?: boolean
  document_id?: string
  system?: string
  images?: ImageAttachmentInput[]
}

export interface SendMessageResponse {
  conversation_id: string
  message: ConversationMessage
  sources?: Array<{
    id: string
    document_id: string
    chunk_index: number
    content: string
    similarity: number
  }>
}

export interface StreamHandlers {
  onToken: (token: string) => void
  onDone: (data: { conversation_id: string; message_id: string }) => void
  onError: (errorMessage: string) => void
}

export const conversationsApi = {
  list: async (): Promise<ConversationSummary[]> => {
    const res = await api.get<{ success: boolean; data: ConversationSummary[] }>('/api/v1/ai/conversations')
    return res.data || []
  },

  get: async (id: string): Promise<ConversationDetail> => {
    const res = await api.get<{ success: boolean; data: ConversationDetail }>(`/api/v1/ai/conversations/${id}`)
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/ai/conversations/${id}`)
  },

  sendNonStream: async (payload: SendMessagePayload): Promise<SendMessageResponse> => {
    const res = await api.post<{ success: boolean; data: SendMessageResponse }>('/api/v1/ai/chat', payload)
    return res.data
  },

  streamMessage: async (
    payload: SendMessagePayload,
    handlers: StreamHandlers,
    signal?: AbortSignal
  ): Promise<void> => {
    const token = getToken()
    const base = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8080'
    const url = `${base}/api/v1/ai/chat/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`

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
              handlers.onDone(parsed)
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

  getAttachmentUrl: (attachmentId: string): string => {
    const base = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8080'
    return `${base}/api/v1/ai/attachments/${attachmentId}`
  },
}
