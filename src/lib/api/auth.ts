import { api } from './client'
import { getToken, setToken, removeToken, isAuthenticated, TOKEN_STORAGE_KEY } from './token'

export { getToken, setToken, removeToken, isAuthenticated, TOKEN_STORAGE_KEY }

export interface User {
  id?: string
  email: string
  name?: string
  username?: string
  role?: string
  created_at?: string
  [key: string]: unknown
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string
  username?: string
}

export interface LoginRequest {
  email?: string
  username?: string
  password: string
}

export interface AuthResponse {
  token?: string
  access_token?: string
  user?: User
  message?: string
  [key: string]: unknown
}

function extractToken(res: unknown): string | null {
  if (!res || typeof res !== 'object') return null
  const obj = res as Record<string, unknown>
  if (typeof obj.token === 'string') return obj.token
  if (typeof obj.access_token === 'string') return obj.access_token
  if (obj.data && typeof obj.data === 'object') {
    const dataObj = obj.data as Record<string, unknown>
    if (typeof dataObj.token === 'string') return dataObj.token
    if (typeof dataObj.access_token === 'string') return dataObj.access_token
  }
  return null
}

export const authApi = {
  register: async (payload: RegisterRequest): Promise<AuthResponse> => {
    let res: AuthResponse
    try {
      res = await api.post<AuthResponse>('/auth/register', payload)
    } catch (err: unknown) {
      // Fallback if backend mounts at /api/v1/auth/register
      const apiErr = err as { status?: number }
      if (apiErr?.status === 404) {
        res = await api.post<AuthResponse>('/api/v1/auth/register', payload)
      } else {
        throw err
      }
    }

    const token = extractToken(res)
    if (token) {
      setToken(token)
    }
    return res
  },

  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    let res: AuthResponse
    try {
      res = await api.post<AuthResponse>('/auth/login', payload)
    } catch (err: unknown) {
      // Fallback if backend mounts at /api/v1/auth/login
      const apiErr = err as { status?: number }
      if (apiErr?.status === 404) {
        res = await api.post<AuthResponse>('/api/v1/auth/login', payload)
      } else {
        throw err
      }
    }

    const token = extractToken(res)
    if (token) {
      setToken(token)
    }
    return res
  },

  getMe: async (): Promise<User> => {
    let res: unknown
    try {
      res = await api.get<unknown>('/auth/me')
    } catch (err: unknown) {
      const apiErr = err as { status?: number }
      if (apiErr?.status === 404) {
        res = await api.get<unknown>('/api/v1/auth/me')
      } else {
        throw err
      }
    }

    if (res && typeof res === 'object') {
      const obj = res as Record<string, unknown>
      if (obj.user && typeof obj.user === 'object') return obj.user as User
      if (obj.data && typeof obj.data === 'object') return obj.data as User
      return obj as User
    }
    throw new Error('Invalid user response format')
  },

  logout: (): void => {
    removeToken()
  },
}
