import { describe, it, expect } from 'vitest'
import { parseDispositionFilename, sanitizeFilename, toProjectPage } from './projects'
import type { ProjectSummary } from '@/types/api'

function makeProject(id: string): ProjectSummary {
  return {
    id,
    title: `Project ${id}`,
    status: 'draft',
    brief: { description: 'Deskripsi cukup panjang untuk sebuah project.' },
    version_count: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

describe('toProjectPage', () => {
  it('tepat 20 item tanpa item ke-21 → hasMore false (regresi off-by-one)', () => {
    const fetched = Array.from({ length: 20 }, (_, i) => makeProject(`p${i}`))
    const page = toProjectPage(fetched, 20)
    expect(page.items).toHaveLength(20)
    expect(page.hasMore).toBe(false)
  })

  it('21 item (limit+1) → tampil 20 dan hasMore true', () => {
    const fetched = Array.from({ length: 21 }, (_, i) => makeProject(`p${i}`))
    const page = toProjectPage(fetched, 20)
    expect(page.items).toHaveLength(20)
    expect(page.items.map((p) => p.id)).toEqual(fetched.slice(0, 20).map((p) => p.id))
    expect(page.hasMore).toBe(true)
  })

  it('kurang dari limit → semua ditampilkan dan hasMore false', () => {
    const fetched = Array.from({ length: 5 }, (_, i) => makeProject(`p${i}`))
    const page = toProjectPage(fetched, 20)
    expect(page.items).toHaveLength(5)
    expect(page.hasMore).toBe(false)
  })

  it('kosong → halaman kosong dan hasMore false', () => {
    const page = toProjectPage([], 20)
    expect(page.items).toEqual([])
    expect(page.hasMore).toBe(false)
  })
})

describe('parseDispositionFilename', () => {
  const fallback = 'website-v1.html'

  it('header ASCII biasa → filename="..." dipakai', () => {
    expect(
      parseDispositionFilename('attachment; filename="kopi-senja-v1.html"', fallback),
    ).toBe('kopi-senja-v1.html')
  })

  it('filename* UTF-8 diprioritaskan dan di-decode', () => {
    expect(
      parseDispositionFilename(
        "attachment; filename*=UTF-8''kopi%20senja%20v1.html",
        fallback,
      ),
    ).toBe('kopi senja v1.html')
  })

  it('header gabungan → filename* menang atas filename biasa', () => {
    expect(
      parseDispositionFilename(
        'attachment; filename="jadul.html"; filename*=UTF-8\'\'baru.html',
        fallback,
      ),
    ).toBe('baru.html')
  })

  it('header kosong → fallback', () => {
    expect(parseDispositionFilename('', fallback)).toBe(fallback)
    expect(parseDispositionFilename('attachment', fallback)).toBe(fallback)
  })

  it('filename* rusak → jatuh ke filename biasa', () => {
    expect(
      parseDispositionFilename(
        'attachment; filename="aman.html"; filename*=UTF-8\'\'%E0%A4%A',
        fallback,
      ),
    ).toBe('aman.html')
  })
})

describe('sanitizeFilename', () => {
  it('membuang karakter terlarang', () => {
    expect(sanitizeFilename('a/b\\c:d*e?f"g<h>i|j.html')).toBe('abcdefghij.html')
  })

  it('string kosong setelah sanitasi → ""', () => {
    expect(sanitizeFilename('///')).toBe('')
  })
})
