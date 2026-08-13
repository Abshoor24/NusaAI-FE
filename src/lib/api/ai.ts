import { api } from './client'

export type AiChatRole = 'user' | 'assistant'

export type AiChatMessage = {
  role: AiChatRole
  content: string
}

export type AiChatRequest = {
  messages: AiChatMessage[]
}

export type AiChatResponse = {
  reply: string
}

export const aiApi = {
  chat: (payload: AiChatRequest): Promise<AiChatResponse> =>
    api.post<AiChatResponse>('/api/v1/ai/chat', payload),
}