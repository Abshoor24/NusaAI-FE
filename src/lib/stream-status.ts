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

export type StreamStageId = 'brief' | 'waiting' | 'writing' | 'preview'
export type StreamStageState = 'done' | 'active' | 'pending'

export interface StreamStage {
  id: StreamStageId
  label: string
  description: string
  state: StreamStageState
}

/**
 * Tahapan diturunkan hanya dari event nyata: stream dimulai, request dikirim,
 * token pertama tiba, dan event done diterima. Tidak ada timer palsu yang
 * memindahkan tahap.
 */
export function buildStreamStages(params: {
  phase: 'idle' | 'preparing' | 'streaming' | 'saving'
  requestSent: boolean
  firstTokenReceived: boolean
}): StreamStage[] {
  const { phase, requestSent, firstTokenReceived } = params
  const streaming = phase === 'streaming' || phase === 'saving'

  return [
    {
      id: 'brief',
      label: 'Brief diterima',
      description: 'Brief proyek sudah tersimpan.',
      state: 'done',
    },
    {
      id: 'waiting',
      label: 'Menunggu AI',
      description: 'Permintaan sudah dikirim ke server AI.',
      state: streaming ? 'done' : requestSent ? 'active' : 'pending',
    },
    {
      id: 'writing',
      label: 'AI menulis halaman',
      description: 'Potongan halaman pertama sudah diterima.',
      state:
        phase === 'saving'
          ? 'done'
          : firstTokenReceived && phase === 'streaming'
            ? 'active'
            : 'pending',
    },
    {
      id: 'preview',
      label: 'Menyiapkan tampilan',
      description: 'Halaman selesai, pratinjau final sedang dimuat.',
      state: phase === 'saving' ? 'active' : 'pending',
    },
  ]
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
