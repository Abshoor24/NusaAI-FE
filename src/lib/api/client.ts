import { getToken, removeToken } from './token'
import type { ApiErrorCode, ApiErrorResponse } from '@/types/api'

// ── Base URL ────────────────────────────────────────────────────────────────
// Kanonis: VITE_API_BASE_URL. Fallback: VITE_API_URL (lama).
// Nilai boleh berupa origin ("http://localhost:8080") atau sudah termasuk
// prefix "/api/v1". Jangan hardcode URL backend di kode.

function resolveApiBase(): string {
  const raw =
    import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
  const trimmed = raw.replace(/\/+$/, '')
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`
}

function resolveApiRoot(apiBase: string): string {
  return apiBase.endsWith('/api/v1') ? apiBase.slice(0, -'/api/v1'.length) : apiBase
}

export const PUBLIC_ENDPOINTS = ['/auth/login', '/auth/register']

export function isPublicEndpoint(path: string): boolean {
  return PUBLIC_ENDPOINTS.some((pub) => path.includes(pub))
}

/** Opsi tambahan di luar RequestInit standar. */
export interface ApiRequestInit extends RequestInit {
  /**
   * Bila true, handler 401 global (hapus token + redirect) dilewati.
   * Wajib dipakai pada login/register: 401 di sana adalah pesan form,
   * BUKAN pemicu auto-logout (api.md §2).
   */
  skipAuthRedirect?: boolean
}

/**
 * Klasifikasi 401 untuk handler global. Hanya dua perilaku (api.md §9.1):
 * 'expired' → pesan "Sesi berakhir..."; 'invalid' (termasuk token hilang
 * dan token rusak) → logout diam-diam lalu ke login.
 */
export type UnauthorizedKind = 'expired' | 'invalid'

/** Handler global 401; bisa diganti di test. Default: redirect ke /login. */
let unauthorizedHandler: ((kind: UnauthorizedKind) => void) | null = null

export function setUnauthorizedHandler(handler: ((kind: UnauthorizedKind) => void) | null): void {
  unauthorizedHandler = handler
}

function defaultUnauthorized(kind: UnauthorizedKind): void {
  if (typeof window === 'undefined') return
  if (window.location.pathname !== '/login') {
    const params = new URLSearchParams({
      ...(kind === 'expired' ? { expired: '1' } : {}),
      redirect: window.location.pathname + window.location.search,
    })
    window.location.href = `/login?${params.toString()}`
  }
}

export class ApiError extends Error {
  status: number
  code: ApiErrorCode | string
  retryAfter?: number
  /** Field validation errors (hanya untuk VALIDATION_ERROR). */
  fields?: Record<string, string>
  /** Sub-kode stabil (hanya untuk AI_PROVIDER_ERROR). */
  reason?: string

  constructor(
    status: number,
    message: string,
    code: ApiErrorCode | string = 'INTERNAL_SERVER_ERROR',
    options?: { retryAfter?: number; fields?: Record<string, string>; reason?: string },
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.retryAfter = options?.retryAfter
    this.fields = options?.fields
    this.reason = options?.reason
  }
}

// ── Dev-mode response shape validator ───────────────────────────────────────

function assertResponseShape(json: unknown, path: string): void {
  if (!import.meta.env.DEV) return
  if (json === null || json === undefined) return
  if (typeof json !== 'object') {
    console.warn(`[API] Response untuk ${path} bukan objek:`, json)
    return
  }
  const obj = json as Record<string, unknown>
  if (!('success' in obj)) {
    console.warn(`[API] Response untuk ${path} tidak punya field 'success':`, obj)
  }
  if (!('data' in obj) && obj.success === true) {
    console.warn(`[API] Response untuk ${path} tidak punya field 'data':`, obj)
  }
}

// ── Core request function ───────────────────────────────────────────────────

function classifyUnauthorized(message: string | undefined): UnauthorizedKind {
  if (message === 'Authentication token has expired') return 'expired'
  return 'invalid'
}

async function request<T>(path: string, init?: ApiRequestInit): Promise<T> {
  const apiBase = resolveApiBase()
  // /health dan /health/db ada di ROOT server, bukan di bawah /api/v1.
  const useRoot = path === '/health' || path.startsWith('/health/')
  const url = `${useRoot ? resolveApiRoot(apiBase) : apiBase}${path}`

  const token = getToken()
  const headers = new Headers(init?.headers)

  if (token && !isPublicEndpoint(path)) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData
  if (!isFormData && init?.body !== undefined) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
  }

  let response: Response
  try {
    response = await fetch(url, { ...init, headers })
  } catch (err) {
    // Jaringan putus / DNS / CORS ditolak / server mati.
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError(
      0,
      'Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.',
      'NETWORK_ERROR',
    )
  }

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null
    try {
      errorData = (await response.json()) as ApiErrorResponse
    } catch {
      // Body bukan JSON (mis. proxy error page).
    }

    let message = response.statusText || `HTTP ${response.status}`
    let code: string | undefined
    let retryAfter: number | undefined
    let fields: Record<string, string> | undefined
    let reason: string | undefined

    if (errorData && typeof errorData === 'object' && errorData.error) {
      message = errorData.error.message || message
      code = errorData.error.code
      fields = errorData.error.fields
      reason = errorData.error.reason
    }

    if (response.status === 429) {
      const retryHeader = response.headers.get('Retry-After')
      const parsed = retryHeader ? parseInt(retryHeader, 10) : NaN
      // Backend selalu mengirim Retry-After: 60 (api.md § Rate Limiting).
      retryAfter = Number.isNaN(parsed) ? 60 : parsed
      if (!code) code = 'RATE_LIMITED'
    }

    if (response.status === 401 && !init?.skipAuthRedirect && !isPublicEndpoint(path)) {
      // Bedakan HANYA untuk 401 ini, lewat message persis (api.md §9.1).
      const kind = classifyUnauthorized(errorData?.error.message)
      removeToken()
      if (unauthorizedHandler) unauthorizedHandler(kind)
      else defaultUnauthorized(kind)
    }

    throw new ApiError(response.status, message, (code ?? 'INTERNAL_SERVER_ERROR') as ApiErrorCode, {
      retryAfter,
      fields,
      reason,
    })
  }

  if (response.status === 204) {
    return undefined as T
  }

  let json: T
  try {
    json = (await response.json()) as T
  } catch {
    throw new ApiError(response.status, 'Respons server tidak valid (bukan JSON).', 'BAD_REQUEST')
  }

  assertResponseShape(json, path)
  return json
}

// ── Exported API methods ────────────────────────────────────────────────────

function serializeBody(body: unknown, init?: ApiRequestInit): BodyInit | undefined {
  if (body === undefined) return undefined
  if (typeof FormData !== 'undefined' && body instanceof FormData) return body
  void init
  return JSON.stringify(body)
}

export const api = {
  get: <T>(path: string, init?: ApiRequestInit): Promise<T> =>
    request<T>(path, { method: 'GET', ...init }),

  post: <T>(path: string, body?: unknown, init?: ApiRequestInit): Promise<T> =>
    request<T>(path, { method: 'POST', ...init, body: serializeBody(body, init) }),

  put: <T>(path: string, body?: unknown, init?: ApiRequestInit): Promise<T> =>
    request<T>(path, { method: 'PUT', ...init, body: serializeBody(body, init) }),

  patch: <T>(path: string, body?: unknown, init?: ApiRequestInit): Promise<T> =>
    request<T>(path, { method: 'PATCH', ...init, body: serializeBody(body, init) }),

  delete: <T>(path: string, init?: ApiRequestInit): Promise<T> =>
    request<T>(path, { method: 'DELETE', ...init }),
}

/** URL absolut untuk path API (dipakai SSE fetch). */
export function apiUrl(path: string): string {
  const apiBase = resolveApiBase()
  const useRoot = path === '/health' || path.startsWith('/health/')
  return `${useRoot ? resolveApiRoot(apiBase) : apiBase}${path}`
}
