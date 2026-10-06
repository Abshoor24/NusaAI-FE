import { describe, it, expect } from 'vitest'
import {
  BRIEF_TEMPLATES,
  getTemplate,
  applyTemplate,
  draftFromTemplate,
  paletteColors,
} from '@/lib/brief/templates'
import { createEmptyBrief, MAX_STYLES, MAX_SECTIONS } from '@/lib/brief/types'
import { PALETTE_PRESETS } from '@/lib/brief/palettes'
import { computeCompleteness, STYLE_OPTIONS } from '@/lib/brief'
import { buildProjectPayload } from '@/lib/brief/build-payload'
import { isHexColor } from '@/lib/brief/color-names'

describe('templates: isi katalog', () => {
  it('ada 5-6 template dengan id unik', () => {
    expect(BRIEF_TEMPLATES.length).toBeGreaterThanOrEqual(5)
    expect(BRIEF_TEMPLATES.length).toBeLessThanOrEqual(6)
    const ids = BRIEF_TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('setiap template mengisi sebagian draft dengan nilai valid', () => {
    for (const template of BRIEF_TEMPLATES) {
      expect(template.label.length).toBeGreaterThan(3)
      expect(template.description.length).toBeGreaterThan(10)
      expect(template.icon.length).toBeGreaterThan(2)

      const draft = draftFromTemplate(template)
      expect(draft.businessCategory, template.id).not.toBe('')
      expect(draft.goal, template.id).not.toBe('')
      expect(draft.description.length, template.id).toBeGreaterThan(10)
      expect(draft.styles.length, template.id).toBeLessThanOrEqual(MAX_STYLES)
      expect(draft.sections.length, template.id).toBeLessThanOrEqual(MAX_SECTIONS)
      expect(draft.sections.length, template.id).toBeGreaterThan(0)
      expect(isHexColor(draft.primaryColor), template.id).toBe(true)
      expect(isHexColor(draft.accentColor), template.id).toBe(true)

      // Gaya harus berasal dari opsi yang ditawarkan.
      for (const style of draft.styles) {
        expect(STYLE_OPTIONS as readonly string[]).toContain(style)
      }
      // Kontak: WhatsApp harus bisa dinormalisasi.
      expect(draft.contact.whatsapp.length, template.id).toBeGreaterThan(0)
    }
  })

  it('getTemplate id tak dikenal -> undefined', () => {
    expect(getTemplate('tidak-ada')).toBeUndefined()
    expect(getTemplate('kedai-kopi')?.label).toBe('Kedai kopi')
  })
})

describe('applyTemplate', () => {
  const template = getTemplate('kedai-kopi')!

  it('mengisi draft kosong', () => {
    const draft = applyTemplate(createEmptyBrief(), template)
    expect(draft.businessCategory).toBe('kuliner')
    expect(draft.goal).toBe('terima-pesanan')
    expect(draft.description).toContain('Kedai kopi')
    expect(draft.colorMode).toBe('custom')
  })

  it('TIDAK menimpa deskripsi yang sudah diisi user', () => {
    const current = { ...createEmptyBrief(), description: 'Deskripsi saya sendiri.' }
    const draft = applyTemplate(current, template)
    expect(draft.description).toBe('Deskripsi saya sendiri.')
  })

  it('TIDAK menimpa kategori/tujuan yang sudah dipilih', () => {
    const current = { ...createEmptyBrief(), businessCategory: 'kreatif' as const, goal: 'pamerkan-karya' as const }
    const draft = applyTemplate(current, template)
    expect(draft.businessCategory).toBe('kreatif')
    expect(draft.goal).toBe('pamerkan-karya')
  })

  it('TIDAK menimpa gaya & bagian yang sudah dipilih', () => {
    const current = { ...createEmptyBrief(), styles: ['Mewah'], sections: ['hero', 'about'] }
    const draft = applyTemplate(current, template)
    expect(draft.styles).toEqual(['Mewah'])
    expect(draft.sections).toEqual(['hero', 'about'])
  })

  it('mengisi kontak yang masih kosong saja', () => {
    const current = {
      ...createEmptyBrief(),
      contact: { ...createEmptyBrief().contact, whatsapp: '089999999999' },
    }
    const draft = applyTemplate(current, template)
    expect(draft.contact.whatsapp).toBe('089999999999')
    expect(draft.contact.email).toBe('halo@kopisenja.id')
  })

  it('semua template menghasilkan payload yang bisa dikirim', () => {
    for (const t of BRIEF_TEMPLATES) {
      const result = buildProjectPayload(draftFromTemplate(t))
      expect(result.payload.brief.description.length, t.id).toBeGreaterThan(10)
      expect(result.payload.brief.description.length, t.id).toBeLessThanOrEqual(4000)
      expect(result.payload.brief.sections?.length, t.id).toBeLessThanOrEqual(MAX_SECTIONS)
    }
  })
})

describe('paletteColors', () => {
  it('mengembalikan warna utama & aksen', () => {
    expect(paletteColors('hangat')).toEqual({ primary: '#6F4E37', accent: '#F5E6D3' })
  })

  it('id tak dikenal -> null', () => {
    expect(paletteColors('tidak-ada')).toBeNull()
  })

  it('ada 6-8 palet dengan nama & hex valid', () => {
    expect(PALETTE_PRESETS.length).toBeGreaterThanOrEqual(6)
    expect(PALETTE_PRESETS.length).toBeLessThanOrEqual(8)
    for (const palette of PALETTE_PRESETS) {
      expect(palette.label.length).toBeGreaterThan(2)
      expect(isHexColor(palette.primary), palette.id).toBe(true)
      expect(isHexColor(palette.accent), palette.id).toBe(true)
    }
    expect(new Set(PALETTE_PRESETS.map((p) => p.id)).size).toBe(PALETTE_PRESETS.length)
  })
})

describe('computeCompleteness', () => {
  it('draft kosong = 0% dengan saran pertama', () => {
    const result = computeCompleteness(createEmptyBrief())
    expect(result.percent).toBe(0)
    expect(result.label).toBe('Brief 0% lengkap')
    expect(result.nextStep).toMatch(/deskripsi singkat/i)
  })

  it('hanya deskripsi panjang = 40%', () => {
    const result = computeCompleteness({
      ...createEmptyBrief(),
      description: 'Kedai kopi kecil di Purwokerto dengan menu dan tombol pesan WhatsApp.',
    })
    expect(result.percent).toBe(40)
  })

  it('bertambah sesuai isi', () => {
    const draft = {
      ...createEmptyBrief(),
      description: 'Kedai kopi kecil di Purwokerto dengan menu dan tombol pesan WhatsApp.',
      businessCategory: 'kuliner' as const,
      goal: 'terima-pesanan' as const,
    }
    expect(computeCompleteness(draft).percent).toBe(60)
    expect(
      computeCompleteness({ ...draft, brandName: 'Kopi Senja', styles: ['Hangat'] }).percent,
    ).toBe(80)
    expect(
      computeCompleteness({ ...draft, sections: ['hero', 'cta'], contact: { ...createEmptyBrief().contact, whatsapp: '08123456789' } }).percent,
    ).toBe(80)
    expect(
      computeCompleteness({
        ...draft,
        brandName: 'Kopi Senja',
        styles: ['Hangat'],
        sections: ['hero', 'cta'],
        contact: { ...createEmptyBrief().contact, whatsapp: '08123456789' },
      }).percent,
    ).toBe(100)
  })

  it('tidak melebihi 100 dan tidak negatif', () => {
    const maxed = computeCompleteness({
      ...createEmptyBrief(),
      description: 'a'.repeat(4000),
      businessCategory: 'kuliner',
      goal: 'terima-pesanan',
      brandName: 'Kopi Senja',
      styles: ['Hangat'],
      sections: ['hero', 'cta', 'contact'],
      contact: { ...createEmptyBrief().contact, whatsapp: '08123456789' },
    })
    expect(maxed.percent).toBe(100)
    expect(maxed.nextStep).toBe('')
  })

  it('deskripsi pendek di antara 10-40 hanya dapat 20 poin deskripsi', () => {
    const result = computeCompleteness({ ...createEmptyBrief(), description: 'Kedai kopi.' })
    expect(result.percent).toBe(20)
    expect(result.nextStep).toMatch(/masih pendek/i)
  })

  it('butir yang selesai ditandai true', () => {
    const result = computeCompleteness({
      ...createEmptyBrief(),
      description: 'Kedai kopi kecil di Purwokerto dengan menu dan tombol pesan WhatsApp.',
      businessCategory: 'kuliner',
    })
    expect(result.items.filter((i) => i.done).map((i) => i.label)).toContain('Jenis usaha dipilih')
    expect(result.items.filter((i) => !i.done).map((i) => i.label)).toContain('Tujuan website dipilih')
  })
})

describe('STYLE_OPTIONS', () => {
  it('memuat gaya berbahasa Indonesia', () => {
    expect(STYLE_OPTIONS.length).toBeGreaterThanOrEqual(8)
    for (const style of STYLE_OPTIONS) {
      expect(style).toMatch(/^[A-Z][a-z]+$/)
    }
    expect(new Set(STYLE_OPTIONS).size).toBe(STYLE_OPTIONS.length)
  })
})