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

export type GenerateSolutionRequest = {
  business_type: string
  business_problem: string
  business_goal: string
}

export type GeneratedSolution = {
  solution_name: string
  summary: string
  recommended_features: string[]
  recommended_technology: string[]
  complexity: string
}

export type GenerateSolutionResponse = {
  solution: GeneratedSolution
  model?: string
}

export const aiApi = {
  chat: (payload: AiChatRequest): Promise<AiChatResponse> =>
    api.post<AiChatResponse>('/api/v1/ai/chat', payload),

  generateSolution: (payload: GenerateSolutionRequest): Promise<GenerateSolutionResponse> =>
    api.post<GenerateSolutionResponse>('/api/v1/ai/generate-solution', payload),
}