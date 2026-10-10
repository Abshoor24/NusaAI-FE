import { describe, it, expect } from 'vitest'
import {
  SECTION_CATALOG,
  getSection,
  sectionLabel,
  defaultSectionsFor,
  toApiSectionNames,
  sanitizeSectionIds,
} from '@/lib/brief/sections-catalog'
import { API_LIMITS, MAX_SECTIONS, type BusinessCategoryId } from '@/lib/brief/types'

describe('sections-catalog: isi katalog', () => {
  it('setiap item punya id, label, description, apiName, defaultFor', () => {
    for (const item of SECTION_CATALOG) {
      expect(item.id, item.apiName).toMatch(/^[a-z-]+$/)
      expect(item.label.length).toBeGreaterThan(3)
      expect(item.description.length).toBeGreaterThan(10)
      expect(item.apiName.length).toBeLessThanOrEqual(API_LIMITS.sectionName)
      expect(Array.isArray(item.defaultFor)).toBe(true)
    }
  })

  it('id unik dan tidak lebih dari 13 item (agar muat <= 12 yang menyala)', () => {
    const ids = SECTION_CATALOG.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(SECTION_CATALOG.length).toBeGreaterThanOrEqual(12)
    expect(SECTION_CATALOG.length).toBeLessThanOrEqual(13)
  })

  it('terjemahan istilah teknis wajib ada', () => {
    const hero = getSection('hero')
    expect(hero?.label).toBe('Bagian pembuka (judul besar + tombol utama)')
    expect(hero?.apiName).toBe('hero')

    const cta = getSection('cta')
    expect(cta?.label).toBe('Tombol ajakan (mis. Pesan via WhatsApp)')
    expect(cta?.apiName.toLowerCase()).toContain('cta')

    const testimonials = getSection('testimonials')
    expect(testimonials?.label).toBe('Ulasan pelanggan')
    expect(testimonials?.apiName.toLowerCase()).toContain('testimoni')

    const faq = getSection('faq')
    expect(faq?.label).toBe('Pertanyaan yang sering ditanyakan')
    expect(faq?.apiName.toLowerCase()).toContain('faq')

    const footer = getSection('footer')
    expect(footer?.label).toBe('Penutup (kontak & media sosial)')
    expect(footer?.apiName).toBe('footer')
  })

  it('bagian tambahan wajib ada', () => {
    for (const id of ['about', 'menu', 'gallery', 'pricing', 'hours', 'howto', 'benefits', 'contact']) {
      expect(getSection(id), id).toBeDefined()
    }
  })

  it('TIDAK ada bagian yang butuh server', () => {
    const forbidden = ['form', 'formulir', 'login', 'masuk', 'cart', 'keranjang', 'bayar', 'payment', 'database', 'akun', 'checkout']
    for (const item of SECTION_CATALOG) {
      const haystack = `${item.id} ${item.label} ${item.description} ${item.apiName}`.toLowerCase()
      for (const word of forbidden) {
        expect(haystack, `${item.id} memuat "${word}"`).not.toContain(word)
      }
    }
  })

  it('id tak dikenal -> undefined', () => {
    expect(getSection('formulir-kontak')).toBeUndefined()
  })
})

describe('sectionLabel (label menyesuaikan kategori)', () => {
  it('bagian menu memakai label per kategori', () => {
    expect(sectionLabel('menu', 'kuliner')).toBe('Menu makanan')
    expect(sectionLabel('menu', 'fashion')).toBe('Katalog pakaian')
    expect(sectionLabel('menu', 'toko-online')).toBe('Daftar produk')
    expect(sectionLabel('menu', 'jasa')).toBe('Daftar layanan')
    expect(sectionLabel('menu', 'pendidikan')).toBe('Program kelas')
  })

  it('tanpa kategori memakai label umum', () => {
    expect(sectionLabel('menu', '')).toBe('Menu / Produk / Layanan')
    expect(sectionLabel('hero', 'kuliner')).toBe('Bagian pembuka (judul besar + tombol utama)')
  })

  it('id tak dikenal dikembalikan apa adanya', () => {
    expect(sectionLabel('tidak-ada', '')).toBe('tidak-ada')
  })
})

