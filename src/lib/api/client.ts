import { getToken, removeToken } from './token'
import type { ApiErrorCode, ApiErrorResponse } from '@/types/api'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8080/api/v1'

export const PUBLIC_ENDPOINTS = ['/health', '/auth/login', '/auth/register']

export function isPublicEndpoint(path: string): boolean {
  return PUBLIC_ENDPOINTS.some((pub) => path.includes(pub))
}

export class ApiError extends Error {
  status: number
  code?: ApiErrorCode | string
  retryAfter?: number
  /** Validation field errors from backend */
  fields?: Record<string, string>

  constructor(
    status: number,
    message: string,
    code?: string,
    retryAfter?: number,
    fields?: Record<string, string>
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.retryAfter = retryAfter
    this.fields = fields
  }
}

// ── Dev-mode response shape validator ───────────────────────────────────────

/**
 * Lightweight runtime check: verifies that response has { success, data }
 * shape. Only logs warnings in dev; never blocks in production.
 */
function assertResponseShape(json: unknown, path: string): void {
  if (!import.meta.env.DEV) return
  if (json === null || json === undefined) return

  if (typeof json !== 'object') {
    console.warn(`[API] Response for ${path} is not an object:`, json)
    return
  }

  const obj = json as Record<string, unknown>

  if (!('success' in obj)) {
    console.warn(`[API] Response for ${path} is missing 'success' field:`, obj)
  }

  // For non-delete operations, 'data' should be present
  if (!('data' in obj) && obj.success === true) {
    console.warn(`[API] Response for ${path} is missing 'data' field:`, obj)
  }
}

// ── Core request function ───────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers = new Headers(init?.headers)

  // Attach Authorization header if token exists and endpoint is not public
  if (token && !isPublicEndpoint(path)) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Set Content-Type: application/json explicitly for JSON bodies (not FormData)
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData
  if (!isFormData && init?.body !== undefined) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
  }

  // Debug log (dev only)
  if (import.meta.env.DEV) {
    console.debug('[API]', init?.method ?? 'GET', path, {
      body: init?.body,
      contentType: headers.get('Content-Type'),
    })
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null
    try {
      errorData = (await response.json()) as ApiErrorResponse
    } catch {
      // Body is not JSON
    }

    let message = response.statusText || `HTTP ${response.status}`
    let code: string | undefined
    let retryAfter: number | undefined
    let fields: Record<string, string> | undefined

    // Parse error response according to standard { success, error: { code, message, fields? } }
    if (errorData && typeof errorData === 'object' && errorData.error) {
      message = errorData.error.message || message
      code = errorData.error.code
      fields = errorData.error.fields
    }

    // Special handling: 429 Too Many Requests -> read Retry-After header
    if (response.status === 429) {
      const retryHeader = response.headers.get('Retry-After')
      if (retryHeader) {
        const parsedSeconds = parseInt(retryHeader, 10)
        if (!isNaN(parsedSeconds)) {
          retryAfter = parsedSeconds
          message = `Too many requests. Please wait ${parsedSeconds} seconds before retrying.`
        } else {
          message = `Too many requests. Retry after: ${retryHeader}.`
        }
      } else {
        message = message || 'Too many requests. Please slow down and try again later.'
      }
    }

    // Special handling: 401 Unauthorized -> clear token & redirect to /login
    if (response.status === 401) {
      removeToken()
      if (
        typeof window !== 'undefined' &&
        !isPublicEndpoint(path) &&
        window.location.pathname !== '/login'
      ) {
        window.location.href = '/login'
      }
    }

    throw new ApiError(response.status, message, code, retryAfter, fields)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const json = await response.json()

  // Dev-mode shape assertion
  assertResponseShape(json, path)

  return json as T
}

// ── Exported API methods ────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, init?: RequestInit): Promise<T> =>
    request<T>(path, { method: 'GET', ...init }),

  post: <T>(path: string, body?: unknown, init?: RequestInit): Promise<T> => {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    return request<T>(path, {
      method: 'POST',
      ...init,
      body: isFormData ? (body as FormData) : (body === undefined ? undefined : JSON.stringify(body)),
    })
  },

  put: <T>(path: string, body?: unknown, init?: RequestInit): Promise<T> => {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    return request<T>(path, {
      method: 'PUT',
      ...init,
      body: isFormData ? (body as FormData) : (body === undefined ? undefined : JSON.stringify(body)),
    })
  },

  patch: <T>(path: string, body?: unknown, init?: RequestInit): Promise<T> => {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    return request<T>(path, {
      method: 'PATCH',
      ...init,
      body: isFormData ? (body as FormData) : (body === undefined ? undefined : JSON.stringify(body)),
    })
  },

  delete: <T>(path: string, init?: RequestInit): Promise<T> =>
    request<T>(path, { method: 'DELETE', ...init }),
}