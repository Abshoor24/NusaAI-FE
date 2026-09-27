import { api } from './client'
import { getToken, setToken, removeToken, isAuthenticated, TOKEN_STORAGE_KEY } from './token'
import type {
  ApiResponse,
  RegisterRequest,
  LoginRequest,
  AuthResponseData,
  UserResponse,
} from '@/types/api'

export { getToken, setToken, removeToken, isAuthenticated, TOKEN_STORAGE_KEY }

// Re-export types so pages can import from here
export type { RegisterRequest, LoginRequest, UserResponse, AuthResponseData }

export const authApi = {
  /**
   * POST /api/v1/auth/register
   *
   * Backend only accepts { email, password } — no name/username fields.
   * Response: { success, message, data: { token, token_type, expires_in, user } }
   */
  register: async (payload: RegisterRequest): Promise<AuthResponseData> => {
    const res = await api.post<ApiResponse<AuthResponseData>>('/auth/register', {
      email: payload.email,
      password: payload.password,
    })

    const data = res.data
    if (data.token) {
      setToken(data.token)
    }
    return data
  },

  /**
   * POST /api/v1/auth/login
   *
   * Backend only accepts { email, password } — no username field.
   * Response: { success, message, data: { token, token_type, expires_in, user } }
   */
  login: async (payload: LoginRequest): Promise<AuthResponseData> => {
    const res = await api.post<ApiResponse<AuthResponseData>>('/auth/login', {
      email: payload.email,
      password: payload.password,
    })

    const data = res.data
    if (data.token) {
      setToken(data.token)
    }
    return data
  },

  /**
   * GET /api/v1/auth/me
   *
   * Response: { success, message, data: { id, email, role, created_at } }
   */
  getMe: async (): Promise<UserResponse> => {
    const res = await api.get<ApiResponse<UserResponse>>('/auth/me')
    return res.data
  },

  /** Clear local token */
  logout: (): void => {
    removeToken()
  },
}
