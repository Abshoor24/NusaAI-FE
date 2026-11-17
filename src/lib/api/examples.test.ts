import { describe, expect, it } from 'vitest'
import { ApiError } from './client'
import { exampleScore, pickExample, shouldShowExampleFallback } from './examples'
import type { ExampleSite } from '@/types/api'

const sites: ExampleSite[] = [
  { slug: 'kuliner', category: 'kuliner', title: 'Kopi Arum', description: '', label: 'Contoh hasil' },
  { slug: 'jasa', category: 'jasa', title: 'Bengkel Jaya Motor', description: '', label: 'Contoh hasil' },
  { slug: 'toko', category: 'toko', title: 'Toko Melati', description: '', label: 'Contoh hasil' },
  {
    slug: 'portofolio',
    category: 'portofolio',
    title: 'Ruang Karya',
    description: '',
    label: 'Contoh hasil',
  },
  { slug: 'acara', category: 'acara', title: 'Pesta Rasa', description: '', label: 'Contoh hasil' },
]

describe('pickExample', () => {
  it('memetakan website_type portofolio ke contoh portofolio', () => {
    const picked = pickExample(sites, { website_type: 'portfolio', description: '' })
    expect(picked?.slug).toBe('portofolio')
  })

  it('memetakan toko online ke contoh toko', () => {
    const picked = pickExample(sites, { website_type: 'online_store', description: '' })
    expect(picked?.slug).toBe('toko')
  })

  it('memakai kata kunci brief saat website_type umum', () => {
    const picked = pickExample(sites, {
      website_type: 'landing_page',
      description: 'Festival kuliner dengan jadwal acara dan tiket masuk gratis.',
    })
    expect(picked?.slug).toBe('acara')
  })

  it('membedakan jasa bengkel dari kuliner', () => {
    const picked = pickExample(sites, {
      website_type: 'company_profile',
      description: 'Jenis usaha: jasa. Bengkel motor dengan servis mesin dan ganti oli.',
    })
    expect(picked?.slug).toBe('jasa')
  })

  it('mengembalikan contoh pertama secara stabil bila tidak ada petunjuk', () => {
    const picked = pickExample(sites, { description: 'website sederhana' })
    expect(picked?.slug).toBe('kuliner')
  })

  it('memberi skor lebih tinggi pada kategori yang cocok', () => {
    const acara = sites.find((site) => site.slug === 'acara')!
    const toko = sites.find((site) => site.slug === 'toko')!
    const input = { description: 'acara festival dan tiket' }
    expect(exampleScore(acara, input)).toBeGreaterThan(exampleScore(toko, input))
  })
})

describe('shouldShowExampleFallback', () => {
  it('tampil untuk AI_BUSY dan kuota habis', () => {
    expect(
      shouldShowExampleFallback(new ApiError(503, 'Server AI sedang ramai.', 'AI_BUSY')),
    ).toBe(true)
  })

  it('tampil untuk timeout dan provider overloaded', () => {
    expect(
      shouldShowExampleFallback(
        new ApiError(502, 'timeout', 'AI_PROVIDER_ERROR', { reason: 'STREAM_TIMEOUT' }),
      ),
    ).toBe(true)
    expect(
      shouldShowExampleFallback(
        new ApiError(502, 'overloaded', 'AI_PROVIDER_ERROR', {
          reason: 'PROVIDER_OVERLOADED',
        }),
      ),
    ).toBe(true)
  })

  it('tidak tampil untuk error validasi, filter keamanan, atau null', () => {
    expect(
      shouldShowExampleFallback(new ApiError(400, 'invalid', 'VALIDATION_ERROR')),
    ).toBe(false)
    expect(
      shouldShowExampleFallback(
        new ApiError(502, 'blocked', 'AI_PROVIDER_ERROR', { reason: 'OUTPUT_BLOCKED' }),
      ),
    ).toBe(false)
    expect(shouldShowExampleFallback(null)).toBe(false)
  })
})
