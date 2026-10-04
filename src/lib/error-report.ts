/**
 * Hook pelaporan error produksi (opsional, nonaktif secara default).
 *
 * Aktif bila `VITE_ERROR_ENDPOINT` diisi URL webhook penerima.
 * Payload SENGAJA minimal: nama error, pesan (maks 500 char), stack
 * (maks 2000 char), path, dan waktu. TIDAK PERNAH mengirim:
 * - token auth (tidak pernah dibaca di sini),
 * - HTML hasil generate (bisa memuat data pengguna),
 * - isi localStorage / cookie.
 * Kegagalan pengiriman ditelan diam-diam (jangan merusak UX).
 */

export interface ErrorReport {
  name: string
  message: string
  stack?: string
  path: string
  at: string
}

function endpoint(): string | null {
  const url = import.meta.env.VITE_ERROR_ENDPOINT
  if (typeof url !== 'string' || url.trim().length === 0) return null
  return url.trim()
}

export function buildErrorReport(err: unknown): ErrorReport {
  const name = err instanceof Error ? err.name : 'UnknownError'
  const rawMessage = err instanceof Error ? err.message : String(err)
  const rawStack = err instanceof Error ? err.stack : undefined
  return {
    name,
    message: rawMessage.slice(0, 500),
    stack: rawStack?.slice(0, 2000),
    path: typeof window !== 'undefined' ? window.location.pathname : '',
    at: new Date().toISOString(),
  }
}

export function reportError(err: unknown): void {
  const url = endpoint()
  if (!url) return
  try {
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildErrorReport(err)),
      keepalive: true,
    }).catch(() => {
      // Abaikan kegagalan jaringan pelaporan.
    })
  } catch {
    // Jangan pernah melempar dari jalur pelaporan.
  }
}
