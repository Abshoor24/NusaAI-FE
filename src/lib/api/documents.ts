import { api } from './client'
import type {
  ApiResponse,
  Document,
  DocumentDetail,
  DocumentStatusResponse,
  IngestDocumentRequest,
  IngestDocumentResponseData,
} from '@/types/api'

export type { Document, DocumentDetail, DocumentStatusResponse, IngestDocumentRequest }

export const documentsApi = {
  /**
   * POST /api/v1/ai/documents/upload (Upload File)
   *
   * Uploads a physical file (.pdf, .docx, .txt) via multipart/form-data.
   * Multipart field names:
   * - `file` (binary, required)
   * - `title` (string, optional)
   *
   * IMPORTANT: Content-Type header is NOT set manually — browser sets it automatically with boundary.
   * Response: { success, message, data: Document } (status is always "processing")
   */
  uploadDocument: async (file: File, title?: string): Promise<Document> => {
    const formData = new FormData()
    formData.append('file', file)
    if (title && title.trim()) {
      formData.append('title', title.trim())
    }

    const res = await api.post<ApiResponse<Document>>(
      '/ai/documents/upload',
      formData
    )
    return res.data
  },

  /**
   * POST /api/v1/ai/documents (Ingest Text)
   *
   * Ingests plain text directly for RAG knowledge base.
   * Body: { title, content, source? }
   * Response: { success, message, data: { document, chunk_count } }
   */
  ingestText: async (payload: IngestDocumentRequest): Promise<IngestDocumentResponseData> => {
    const res = await api.post<ApiResponse<IngestDocumentResponseData>>(
      '/ai/documents',
      payload
    )
    return res.data
  },

  /**
   * GET /api/v1/ai/documents
   *
   * Lists all knowledge base documents owned by the logged-in user.
   * Response: { success, message, data: DocumentDetail[] }
   */
  listDocuments: async (): Promise<DocumentDetail[]> => {
    const res = await api.get<ApiResponse<DocumentDetail[]>>(
      '/ai/documents'
    )
    return res.data || []
  },

  /**
   * GET /api/v1/ai/documents/{id}
   *
   * Retrieves detail metadata of a single document.
   * Response: { success, message, data: Document }
   */
  getDocument: async (id: string): Promise<Document> => {
    const res = await api.get<ApiResponse<Document>>(
      `/ai/documents/${id}`
    )
    return res.data
  },

  /**
   * GET /api/v1/ai/documents/{id}/status
   *
   * Polls the background processing status of an uploaded document.
   * Response: { success, message, data: DocumentStatusResponse }
   */
  getDocumentStatus: async (id: string): Promise<DocumentStatusResponse> => {
    const res = await api.get<ApiResponse<DocumentStatusResponse>>(
      `/ai/documents/${id}/status`
    )
    return res.data
  },

  /**
   * DELETE /api/v1/ai/documents/{id}
   *
   * Deletes a document, its vector chunks, and physical file.
   * Response: { success, message, data: null }
   */
  deleteDocument: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/ai/documents/${id}`)
  },
}
