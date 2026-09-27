import { api } from './client'
import type {
  ApiResponse,
  ExecuteRequest,
  ExecuteResponseData,
  CodeExecution,
  ExecuteLanguage,
} from '@/types/api'

export type { ExecuteRequest, ExecuteResponseData, CodeExecution, ExecuteLanguage }

export const executeApi = {
  /**
   * POST /api/v1/execute
   *
   * Executes source code in Judge0 sandbox.
   * Body: { language: "python" | "javascript" | "go", code: string, stdin?: string }
   * Response: { success, message, data: ExecuteResponseData }
   */
  runCode: async (payload: ExecuteRequest): Promise<ExecuteResponseData> => {
    const res = await api.post<ApiResponse<ExecuteResponseData>>('/execute', payload)
    return res.data
  },

  /**
   * GET /api/v1/execute/history?limit=20&offset=0
   *
   * Retrieves user's code execution history.
   * Query params: limit (default 20, max 100), offset (default 0)
   * Response: { success, message, data: CodeExecution[] }
   */
  getExecutionHistory: async (limit = 20, offset = 0): Promise<CodeExecution[]> => {
    const safeLimit = Math.max(1, Math.min(100, limit))
    const safeOffset = Math.max(0, offset)
    const res = await api.get<ApiResponse<CodeExecution[]>>(
      `/execute/history?limit=${safeLimit}&offset=${safeOffset}`
    )
    return res.data || []
  },

  /**
   * GET /api/v1/execute/{id}
   *
   * Retrieves detail of a single execution record.
   * Response: { success, message, data: CodeExecution }
   */
  getExecutionDetail: async (id: string): Promise<CodeExecution> => {
    const res = await api.get<ApiResponse<CodeExecution>>(`/execute/${id}`)
    return res.data
  },
}
