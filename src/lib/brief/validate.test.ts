import { describe, it, expect } from 'vitest'
import {
  validateBrief,
  validateContact,
  isValidInstagram,
  BRIEF_TEXT_LIMITS,
} from '@/lib/brief/validate'
import { createEmptyBrief, type BriefDraft } from '@/lib/brief/types'

function draft(patch: Partial<BriefDraft> = {}): BriefDraft {
  return { ...createEmptyBrief(), ...patch }
}

const VALID_DESCRIPTION = 'Kedai kopi kecil di Purwokerto dengan menu dan tombol pesan.'

describe('validateBrief: deskripsi (wajib)', () => {
  it('deskripsi kosong menghasilkan error', () => {
    const errors = validateBrief(draft())
    expect(errors.description).toMatch(/minimal 10 karakter/)
  })

  it('deskripsi 9 karakter ditolak, 10 diterima', () => {
    expect(validateBrief(draft({ description: 'a'.repeat(9) })).description).toBeDefined()
    expect(validateBrief(draft({ description: 'a'.repeat(10) })).description).toBeUndefined()
  })

  it('deskripsi di atas batas maksimum ditolak', () => {
    expect(
      validateBrief(draft({ description: 'a'.repeat(3601) })).description,
    ).toMatch(/maksimal 3600 karakter/)
    expect(
      validateBrief(draft({ description: 'a'.repeat(3600) })).description,
    ).toBeUndefined()
  })

  it('batas minimum & maksimum bisa dioverride', () => {
    expect(
      validateBrief(draft({ description: 'pendek' }), {
        minDescriptionLength: 3,
        maxDescriptionLength: 100,
      }).description,
    ).toBeUndefined()
  })
})

describe('validateBrief: panjang field bebas', () => {
  it('judul, nama usaha, target, catatan, alamat, jam buka', () => {
    expect(validateBrief(draft({ title: 'T'.repeat(201) })).title).toBeDefined()
    expect(validateBrief(draft({ brandName: 'B'.repeat(121) })).brandName).toBeDefined()
    expect(validateBrief(draft({ audience: 'A'.repeat(201) })).audience).toBeDefined()
    expect(validateBrief(draft({ extraNotes: 'N'.repeat(1001) })).extraNotes).toBeDefined()
    expect(
      validateBrief(draft({ contact: { ...createEmptyBrief().contact, address: 'a'.repeat(201) } }))
        .address,
    ).toBeDefined()
    expect(
      validateBrief(draft({ contact: { ...createEmptyBrief().contact, openingHours: 'j'.repeat(121) } }))
        .openingHours,
    ).toBeDefined()
  })

  it('nilai tepat di batas diterima', () => {
    const errors = validateBrief(
      draft({
        title: 'T'.repeat(BRIEF_TEXT_LIMITS.title),
        brandName: 'B'.repeat(BRIEF_TEXT_LIMITS.brandName),
        audience: 'A'.repeat(BRIEF_TEXT_LIMITS.audience),
        extraNotes: 'N'.repeat(BRIEF_TEXT_LIMITS.extraNotes),
        description: VALID_DESCRIPTION,
      }),
    )
    expect(errors).toEqual({})
  })
})

describe('validateBrief: warna', () => {
  it('colorMode "ai" tidak memvalidasi hex', () => {
    const errors = validateBrief(
      draft({ description: VALID_DESCRIPTION, colorMode: 'ai', primaryColor: 'bukan warna' }),
    )
    expect(errors.primaryColor).toBeUndefined()
    expect(errors.accentColor).toBeUndefined()
  })

  it('colorMode "custom" menolak hex tidak valid', () => {
    const errors = validateBrief(
      draft({
        description: VALID_DESCRIPTION,
        colorMode: 'custom',
        primaryColor: 'cokelat gelap',
        accentColor: 'biru dongker',
      }),
    )
    expect(errors.primaryColor).toMatch(/kode warna/)
    expect(errors.accentColor).toMatch(/kode warna/)
  })

  it('hex valid diterima (3 dan 6 digit)', () => {
    const errors = validateBrief(
      draft({
        description: VALID_DESCRIPTION,
        colorMode: 'custom',
        primaryColor: '#abc',
        accentColor: 'F5E6D3',
      }),
    )
    expect(errors.primaryColor).toBeUndefined()
    expect(errors.accentColor).toBeUndefined()
  })

  it('warna kosong tidak error (pengguna boleh mengosongkan satu warna)', () => {
    const errors = validateBrief(
      draft({ description: VALID_DESCRIPTION, colorMode: 'custom', primaryColor: '', accentColor: '' }),
    )
    expect(errors.primaryColor).toBeUndefined()
    expect(errors.accentColor).toBeUndefined()
  })
})

