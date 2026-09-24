import { api } from './client'

export interface RunCodePayload {
  language: 'python' | 'javascript' | 'go'
  code: string
  stdin?: string
}

export interface ExecutionResult {
  id: string
  language: string
  stdout: string
  stderr: string
  exit_code: number
  execution_time_ms: number
  memory_kb: number
  status: string
  code?: string
  stdin?: string
  created_at?: string
}

export const executeApi = {
  runCode: async (payload: RunCodePayload): Promise<ExecutionResult> => {
    const res = await api.post<{ success: boolean; data: ExecutionResult }>('/api/v1/execute', payload)
    return res.data
  },

  getExecutionHistory: async (limit = 20, offset = 0): Promise<ExecutionResult[]> => {
    const res = await api.get<{ success: boolean; data: ExecutionResult[] }>(
      `/api/v1/execute/history?limit=${limit}&offset=${offset}`
    )
    return res.data || []
  },

  getExecutionDetail: async (id: string): Promise<ExecutionResult> => {
    const res = await api.get<{ success: boolean; data: ExecutionResult }>(`/api/v1/execute/${id}`)
    return res.data
  },
}