describe('defaultSectionsFor', () => {
  it('kategori tanpa default -> array kosong', () => {
    expect(defaultSectionsFor('')).toEqual([])
    expect(defaultSectionsFor('tidak-ada' as BusinessCategoryId)).toEqual([])
  })

  it('setiap kategori punya bagian pembuka & ajakan & kontak', () => {
    const categories: BusinessCategoryId[] = [
      'kuliner',
      'fashion',
      'jasa',
      'pendidikan',
      'kesehatan',
      'kreatif',
      'toko-online',
      'lainnya',
    ]
    for (const category of categories) {
      const sections = defaultSectionsFor(category)
      expect(sections.length, category).toBeGreaterThan(0)
      expect(sections.length, category).toBeLessThanOrEqual(MAX_SECTIONS)
      expect(sections, category).toContain('hero')
      expect(sections, category).toContain('cta')
      expect(sections, category).toContain('contact')
      expect(sections, category).toContain('footer')
    }
  })

  it('kuliner mendapat jam buka & lokasi; jasa mendapat cara pesan', () => {
    expect(defaultSectionsFor('kuliner')).toContain('hours')
    expect(defaultSectionsFor('kuliner')).toContain('menu')
    expect(defaultSectionsFor('jasa')).toContain('howto')
    expect(defaultSectionsFor('jasa')).toContain('faq')
    expect(defaultSectionsFor('toko-online')).toContain('pricing')
    expect(defaultSectionsFor('kreatif')).toContain('gallery')
  })

  it('hasil selalu dalam urutan katalog', () => {
    const order = SECTION_CATALOG.map((s) => s.id)
    const sections = defaultSectionsFor('kuliner')
    const positions = sections.map((id) => order.indexOf(id))
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })
})

describe('toApiSectionNames', () => {
  it('mengikuti urutan katalog', () => {
    expect(toApiSectionNames(['footer', 'hero'])).toEqual(['hero', 'footer'])
  })

  it('maksimal 12 item', () => {
    const all = SECTION_CATALOG.map((s) => s.id)
    expect(toApiSectionNames(all)).toHaveLength(Math.min(12, SECTION_CATALOG.length))
    expect(toApiSectionNames(all).length).toBeLessThanOrEqual(API_LIMITS.sections)
  })

  it('setiap item <= 50 karakter', () => {
    for (const name of toApiSectionNames(SECTION_CATALOG.map((s) => s.id))) {
      expect(name.length).toBeLessThanOrEqual(API_LIMITS.sectionName)
    }
  })

  it('dedup case-insensitive', () => {
    // id duplikat (termasuk beda huruf) menghasilkan satu nama API.
    expect(toApiSectionNames(['hero', 'HERO', 'Hero'])).toEqual(['hero'])
  })

  it('id tak dikenal dilewati', () => {
    expect(toApiSectionNames(['tidak-ada', 'hero', ''])).toEqual(['hero'])
  })

  it('daftar kosong -> array kosong', () => {
    expect(toApiSectionNames([])).toEqual([])
  })
})

describe('sanitizeSectionIds', () => {
  it('menyaring nilai bukan string dan id tak dikenal', () => {
    expect(sanitizeSectionIds(['hero', 42, null, 'formulir', 'about'])).toEqual(['hero', 'about'])
  })

  it('input bukan array -> array kosong', () => {
    expect(sanitizeSectionIds('hero')).toEqual([])
    expect(sanitizeSectionIds(null)).toEqual([])
    expect(sanitizeSectionIds(undefined)).toEqual([])
  })

  it('dedup dan batas 12', () => {
    const many = [...SECTION_CATALOG.map((s) => s.id), ...SECTION_CATALOG.map((s) => s.id)]
    const result = sanitizeSectionIds(many)
    expect(result.length).toBeLessThanOrEqual(MAX_SECTIONS)
    expect(new Set(result).size).toBe(result.length)
  })
})