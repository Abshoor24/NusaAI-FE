/**
 * Sanitasi parameter `redirect` pasca-login agar tidak menjadi open redirect.
 *
 * Latar: guard `_app` menyimpan `redirect: location.href` (bisa memuat query,
 * mis. `/projects/xxx?autostart=1`), lalu halaman login menavigasi ke sana.
 * `navigate({ to })` TanStack Router mengharapkan path route murni, sehingga
 * query bisa rusak. Nilai yang sudah disanitasi di sini diteruskan ke
 * `router.history.push(...)` yang menerima href lengkap termasuk query.
 *
 * Hanya path internal yang lolos: diawali tepat satu "/", tanpa backslash,
 * tanpa spasi/karakter berbahaya, dan bukan halaman auth (anti-loop).
 */
export const DEFAULT_POST_LOGIN_REDIRECT = '/projects'

const AUTH_PATHS = new Set(['/login', '/register'])

export function sanitizeRedirect(raw: unknown): string {
  if (typeof raw !== 'string') return DEFAULT_POST_LOGIN_REDIRECT
  const value = raw.trim()
  if (value.length === 0) return DEFAULT_POST_LOGIN_REDIRECT
  // Wajib path absolut internal: "/" tepat satu di awal ("//evil" ditolak).
  if (!value.startsWith('/') || value.startsWith('//')) return DEFAULT_POST_LOGIN_REDIRECT
  // Tolak backslash (diperlakukan sebagai "/" oleh sebagian browser) dan
  // karakter yang tidak valid untuk navigasi internal.
  if (value.includes('\\') || /[\s<>"'`]/.test(value)) return DEFAULT_POST_LOGIN_REDIRECT
  // Hindari loop: jangan kembali ke halaman auth (query/hash diabaikan).
  const pathname = (value.split(/[?#]/, 1)[0] ?? '/').replace(/\/+$/, '') || '/'
  if (AUTH_PATHS.has(pathname.toLowerCase())) return DEFAULT_POST_LOGIN_REDIRECT
  return value
}
