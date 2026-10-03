// ===========================================================================
// src/types/api.ts
// Single Source of Truth frontend — diturunkan dari backend docs/api.md
// (AI Website Generator, Tahap A). Semua nama field sama dengan JSON backend
// (snake_case). Rujukan: C:\project\pakhir\be\docs\api.md
// ===========================================================================

// ── Standard Response Wrapper ───────────────────────────────────────────────

/**
 * Response sukses backend. `data` bisa berupa objek, array, atau null
 * (untuk operasi delete).
 */
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

/**
 * Response error backend.
 * - `fields` hanya ada bila code === "VALIDATION_ERROR" (key bisa bersarang,
 *   contoh "brief.description").
 * - `reason` hanya ada bila code === "AI_PROVIDER_ERROR".
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    fields?: Record<string, string>
    reason?: string
  }
}

/** Kode error backend (api.md § Error Codes). */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'METHOD_NOT_ALLOWED'
  | 'RATE_LIMITED'
  | 'AI_PROVIDER_ERROR'
  | 'EXECUTION_PROVIDER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'DATABASE_ERROR'
  | 'INTERNAL_SERVER_ERROR'

/** Sub-kode stabil untuk AI_PROVIDER_ERROR (api.md §9.3.1). */
export type AiErrorReason =
  | 'PROVIDER_OVERLOADED'
  | 'STREAM_TIMEOUT'
  | 'STREAM_STALLED'
  | 'OUTPUT_TRUNCATED'
  | 'OUTPUT_BLOCKED'
  | 'STREAM_INTERRUPTED'
  | 'INVALID_OUTPUT'
  | 'PROVIDER_ERROR'

/** Kode khusus klien (bukan dari backend). */
export type ClientErrorCode = 'NETWORK_ERROR' | 'ABORTED'

/** Bentuk error terstruktur yang dilempar ApiClient / SSE client. */
export interface ApiErrorShape {
  status: number
  code: string
  message: string
  fields?: Record<string, string>
  reason?: string
  retryAfter?: number
}

// ── Auth ────────────────────────────────────────────────────────────────────

/** POST /api/v1/auth/register — body. */
export interface RegisterRequest {
  email: string
  password: string
}

/** POST /api/v1/auth/login — body. */
export interface LoginRequest {
  email: string
  password: string
}

/**
 * User publik dari backend.
 * CATATAN: backend sudah TIDAK memakai `role` (dihapus di migrasi 0011).
 * Token contoh di api.md masih memuat klaim "role" lama — abaikan.
 */
export interface UserResponse {
  id: string
  email: string
  created_at: string
}

/** Data response register & login. */
export interface AuthResponseData {
  token: string
  token_type: string // selalu "Bearer"
  expires_in: number // detik, default 86400
  user: UserResponse
}

// ── Projects & Brief ────────────────────────────────────────────────────────

export type WebsiteType =
  | 'landing_page'
  | 'portfolio'
  | 'company_profile'
  | 'online_store'
  | 'blog'
  | 'other'

export type ContentLanguage = 'id' | 'en'

export type ProjectStatus = 'draft' | 'generating' | 'ready' | 'failed'

export type VersionKind = 'generate' | 'revise'

/** Brief terstruktur (api.md §3). Field opsional yang kosong TIDAK dikirim. */
export interface Brief {
  description: string // wajib, 10..4000
  website_type?: WebsiteType // default landing_page (server)
  business_name?: string // maks 120
  style?: string // maks 200
  color_palette?: string // maks 200
  language?: ContentLanguage // default id (server)
  sections?: string[] // maks 12 item, tiap maks 50
}

/** POST /api/v1/projects — body. */
export interface CreateProjectRequest {
  title?: string // maks 200; fallback: business_name → 60 char pertama description
  brief: Brief
}

/** PATCH /api/v1/projects/{id} — body. */
export interface UpdateTitleRequest {
  title: string // non-kosong setelah trim, maks 200
}

/**
 * Item GET /projects dan response POST /projects + PATCH.
 * TANPA key `latest_version` (api.md: "tanpa latest_version").
 */
export interface ProjectSummary {
  id: string
  title: string
  status: ProjectStatus
  brief: Brief
  version_count: number
  created_at: string
  updated_at: string
}

/**
 * GET /api/v1/projects/{id} — detail dengan `latest_version`
 * (Version lengkap + html, atau null bila belum ada versi).
 */
export interface ProjectDetail extends ProjectSummary {
  latest_version: Version | null
}

/** Satu versi website. `html` hanya ada di detail/single (bukan di list). */
export interface Version {
  id: string
  project_id: string
  version_number: number
  kind: VersionKind
  prompt: string
  html?: string
  created_at: string
}

/** Item GET /api/v1/projects/{id}/versions (tanpa html). */
export type VersionListItem = Omit<Version, 'html'>

// ── Generate & Revise ───────────────────────────────────────────────────────

/** Satu gambar untuk body JSON generate/revise (base64). */
export interface ImagePayload {
  mime_type: string // "image/jpeg" | "image/jpg" | "image/png" | "image/webp"
  data: string // base64
  file_name?: string
}

/** POST /projects/{id}/generate — body JSON (boleh {}). */
export interface GenerateRequest {
  images?: ImagePayload[]
}

/** POST /projects/{id}/revise — body JSON. */
export interface ReviseRequest {
  instruction: string // 1..4000
  base_version?: number // >= 1, default versi terbaru
  images?: ImagePayload[]
}

// ── SSE ─────────────────────────────────────────────────────────────────────

/** Event `token`: potongan HTML, HANYA untuk progres (teks biasa). */
export interface SseTokenEvent {
  token: string
}

/** Event terminal `done`. */
export interface SseDoneEvent {
  project_id: string
  version_id: string
  version_number: number
}

/** Event terminal `error` (envelope error penuh). */
export interface SseErrorEvent {
  success: false
  error: {
    code: string
    message: string
    reason?: string
  }
}

export type SseEvent =
  | { type: 'token'; data: SseTokenEvent }
  | { type: 'done'; data: SseDoneEvent }
  | { type: 'error'; data: SseErrorEvent }

// ── Attachments ─────────────────────────────────────────────────────────────

export interface ProjectAttachment {
  id: string
  project_id: string
  file_name: string
  file_type: string // "jpeg" | "png" | "webp"
  file_size: number
  mime_type: string
  created_at: string
}

// ── Health ───────────────────────────────────────────────────────────────────

/** GET /health — response data. */
export interface HealthData {
  status: string
}

/** GET /health/db — response data. */
export interface HealthDbData {
  status: string
  database: string
}

/** GET /api/v1/ai/health — response data. */
export interface AiHealthData {
  provider: string
  configured: boolean
  checks: {
    provider: boolean
    api_key: boolean
    model: boolean
  }
}
