import { api } from './client'
import type { ApiResponse } from '@/types/api'

export type HealthData = {
  status: string
}

export async function getHealth(): Promise<ApiResponse<HealthData>> {
  return api.get<ApiResponse<HealthData>>('/health')
}