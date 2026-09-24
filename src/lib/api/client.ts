import { getToken, removeToken } from './token'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8080'

export const PUBLIC_ENDPOINTS = ['/health', '/auth/login', '/auth/register']

export function isPublicEndpoint(path: string): boolean {
  return PUBLIC_ENDPOINTS.some((pub) => path.includes(pub))
}

export interface ApiErrorPayload {
  code?: string
  message?: string
}

export class ApiError extends Error {
  status: number
  code?: string
  retryAfter?: number

  constructor(status: number, message: string, code?: string, retryAfter?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.retryAfter = retryAfter
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers = new Headers(init?.headers)

  // Attach Authorization header if token exists and endpoint is not public
  if (token && !isPublicEndpoint(path)) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Set Content-Type: application/json if not already set and body is not FormData
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData
  if (!isFormData && !headers.has('Content-Type') && init?.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let errorData: any = null
    try {
      errorData = await response.json()
    } catch {
      // Body is not JSON
    }

    let message = response.statusText || `HTTP ${response.status}`
    let code: string | undefined
    let retryAfter: number | undefined

    // Parse error response according to standard { error: { code, message } }
    if (errorData && typeof errorData === 'object') {
      if (errorData.error && typeof errorData.error === 'object') {
        message = errorData.error.message || message
        code = errorData.error.code
      } else if (typeof errorData.error === 'string') {
        message = errorData.error
      } else if (typeof errorData.message === 'string') {
        message = errorData.message
      }
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

    throw new ApiError(response.status, message, code, retryAfter)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

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