describe('validateContact', () => {
  const base = { whatsapp: '', phone: '', email: '', mapsUrl: '', instagram: '' }

  it('kontak kosong tidak menghasilkan error', () => {
    expect(validateContact(base)).toEqual({})
  })

  it('WhatsApp: 0812, +62812, 62812, dan berformat aneh diterima', () => {
    for (const value of ['08123456789', '+628123456789', '628123456789', '0812-3456-789', '0812 3456 789']) {
      expect(validateContact({ ...base, whatsapp: value }).whatsapp, value).toBeUndefined()
    }
  })

  it('WhatsApp terlalu pendek ditolak dengan pesan Indonesia', () => {
    const errors = validateContact({ ...base, whatsapp: '0812' })
    expect(errors.whatsapp).toMatch(/belum lengkap/)
    expect(errors.whatsapp).toMatch(/08123456789/)
  })

  it('telepon sama aturan dengan WhatsApp', () => {
    expect(validateContact({ ...base, phone: '08123456789' }).phone).toBeUndefined()
    expect(validateContact({ ...base, phone: '123' }).phone).toBeDefined()
  })

  it('email harus punya @ dan titik', () => {
    expect(validateContact({ ...base, email: 'halo@contoh.id' }).email).toBeUndefined()
    expect(validateContact({ ...base, email: 'halo.contoh.id' }).email).toBeDefined()
    expect(validateContact({ ...base, email: 'halo@contoh' }).email).toBeDefined()
    expect(validateContact({ ...base, email: 'halo @contoh.id' }).email).toBeDefined()
  })

  it('tautan lokasi hanya http/https', () => {
    expect(validateContact({ ...base, mapsUrl: 'https://maps.google.com/?q=x' }).mapsUrl).toBeUndefined()
    expect(validateContact({ ...base, mapsUrl: 'http://maps.app.goo.gl/x' }).mapsUrl).toBeUndefined()
    expect(validateContact({ ...base, mapsUrl: 'javascript:alert(1)' }).mapsUrl).toBeDefined()
    expect(validateContact({ ...base, mapsUrl: 'maps.google.com' }).mapsUrl).toBeDefined()
  })

  it('Instagram: @nama, nama, URL', () => {
    expect(validateContact({ ...base, instagram: '@kopisenja' }).instagram).toBeUndefined()
    expect(validateContact({ ...base, instagram: 'kopisenja' }).instagram).toBeUndefined()
    expect(validateContact({ ...base, instagram: 'https://instagram.com/kopisenja' }).instagram).toBeUndefined()
    expect(validateContact({ ...base, instagram: 'a' }).instagram).toBeDefined()
    expect(isValidInstagram('@toko_seru')).toBe(true)
    expect(isValidInstagram('!')).toBe(false)
  })
})

describe('validateBrief: gabung semua aturan', () => {
  it('draft kosong hanya error deskripsi', () => {
    expect(Object.keys(validateBrief(draft()))).toEqual(['description'])
  })

  it('mengumpulkan beberapa error sekaligus', () => {
    const errors = validateBrief(
      draft({
        description: 'pendek',
        colorMode: 'custom',
        primaryColor: 'cokelat tua',
        accentColor: 'biru dongker',
        contact: {
          ...createEmptyBrief().contact,
          whatsapp: '0812',
          email: 'salah',
        },
      }),
    )
    expect(Object.keys(errors).sort()).toEqual(
      ['accentColor', 'description', 'email', 'primaryColor', 'whatsapp'].sort(),
    )
  })

  it('draft minimal yang valid lolos', () => {
    expect(validateBrief(draft({ description: VALID_DESCRIPTION }))).toEqual({})
  })
})