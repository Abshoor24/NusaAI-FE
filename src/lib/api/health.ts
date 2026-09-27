import { api } from './client'
import type { ApiResponse, HealthData, HealthDbData, AiHealthData } from '@/types/api'

export type { HealthData, HealthDbData, AiHealthData }

export const healthApi = {
  /**
   * GET /health
   * Liveness check. Returns { status: "ok" }
   */
  getHealth: async (): Promise<HealthData> => {
    const res = await api.get<ApiResponse<HealthData>>('/health')
    return res.data
  },

  /**
   * GET /health/db
   * Readiness check for PostgreSQL database. Returns { status: "ok", database: "connected" }
   */
  getDbHealth: async (): Promise<HealthDbData> => {
    const res = await api.get<ApiResponse<HealthDbData>>('/health/db')
    return res.data
  },

  /**
   * GET /api/v1/ai/health
   * Health check for AI provider configuration. Returns provider, configured, and checks object.
   */
  getAiHealth: async (): Promise<AiHealthData> => {
    const res = await api.get<ApiResponse<AiHealthData>>('/ai/health')
    return res.data
  },
}