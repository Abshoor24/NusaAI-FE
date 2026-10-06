import { describe, it, expect } from 'vitest'
import {
  buildProjectPayload,
  buildDescription,
  buildContactLine,
  buildStyle,
  buildColorPalette,
  buildWebsiteType,
  suggestWebsiteType,
  categoryLabel,
  goalLabel,
  STATIC_SITE_NOTE,
} from '@/lib/brief/build-payload'
import {
  createEmptyBrief,
  API_LIMITS,
  MAX_USER_DESCRIPTION,
  type BriefDraft,
} from '@/lib/brief/types'
import { toApiSectionNames, SECTION_CATALOG, defaultSectionsFor } from '@/lib/brief/sections-catalog'

function draft(patch: Partial<BriefDraft> = {}): BriefDraft {
  return { ...createEmptyBrief(), ...patch }
}

describe('build-payload: pemetaan field ke field API', () => {
  it('memetakan setiap field brief ke field API yang sesuai', () => {
    const result = buildProjectPayload(
      draft({
        title: '  Website Kopi Senja  ',
        description: 'Kedai kopi di Purwokerto dengan menu dan tombol pesan.',
        businessCategory: 'kuliner',
        goal: 'terima-pesanan',
        audience: 'Mahasiswa dan pekerja',
        brandName: '  Kopi Senja ',
        styles: ['Hangat', 'Minimalis'],
        colorMode: 'custom',
        primaryColor: '#6F4E37',
        accentColor: '#F5E6D3',
        websiteType: 'landing_page',
        language: 'id',
        sections: ['hero', 'menu', 'cta', 'contact'],
      }),
    )

    expect(result.payload.title).toBe('Website Kopi Senja')
    expect(result.payload.brief.business_name).toBe('Kopi Senja')
    expect(result.payload.brief.style).toBe('Hangat, Minimalis')
    expect(result.payload.brief.language).toBe('id')
    expect(result.payload.brief.website_type).toBe('landing_page')
    expect(result.payload.brief.sections).toEqual([
      'hero',
      'menu, produk, atau layanan',
      'tombol ajakan bertindak (cta)',
      'kontak',
    ])
    expect(result.payload.brief.color_palette).toBe(
      'warna utama: cokelat tua (#6F4E37); warna aksen: krem (#F5E6D3)',
    )
    expect(result.payload.brief.description).toContain('Kedai kopi di Purwokerto')
    expect(result.payload.brief.description).toContain('Jenis usaha: makanan dan minuman (kuliner).')
    expect(result.payload.brief.description).toContain(
      'Tujuan utama website: menerima pesanan dari pengunjung.',
    )
    expect(result.payload.brief.description).toContain('Target pengunjung: Mahasiswa dan pekerja.')
    expect(result.payload.brief.description).toContain(STATIC_SITE_NOTE)
    expect(result.trimmed).toBe(false)
  })

  it('colorMode "ai" menghasilkan color_palette undefined', () => {
    const result = buildProjectPayload(
      draft({
        description: 'Usaha jasa LegendaryDesain dengan portofolio karya.',
        colorMode: 'ai',
        primaryColor: '#6F4E37',
        accentColor: '#F5E6D3',
      }),
    )
    expect(result.payload.brief.color_palette).toBeUndefined()
    expect(buildColorPalette(draft({ colorMode: 'ai' }))).toBeUndefined()
  })

  it('colorMode "custom" tanpa hex valid tidak mengirim color_palette', () => {
    expect(buildColorPalette(draft({ colorMode: 'custom', primaryColor: '', accentColor: '' }))).toBeUndefined()
    expect(
      buildColorPalette(draft({ colorMode: 'custom', primaryColor: 'bukan-warna', accentColor: '' })),
    ).toBeUndefined()
  })

  it('field kosong tidak menghasilkan string kosong atau key kosong', () => {
    const result = buildProjectPayload(
      draft({ description: 'Usaha kecil yang baru mulai berjualan online.' }),
    )
    expect(result.payload.title).toBeUndefined()
    expect(result.payload.brief.business_name).toBeUndefined()
    expect(result.payload.brief.style).toBeUndefined()
    expect(result.payload.brief.color_palette).toBeUndefined()
    expect(result.payload.brief.language).toBeUndefined()
    expect(result.payload.brief.website_type).toBeUndefined()
    expect(result.payload.brief.sections).toBeUndefined()

    // Tidak ada nilai string kosong di seluruh payload.
    const values = [
      result.payload.title,
      result.payload.brief.business_name,
      result.payload.brief.style,
      result.payload.brief.color_palette,
      result.payload.brief.language,
      result.payload.brief.website_type,
    ]
    for (const value of values) {
      if (value !== undefined) expect(value).not.toBe('')
    }

    // Tidak ada baris label kosong seperti "Jenis usaha: ." di deskripsi.
    const lines = result.payload.brief.description
      .split('\n')
      .filter((line) => line.trim() !== '')
    // Tidak ada baris berlabel tanpa isi, mis. "Target pengunjung:".
    for (const line of lines) {
      expect(line).not.toMatch(/:\s*\.$/)
      expect(line).not.toMatch(/^[A-Z][a-z ]+:\s*$/)
    }
    // Tidak ada dua baris kosong berturut-turut (pemisah '\n\n' saja).
    expect(result.payload.brief.description).not.toMatch(/\n{3,}/)
  })

  it('memotong field yang melebihi batas backend', () => {
    const result = buildProjectPayload(
      draft({
        title: 'T'.repeat(300),
        brandName: 'B'.repeat(200),
        styles: ['S'.repeat(300)],
        description: 'Deskripsi yang cukup panjang untuk sebuah usaha kecil.',
      }),
    )
    expect(result.payload.title?.length).toBe(API_LIMITS.title)
    expect(result.payload.brief.business_name?.length).toBe(API_LIMITS.businessName)
    expect(result.payload.brief.style?.length).toBe(API_LIMITS.style)
  })

  it('website_type hanya diisi dari nilai yang diterima backend', () => {
    expect(buildWebsiteType(draft({ websiteType: '' }))).toBeUndefined()
    for (const value of ['landing_page', 'portfolio', 'company_profile', 'online_store', 'blog', 'other'] as const) {
      expect(buildWebsiteType(draft({ websiteType: value }))).toBe(value)
    }
    expect(suggestWebsiteType('toko-online')).toBe('online_store')
    expect(suggestWebsiteType('')).toBe('')
    // Semua saran kategori termasuk nilai yang sah.
    const categories = ['kuliner', 'fashion', 'jasa', 'pendidikan', 'kesehatan', 'kreatif', 'toko-online', 'lainnya'] as const
    for (const category of categories) {
      expect(['landing_page', 'portfolio', 'company_profile', 'online_store', 'blog', 'other']).toContain(
        suggestWebsiteType(category),
      )
    }
  })
})

