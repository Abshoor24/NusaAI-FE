import { api } from '@/lib/api'
import type { ApiResponse } from '@/types/api'
import type { HealthData } from './health.types'

export async function getHealth(): Promise<ApiResponse<HealthData>> {
  return api.get<ApiResponse<HealthData>>('/health')
}