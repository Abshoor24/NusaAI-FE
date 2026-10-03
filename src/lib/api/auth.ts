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
   * Body: { email, password }. Langsung mengembalikan JWT aktif.
   * 409 (email sudah terdaftar) ditampilkan sebagai pesan form.
   */
  register: async (payload: RegisterRequest): Promise<AuthResponseData> => {
    const res = await api.post<ApiResponse<AuthResponseData>>(
      '/auth/register',
      { email: payload.email, password: payload.password },
      { skipAuthRedirect: true },
    )
    const data = res.data
    if (data.token) setToken(data.token)
    return data
  },

  /**
   * POST /api/v1/auth/login
   * 401 "Invalid email or password" ditampilkan sebagai pesan form
   * (BUKAN auto-logout — lihat skipAuthRedirect).
   */
  login: async (payload: LoginRequest): Promise<AuthResponseData> => {
    const res = await api.post<ApiResponse<AuthResponseData>>(
      '/auth/login',
      { email: payload.email, password: payload.password },
      { skipAuthRedirect: true },
    )
    const data = res.data
    if (data.token) setToken(data.token)
    return data
  },

  /**
   * GET /api/v1/auth/me
   * Response data: { id, email, created_at } (tanpa role).
   */
  getMe: async (): Promise<UserResponse> => {
    const res = await api.get<ApiResponse<UserResponse>>('/auth/me')
    return res.data
  },

  /** Hapus token lokal (tidak ada endpoint logout di backend). */
  logout: (): void => {
    removeToken()
  },
}
