/**
 * CATATAN KEAMANAN (XSS Risk Note):
 * Menyimpan JWT di localStorage memiliki risiko keamanan terhadap serangan Cross-Site Scripting (XSS).
 * Jika penyerang berhasil menyuntikkan script berbahaya ke dalam aplikasi (misal via dependensi pihak ketiga
 * yang terkompromi atau kerentanan injeksi DOM), script tersebut dapat membaca token dari localStorage.
 * 
 * Alternatif yang lebih aman di lingkungan produksi adalah:
 * 1. Menggunakan cookie HttpOnly, Secure, SameSite=Strict/Lax yang di-set langsung oleh server,
 *    sehingga skrip JavaScript browser tidak dapat mengakses nilai token sama sekali.
 * 2. Menyimpan token di memori aplikasi (in-memory state) dengan silent refresh token via backend endpoint.
 * 
 * Untuk keperluan platform frontend ini, token disimpan di localStorage sesuai spesifikasi arsitektur saat ini.
 */

export const TOKEN_STORAGE_KEY = 'nusa_auth_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch (err) {
    console.error('Failed to save JWT token to localStorage:', err)
  }
}

export function removeToken(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch (err) {
    console.error('Failed to remove JWT token from localStorage:', err)
  }
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
