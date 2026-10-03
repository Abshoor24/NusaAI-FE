/**
 * Penyimpanan JWT di localStorage (sesuai api.md §9.6).
 * Ini aman untuk produk ini karena HTML hasil AI TIDAK PERNAH dieksekusi
 * dalam origin aplikasi: preview dirender di <iframe> dengan
 * sandbox="allow-scripts allow-popups" TANPA allow-same-origin, sehingga
 * script di dalam preview tidak bisa membaca localStorage maupun DOM
 * aplikasi. Jangan pernah menyisipkan HTML hasil AI ke DOM aplikasi.
 * Jangan pernah me-log token.
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
