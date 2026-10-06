import { describe, it, expect } from 'vitest'
import { BRIEF_SAMPLES, getSample } from '../fixtures/brief-samples'
import { buildProjectPayload, buildDescription } from '@/lib/brief/build-payload'
import { validateBrief } from '@/lib/brief/validate'
import { toApiSectionNames, SECTION_CATALOG } from '@/lib/brief/sections-catalog'
import { API_LIMITS } from '@/lib/brief/types'
import { STYLE_OPTIONS } from '@/lib/brief'
import { isHexColor } from '@/lib/brief/color-names'

/**
 * Delapan contoh brief di fixtures/brief-samples.ts adalah bahan evaluasi
 * Tahap 2, jadi nilainya harus benar-benar bisa dikirim ke backend.
 */

describe('fixtures/brief-samples', () => {
  it('ada 8 contoh dengan id unik', () => {
    expect(BRIEF_SAMPLES).toHaveLength(8)
    const ids = BRIEF_SAMPLES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(getSample('kedai-kopi')?.label).toBe('Kedai kopi')
    expect(getSample('tidak-ada')).toBeUndefined()
  })

  it('SETIAP contoh lolos validasi klien tanpa error', () => {
    for (const sample of BRIEF_SAMPLES) {
      expect(validateBrief(sample.draft), sample.id).toEqual({})
    }
  })

  it('SETIAP contoh menghasilkan payload yang memenuhi semua batas backend', () => {
    for (const sample of BRIEF_SAMPLES) {
      const { payload, trimmed } = buildProjectPayload(sample.draft)
      const brief = payload.brief

      expect(brief.description.length, sample.id).toBeLessThanOrEqual(API_LIMITS.description)
      expect(brief.description.length, sample.id).toBeGreaterThanOrEqual(
        API_LIMITS.descriptionMin,
      )
      expect(trimmed, `${sample.id} tidak seharusnya perlu dipangkas`).toBe(false)

      if (payload.title !== undefined) {
        expect(payload.title.length, sample.id).toBeLessThanOrEqual(API_LIMITS.title)
      }
      if (brief.business_name !== undefined) {
        expect(brief.business_name.length, sample.id).toBeLessThanOrEqual(
          API_LIMITS.businessName,
        )
      }
      if (brief.style !== undefined) {
        expect(brief.style.length, sample.id).toBeLessThanOrEqual(API_LIMITS.style)
      }
      if (brief.color_palette !== undefined) {
        expect(brief.color_palette.length, sample.id).toBeLessThanOrEqual(
          API_LIMITS.colorPalette,
        )
      }
      if (brief.sections !== undefined) {
        expect(brief.sections.length, sample.id).toBeLessThanOrEqual(API_LIMITS.sections)
        for (const name of brief.sections) {
          expect(name.length, `${sample.id}: ${name}`).toBeLessThanOrEqual(
            API_LIMITS.sectionName,
          )
        }
      }
      if (brief.language !== undefined) {
        expect(['id', 'en'], sample.id).toContain(brief.language)
      }
      if (brief.website_type !== undefined) {
        expect(
          ['landing_page', 'portfolio', 'company_profile', 'online_store', 'blog', 'other'],
          sample.id,
        ).toContain(brief.website_type)
      }
    }
  })

  it('tidak ada nilai string kosong di payload mana pun', () => {
    for (const sample of BRIEF_SAMPLES) {
      const { payload } = buildProjectPayload(sample.draft)
      const walk = (value: unknown, path: string): void => {
        if (typeof value === 'string') {
          expect(value.trim(), `${sample.id} @ ${path}`).not.toBe('')
        } else if (Array.isArray(value)) {
          value.forEach((item, i) => walk(item, `${path}[${i}]`))
        } else if (value && typeof value === 'object') {
          for (const [k, v] of Object.entries(value)) {
            expect(v, `${sample.id} @ ${path}.${k} null`).not.toBeNull()
            walk(v, `${path}.${k}`)
          }
        }
      }
      walk(payload, 'payload')
    }
  })

  it('memuat kalimat statis & tidak menawarkan fitur yang butuh server', () => {
    const forbidden = ['formulir', 'login', 'keranjang', 'pembayaran', 'checkout', 'database']
    for (const sample of BRIEF_SAMPLES) {
      const { text } = buildDescription(sample.draft)
      expect(text, sample.id).toContain('Website berupa halaman statis')
      expect(text, sample.id).toContain('bukan formulir')
      const lower = text.toLowerCase()
      // "bukan formulir" memang boleh muncul; yang dilarang adalah menawarkan.
      for (const word of forbidden) {
        const occurrences = lower.split(word).length - 1
        if (word === 'formulir') {
          expect(occurrences, sample.id).toBeLessThanOrEqual(2)
        } else {
          expect(occurrences, `${sample.id} memuat "${word}"`).toBe(0)
        }
      }
    }
  })

  it('warna manual memakai hex valid & gaya dari daftar yang ditawarkan', () => {
    for (const sample of BRIEF_SAMPLES) {
      if (sample.draft.colorMode !== 'custom') continue
      expect(isHexColor(sample.draft.primaryColor), sample.id).toBe(true)
      expect(isHexColor(sample.draft.accentColor), sample.id).toBe(true)
      for (const style of sample.draft.styles) {
        expect(STYLE_OPTIONS as readonly string[], `${sample.id}: ${style}`).toContain(style)
      }
      expect(sample.draft.styles.length, sample.id).toBeLessThanOrEqual(3)
    }
  })

  it('bagian yang dipilih berasal dari katalog dan tidak melebihi 12 item', () => {
    for (const sample of BRIEF_SAMPLES) {
      const names = toApiSectionNames(sample.draft.sections)
      expect(names.length, sample.id).toBeLessThanOrEqual(API_LIMITS.sections)
      // Tiap id katalog menghasilkan tepat satu nama API.
      const unknown = sample.draft.sections.filter(
        (id) => !SECTION_CATALOG.some((s) => s.id === id),
      )
      expect(unknown, `${sample.id} memakai id tak dikenal`).toEqual([])
      // Kalau draft punya > 12 bagian, pemetaan tetap memangkas ke 12 (sudah
      // diuji di build-payload.test.ts); di bawah 12, tidak ada yang hilang.
      expect(names.length, sample.id).toBe(Math.min(sample.draft.sections.length, 12))
    }
  })

  it('deskripsi setiap contoh cukup informatif (>= 100 karakter)', () => {
    for (const sample of BRIEF_SAMPLES) {
      expect(sample.draft.description.length, sample.id).toBeGreaterThanOrEqual(100)
      expect(sample.draft.businessCategory, sample.id).not.toBe('')
      expect(sample.draft.goal, sample.id).not.toBe('')
    }
  })

  it('setiap contoh punya minimal satu cara kontak yang bisa diklik', () => {
    for (const sample of BRIEF_SAMPLES) {
      const c = sample.draft.contact
      const hasContact = Boolean(c.whatsapp || c.phone || c.email || c.mapsUrl)
      expect(hasContact, sample.id).toBe(true)
    }
  })
})