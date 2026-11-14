import type { SseStatusPhase } from './api/sse'

export const BUSY_HINT_AFTER_MS = 20_000

export interface StatusTextSource {
  phase: SseStatusPhase
  attempt?: number
}

/** Timer fase menyiapkan dalam mm:ss (menit boleh lebih dari 99). */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function statusPhaseText({ phase, attempt = 1 }: StatusTextSource): string {
  switch (phase) {
    case 'connecting':
      return 'Menghubungi server AI…'
    case 'retrying':
      return `Server AI sedang ramai, mencoba lagi (percobaan ${attempt})…`
    case 'fallback':
      return 'Beralih ke jalur cadangan…'
  }
}

/** Tampilkan pengingat ramai setelah 20 detik tanpa token pertama. */
export function shouldShowBusyHint(params: {
  phase: 'idle' | 'preparing' | 'streaming' | 'saving'
  startedAt: number
  now: number
  firstTokenAt: number | null
}): boolean {
  const { phase, startedAt, now, firstTokenAt } = params
  return (
    phase === 'preparing' &&
    firstTokenAt === null &&
    startedAt > 0 &&
    now - startedAt >= BUSY_HINT_AFTER_MS
  )
}
