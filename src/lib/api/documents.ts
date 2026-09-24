import { api } from './client'

export interface DocumentItem {
  id: string
  user_id: string
  title: string
  source: string
  file_name?: string
  file_type?: string
  file_size?: number
  status: 'processing' | 'ready' | 'failed'
  chunk_count: number
  error_message?: string
  created_at: string
}

export interface DocumentStatusResponse {
  id: string
  title: string
  status: 'processing' | 'ready' | 'failed'
  chunk_count: number
  error_message?: string
}

export const documentsApi = {
  uploadDocument: async (file: File, title?: string): Promise<DocumentItem> => {
    const formData = new FormData()
    formData.append('file', file)
    if (title && title.trim()) {
      formData.append('title', title.trim())
    }

    const res = await api.post<{ success: boolean; data: DocumentItem }>(
      '/api/v1/ai/documents/upload',
      formData
    )
    return res.data
  },

  listDocuments: async (): Promise<DocumentItem[]> => {
    const res = await api.get<{ success: boolean; data: DocumentItem[] }>(
      '/api/v1/ai/documents'
    )
    return res.data || []
  },

  getDocumentStatus: async (id: string): Promise<DocumentStatusResponse> => {
    const res = await api.get<{ success: boolean; data: DocumentStatusResponse }>(
      `/api/v1/ai/documents/${id}/status`
    )
    return res.data
  },

  deleteDocument: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/ai/documents/${id}`)
  },
}
