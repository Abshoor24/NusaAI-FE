import { describe, expect, it } from 'vitest'
import {
  BUSY_HINT_AFTER_MS,
  buildStreamStages,
  formatElapsed,
  shouldShowBusyHint,
  statusPhaseText,
} from './stream-status'

describe('formatElapsed', () => {
  it.each([
    [0, '00:00'],
    [1_000, '00:01'],
    [59_999, '00:59'],
    [60_000, '01:00'],
    [3_661_000, '61:01'],
    [-500, '00:00'],
  ])('%s ms → %s', (ms, expected) => {
    expect(formatElapsed(ms)).toBe(expected)
  })
})

describe('statusPhaseText', () => {
  it('menulis status tanpa istilah teknis atau nama model', () => {
    expect(statusPhaseText({ phase: 'connecting' })).toBe('Menghubungi server AI…')
    expect(statusPhaseText({ phase: 'retrying', attempt: 3 })).toBe(
      'Server AI sedang ramai, mencoba lagi (percobaan 3)…',
    )
    expect(statusPhaseText({ phase: 'fallback' })).toBe('Beralih ke jalur cadangan…')
  })
})

describe('shouldShowBusyHint', () => {
  const base = { phase: 'preparing' as const, startedAt: 10_000, firstTokenAt: null }

  it('belum tampil sebelum 20 detik', () => {
    expect(
      shouldShowBusyHint({ ...base, now: 10_000 + BUSY_HINT_AFTER_MS - 1 }),
    ).toBe(false)
  })

  it('tampil tepat setelah 20 detik tanpa token', () => {
    expect(shouldShowBusyHint({ ...base, now: 10_000 + BUSY_HINT_AFTER_MS })).toBe(true)
  })

  it('tidak tampil setelah token pertama tiba atau fase berganti', () => {
    expect(
      shouldShowBusyHint({
        ...base,
        firstTokenAt: 15_000,
        now: 10_000 + BUSY_HINT_AFTER_MS,
      }),
    ).toBe(false)
    expect(
      shouldShowBusyHint({
        ...base,
        phase: 'streaming',
        now: 10_000 + BUSY_HINT_AFTER_MS,
      }),
    ).toBe(false)
  })
})

describe('buildStreamStages', () => {
  it('menandai brief selesai dan menunggu sebelum request terkirim', () => {
    const stages = buildStreamStages({
      phase: 'preparing',
      requestSent: false,
      firstTokenReceived: false,
    })
    expect(stages.map((stage) => [stage.id, stage.state])).toEqual([
      ['brief', 'done'],
      ['waiting', 'pending'],
      ['writing', 'pending'],
      ['preview', 'pending'],
    ])
  })

  it('memindahkan tahap hanya setelah request dan token pertama nyata', () => {
    const waiting = buildStreamStages({
      phase: 'preparing',
      requestSent: true,
      firstTokenReceived: false,
    })
    expect(waiting.find((stage) => stage.id === 'waiting')?.state).toBe('active')

    const writing = buildStreamStages({
      phase: 'streaming',
      requestSent: true,
      firstTokenReceived: true,
    })
    expect(writing.map((stage) => [stage.id, stage.state])).toEqual([
      ['brief', 'done'],
      ['waiting', 'done'],
      ['writing', 'active'],
      ['preview', 'pending'],
    ])
  })

  it('menampilkan penyiapan tampilan setelah event done', () => {
    const stages = buildStreamStages({
      phase: 'saving',
      requestSent: true,
      firstTokenReceived: true,
    })
    expect(stages.map((stage) => [stage.id, stage.state])).toEqual([
      ['brief', 'done'],
      ['waiting', 'done'],
      ['writing', 'done'],
      ['preview', 'active'],
    ])
  })
})
