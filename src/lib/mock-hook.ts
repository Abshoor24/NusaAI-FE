/**
 * Pengait mode mock (Fase 4).
 * Bila `VITE_USE_MOCK=true` (dev saja), kembalikan fetch mock yang
 * mensimulasikan backend; bila tidak, kembalikan undefined agar pemanggil
 * memakai fetch asli. Mock dimuat via dynamic import agar chunk-nya
 * terpisah dan tidak pernah dipakai saat flag mati.
 */
export async function getMockFetch(): Promise<typeof fetch | undefined> {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true') {
    const mod = await import('@/mock/backend')
    return mod.mockFetch as typeof fetch
  }
  return undefined
}

/** True bila mode mock aktif (dipakai untuk banner dev). */
export function isMockEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true'
}