describe('build-payload: gaya & warna', () => {
  it('gaya kosong -> undefined; gaya didedup case-insensitive', () => {
    expect(buildStyle(draft({ styles: [] }))).toBeUndefined()
    expect(buildStyle(draft({ styles: ['  ', ''] }))).toBeUndefined()
    expect(buildStyle(draft({ styles: ['Modern', 'modern', 'MODERN'] }))).toBe('Modern')
  })

  it('warna custom memakai nama warna + hex', () => {
    expect(
      buildColorPalette(draft({ colorMode: 'custom', primaryColor: '#1e3a8a', accentColor: '#d4af37' })),
    ).toBe('warna utama: biru laut (#1E3A8A); warna aksen: emas (#D4AF37)')
  })

  it('warna 3 digit dinormalkan ke 6 digit dan dinamai ulang', () => {
    expect(
      buildColorPalette(draft({ colorMode: 'custom', primaryColor: '#abc', accentColor: '' })),
    ).toBe('warna utama: perak (#AABBCC)')
  })
})

describe('build-payload: baris kontak', () => {
  it('tidak menghasilkan baris kontak bila semua kontak kosong', () => {
    expect(buildContactLine(draft())).toBe('')
    expect(buildContactLine(draft({ contact: { ...createEmptyBrief().contact, whatsapp: '  ' } }))).toBe('')
  })

  it('WhatsApp ditulis sebagai nomor internasional + tautan wa.me', () => {
    const line = buildContactLine(
      draft({
        contact: {
          ...createEmptyBrief().contact,
          whatsapp: '08123456789',
          instagram: '@kopisenja',
        },
      }),
    )
    expect(line).toContain('WhatsApp +628123456789 (https://wa.me/628123456789)')
    expect(line).toContain('Instagram @kopisenja')
  })

  it('hanya memuat kontak yang ada isinya (tidak ada label kosong)', () => {
    const line = buildContactLine(
      draft({ contact: { ...createEmptyBrief().contact, email: 'halo@contoh.id' } }),
    )
    expect(line).toBe('Kontak: email halo@contoh.id.')
    expect(line).not.toContain('WhatsApp')
    expect(line).not.toContain('peta')
  })
})

