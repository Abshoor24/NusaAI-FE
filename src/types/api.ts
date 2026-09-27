// ===========================================================================
// src/types/api.ts
// Single Source of Truth — derived EXACTLY from backend docs/api.md
// All field names match backend JSON (snake_case).
// ===========================================================================

// ── Standard Response Wrapper ───────────────────────────────────────────────

/**
 * Standard success response from backend.
 * `data` can be object, array, or null (for delete operations).
 */
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

/**
 * Standard error response from backend.
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    /** Present only when code === "VALIDATION_ERROR" and struct validation fails */
    fields?: Record<string, string>
  }
}

/** All possible backend error codes */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'AI_PROVIDER_ERROR'
  | 'EXECUTION_PROVIDER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'DATABASE_ERROR'
  | 'INTERNAL_SERVER_ERROR'

// ── Auth ────────────────────────────────────────────────────────────────────

/** POST /api/v1/auth/register — Request body */
export interface RegisterRequest {
  email: string
  password: string
}

/** POST /api/v1/auth/login — Request body */
export interface LoginRequest {
  email: string
  password: string
}

/** User object returned in auth responses and GET /auth/me */
export interface UserResponse {
  id: string
  email: string
  role: string
  created_at: string
}

/** Response data for both register and login */
export interface AuthResponseData {
  token: string
  token_type: string // always "Bearer"
  expires_in: number // seconds, default 86400
  user: UserResponse
}

// ── AI Chat ─────────────────────────────────────────────────────────────────

/** Image payload for JSON-based chat requests */
export interface ImagePayload {
  mime_type: string // "image/jpeg" | "image/jpg" | "image/png" | "image/webp"
  data: string      // base64-encoded image data
  file_name?: string
}

/** Supported image MIME types */
export type SupportedImageMimeType =
  | 'image/jpeg'
  | 'image/jpg'
  | 'image/png'
  | 'image/webp'

/** POST /api/v1/ai/chat — JSON request body */
export interface ChatRequest {
  message: string
  conversation_id?: string
  system?: string
  use_rag?: boolean
  document_id?: string
  images?: ImagePayload[]
}

/** Attachment on a message */
export interface MessageAttachment {
  id: string
  message_id: string
  file_name: string
  file_type: string     // "jpeg" | "png" | "webp"
  file_size: number
  mime_type: string
  created_at: string
}

/** RAG chunk search result */
export interface ChunkSearchResult {
  id: string
  document_id: string
  chunk_index: number
  content: string
  similarity: number
}

/** Assistant message in chat response */
export interface ChatResponseMessage {
  id: string
  role: 'assistant'
  content: string
  attachments?: MessageAttachment[]
}

/** POST /api/v1/ai/chat — Response data */
export interface ChatResponseData {
  conversation_id: string
  message: ChatResponseMessage
  sources?: ChunkSearchResult[]
}

// ── SSE Stream Events ───────────────────────────────────────────────────────

/** SSE event: token */
export interface SSETokenEvent {
  token: string
}

/** SSE event: done */
export interface SSEDoneEvent {
  conversation_id: string
  message_id: string
}

/** SSE event: error */
export interface SSEErrorEvent {
  error: string
}

// ── Conversations ───────────────────────────────────────────────────────────

/** Conversation summary (list endpoint) */
export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

/** Message within a conversation */
export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  attachments?: MessageAttachment[] | null
  created_at: string
}

/** Full conversation detail with messages */
export interface ConversationDetail extends Conversation {
  messages: Message[]
}

// ── RAG Documents ───────────────────────────────────────────────────────────

/** Document status enum */
export type DocumentStatus = 'processing' | 'ready' | 'failed'

/** Base document object */
export interface Document {
  id: string
  user_id: string
  title: string
  source: string
  file_name?: string
  file_type?: string
  file_size?: number
  status: DocumentStatus
  error_message?: string
  created_at: string
}

/** Document with chunk_count (from list endpoint) */
export interface DocumentDetail extends Document {
  chunk_count: number
}

/** POST /api/v1/ai/documents — Ingest text request body */
export interface IngestDocumentRequest {
  title: string
  content: string
  source?: string
}

/** POST /api/v1/ai/documents — Ingest text response data */
export interface IngestDocumentResponseData {
  document: Document
  chunk_count: number
}

/** POST /api/v1/ai/documents/upload — Response data is Document directly */
// Response data is a Document object (status: "processing")

/** GET /api/v1/ai/documents/{id}/status — Response data */
export interface DocumentStatusResponse {
  id: string
  title: string
  status: DocumentStatus
  chunk_count: number
  error_message?: string
}

// ── Code Execution ──────────────────────────────────────────────────────────

/** Supported execution languages (canonical names) */
export type ExecuteLanguage = 'python' | 'javascript' | 'go'

/** POST /api/v1/execute — Request body */
export interface ExecuteRequest {
  language: ExecuteLanguage
  code: string
  stdin?: string
}

/** POST /api/v1/execute — Response data */
export interface ExecuteResponseData {
  id: string
  language: string
  stdout: string
  stderr: string
  exit_code: number
  execution_time_ms: number
  memory_kb: number
  status: string
}

/** GET /api/v1/execute/history — Array item (CodeExecution) */
export interface CodeExecution extends ExecuteResponseData {
  user_id: string
  code: string
  stdin?: string
  created_at: string
}

// ── Health ───────────────────────────────────────────────────────────────────

/** GET /health — Response data */
export interface HealthData {
  status: string
}

/** GET /health/db — Response data */
export interface HealthDbData {
  status: string
  database: string
}

/** GET /api/v1/ai/health — Response data */
export interface AiHealthData {
  provider: string
  configured: boolean
  checks: {
    provider: boolean
    api_key: boolean
    model: boolean
  }
}