describe('build-payload: sections', () => {
  it('urutan mengikuti katalog, bukan urutan pilihan user', () => {
    const names = toApiSectionNames(['cta', 'hero', 'about'])
    expect(names).toEqual(['hero', 'about', 'tombol ajakan bertindak (cta)'])
  })

  it('membatasi 12 bagian dan_shield item 50 karakter', () => {
    const all = SECTION_CATALOG.map((s) => s.id)
    expect(toApiSectionNames(all)).toHaveLength(API_LIMITS.sections)
    for (const name of toApiSectionNames(all)) {
      expect(name.length).toBeLessThanOrEqual(API_LIMITS.sectionName)
    }
    for (const item of SECTION_CATALOG) {
      expect(item.apiName.length).toBeLessThanOrEqual(API_LIMITS.sectionName)
    }
  })

  it('id yang tidak dikenal diabaikan', () => {
    expect(toApiSectionNames(['hero', 'formulir', 'login'])).toEqual(['hero'])
  })

  it('kategori tanpa default_for -> array kosong', () => {
    // Semua kategori punya minimal satu default; kategori tak dikenal -> kosong.
    expect(defaultSectionsFor('')).toEqual([])
    expect(defaultSectionsFor('tidak-ada' as never)).toEqual([])
    expect(defaultSectionsFor('kuliner')).toContain('hero')
    expect(defaultSectionsFor('kuliner').length).toBeLessThanOrEqual(API_LIMITS.sections)
  })
})

describe('build-payload: panjang & pemangkasan description', () => {
  it('deskripsi pendek tetap memuat kalimat statis', () => {
    const { text, trimmed } = buildDescription(draft({ description: 'Kedai kopi kecil.' }))
    expect(trimmed).toBe(false)
    expect(text).toBe(`Kedai kopi kecil.\n\n${STATIC_SITE_NOTE}`)
  })

  it('tepat di batas 4000 karakter tidak dipangkas', () => {
    const note = STATIC_SITE_NOTE.length
    const user = 'a'.repeat(API_LIMITS.description - note - 2)
    const result = buildProjectPayload(draft({ description: user }))
    expect(result.descriptionLength).toBe(API_LIMITS.description)
    expect(result.trimmed).toBe(false)
  })

  it('satu karakter di atas batas: label dikurangi, kalimat user utuh', () => {
    const note = STATIC_SITE_NOTE.length
    const user = 'a'.repeat(API_LIMITS.description - note - 1)
    const result = buildDescription(
      draft({ description: user, audience: 'pelanggan', extraNotes: 'catatan' }),
    )
    expect(result.text.length).toBeLessThanOrEqual(API_LIMITS.description)
    expect(result.trimmed).toBe(true)
    expect(result.text.startsWith(user)).toBe(true)
    expect(result.text).toContain(STATIC_SITE_NOTE)
  })

  it('dipangkas dengan trimmed=true dan kalimat user tetap utuh', () => {
    const userSentence = 'Kedai kopi di Purwokerto dengan menu dan tombol pesan WhatsApp.'
    const user = `${userSentence} ${'b'.repeat(3600)}`
    const result = buildDescription(
      draft({
        description: user,
        extraNotes: 'Catatan yang perlu dipangkas lebih dulu karena prioritas terendah.',
        audience: 'Mahasiswa dan pekerja kantoran',
        contact: {
          ...createEmptyBrief().contact,
          whatsapp: '08123456789',
          address: 'Jl. Meranti No. 12',
          openingHours: 'Setiap hari 08.00-22.00',
        },
      }),
    )
    expect(result.trimmed).toBe(true)
    expect(result.text.length).toBeLessThanOrEqual(API_LIMITS.description)
    // Kalimat user tidak dipangkas.
    expect(result.text.startsWith(user.slice(0, 200))).toBe(true)
    expect(result.text).toContain(STATIC_SITE_NOTE)
    // Prioritas terendah dipangkas lebih dulu.
    expect(result.text).not.toContain('Catatan tambahan:')
  })

  it('user 3600 karakter (batas textarea UI) + semua baris label tetap <= 4000', () => {
    // Batas textarea di UI = MAX_USER_DESCRIPTION (3600), jadi kalimat user
    // tidak pernah perlu dipangkas walau semua baris label terisi.
    const user = 'u'.repeat(MAX_USER_DESCRIPTION)
    const result = buildDescription(
      draft({
        description: user,
        businessCategory: 'kuliner',
        goal: 'terima-pesanan',
        audience: 'Semua orang',
        contact: {
          ...createEmptyBrief().contact,
          whatsapp: '08123456789',
          phone: '08123456789',
          email: 'halo@contoh.id',
          address: 'Purwokerto',
          mapsUrl: 'https://maps.google.com/?q=x',
          openingHours: '08.00-22.00',
        },
        extraNotes: 'Catatan tambahan yang panjangnya tidak sampai lima puluh karakter.',
      }),
    )
    expect(result.text.length).toBeLessThanOrEqual(API_LIMITS.description)
    expect(result.trimmed).toBe(true)
    expect(result.text).toContain(STATIC_SITE_NOTE)
    // Blok label yang dipangkas, kalimat user tetap utuh di depan.
    expect(result.text.startsWith(user)).toBe(true)
  })

  it('jaring pengaman: user > 4000 karakter dipangkas dari ekor, catatan statis tetap ada', () => {
    // Kasus ini dicegah UI (textarea maxLength), tapi fungsi murni harus aman.
    const user = 'z'.repeat(4500)
    const result = buildDescription(draft({ description: user }))
    expect(result.text.length).toBeLessThanOrEqual(API_LIMITS.description)
    expect(result.trimmed).toBe(true)
    expect(result.text.endsWith(STATIC_SITE_NOTE)).toBe(true)
  })
})

describe('build-payload: snapshot payload lengkap kedai kopi', () => {
  it('snapshot', () => {
    const result = buildProjectPayload(
      draft({
        title: 'Website Kopi Senja',
        description:
          'Kedai kopi kecil di Purwokerto yang menyangrai kopinya sendiri. Buka jam 08.00 sampai 22.00, ada tempat duduk untuk bekerja, dan kami menerima pesanan biji kopi untuk pelanggan yang menyeduh di rumah.',
        businessCategory: 'kuliner',
        goal: 'terima-pesanan',
        audience: 'Mahasiswa dan pekerja yang butuh tempat tenang',
        brandName: 'Kopi Senja',
        styles: ['Hangat', 'Minimalis'],
        colorMode: 'custom',
        primaryColor: '#6F4E37',
        accentColor: '#F5E6D3',
        palettePreset: 'hangat',
        websiteType: 'landing_page',
        language: 'id',
        sections: ['hero', 'about', 'menu', 'hours', 'cta', 'contact', 'footer'],
        contact: {
          whatsapp: '081234567890',
          phone: '',
          email: 'halo@kopisenja.id',
          address: 'Jl. Meranti No. 12, Purwokerto',
          mapsUrl: 'https://maps.google.com/?q=Purwokerto',
          instagram: '@kopisenja',
          openingHours: 'Setiap hari, 08.00-22.00',
        },
      }),
    )
    expect({ ...result.payload, brief: { ...result.payload.brief } }).toMatchInlineSnapshot(`
      {
        "brief": {
          "business_name": "Kopi Senja",
          "color_palette": "warna utama: cokelat tua (#6F4E37); warna aksen: krem (#F5E6D3)",
          "description": "Kedai kopi kecil di Purwokerto yang menyangrai kopinya sendiri. Buka jam 08.00 sampai 22.00, ada tempat duduk untuk bekerja, dan kami menerima pesanan biji kopi untuk pelanggan yang menyeduh di rumah.

      Jenis usaha: makanan dan minuman (kuliner).

      Tujuan utama website: menerima pesanan dari pengunjung.

      Target pengunjung: Mahasiswa dan pekerja yang butuh tempat tenang.

      Kontak: WhatsApp +6281234567890 (https://wa.me/6281234567890); email halo@kopisenja.id; Instagram @kopisenja; alamat Jl. Meranti No. 12, Purwokerto; peta https://maps.google.com/?q=Purwokerto; jam buka Setiap hari, 08.00-22.00.

      Website berupa halaman statis. Tombol kontak memakai tautan WhatsApp/email/telepon, bukan formulir. Semua tautan eksternal dibuka di tab baru (target=_blank rel=noopener noreferrer).",
          "language": "id",
          "sections": [
            "hero",
            "about",
            "menu, produk, atau layanan",
            "jam buka dan lokasi",
            "tombol ajakan bertindak (cta)",
            "kontak",
            "footer",
          ],
          "style": "Hangat, Minimalis",
          "website_type": "landing_page",
        },
        "title": "Website Kopi Senja",
      }
    `)
  })
})

describe('build-payload: label kategori & tujuan', () => {
  it('label tak dikenal tetap informatif', () => {
    expect(categoryLabel('kuliner')).toContain('makanan')
    expect(categoryLabel('')).toBe('')
    expect(goalLabel('terima-pesanan')).toContain('menerima pesanan')
    expect(goalLabel('')).toBe('')
  })
})