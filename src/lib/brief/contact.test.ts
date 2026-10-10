import { describe, it, expect } from 'vitest'
import {
  normalizePhoneNumber,
  toWaMeUrl,
  toTelUrl,
  normalizeWebUrl,
  toInstagramUrl,
  instagramDisplay,
} from '@/lib/brief/contact'

describe('normalizePhoneNumber (aturan Indonesia)', () => {
  it('format 08xx -> +628xx', () => {
    expect(normalizePhoneNumber('08123456789')).toBe('+628123456789')
    expect(normalizePhoneNumber('0812-3456-789')).toBe('+628123456789')
    expect(normalizePhoneNumber('0812 3456 789')).toBe('+628123456789')
    expect(normalizePhoneNumber('(0812) 3456 789')).toBe('+628123456789')
  })

  it('format +62xx tetap', () => {
    expect(normalizePhoneNumber('+628123456789')).toBe('+628123456789')
    expect(normalizePhoneNumber('+62 812-3456-789')).toBe('+628123456789')
  })

  it('format 62xx tanpa plus tetap', () => {
    expect(normalizePhoneNumber('628123456789')).toBe('+628123456789')
  })

  it('format 0062xx dipangkas nolnya', () => {
    expect(normalizePhoneNumber('00628123456789')).toBe('+628123456789')
  })

  it('spasi, strip, dan strip join tidak mengganggu', () => {
    expect(normalizePhoneNumber('0812-3456-789 (WhatsApp)')).toBe('+628123456789')
    expect(normalizePhoneNumber('+62 812 3456 7890')).toBe('+6281234567890')
  })

  it('nomor luar negeri dianggap sudah internasional', () => {
    expect(normalizePhoneNumber('+14155552671')).toBe('+14155552671')
    expect(normalizePhoneNumber('14155552671')).toBe('+14155552671')
  })

  it('nomor terlalu pendek atau terlalu panjang ditolak', () => {
    expect(normalizePhoneNumber('0812')).toBeNull()
    expect(normalizePhoneNumber('12345')).toBeNull()
    expect(normalizePhoneNumber('1234567890123456')).toBeNull()
    expect(normalizePhoneNumber('')).toBeNull()
    expect(normalizePhoneNumber('   ')).toBeNull()
    expect(normalizePhoneNumber('bukan-nomor')).toBeNull()
  })

  it('9 digit adalah batas bawah yang diterima', () => {
    expect(normalizePhoneNumber('123456789')).toBe('+123456789')
  })
})

describe('toWaMeUrl (digit saja, tanpa "+")', () => {
  it('0812 -> https://wa.me/628123456789', () => {
    expect(toWaMeUrl('08123456789')).toBe('https://wa.me/628123456789')
  })

  it('+62812 -> https://wa.me/628123456789', () => {
    expect(toWaMeUrl('+628123456789')).toBe('https://wa.me/628123456789')
  })

  it('62812 -> https://wa.me/628123456789', () => {
    expect(toWaMeUrl('628123456789')).toBe('https://wa.me/628123456789')
  })

  it('dengan spasi dan strip', () => {
    expect(toWaMeUrl('0812-3456-789')).toBe('https://wa.me/628123456789')
    expect(toWaMeUrl('0812 3456 789')).toBe('https://wa.me/628123456789')
    expect(toWaMeUrl(' +62 812 3456 789 ')).toBe('https://wa.me/628123456789')
  })

  it('URL yang sudah jadi wa.me dipertahankan', () => {
    expect(toWaMeUrl('https://wa.me/628123456789')).toBe('https://wa.me/628123456789')
  })

  it('nomor tidak valid -> null', () => {
    expect(toWaMeUrl('0812')).toBeNull()
    expect(toWaMeUrl('')).toBeNull()
  })

  it('tidak pernah mengandung "+" di path', () => {
    const url = toWaMeUrl('+62 812 3456 789')
    expect(url).not.toContain('+')
    expect(url).toMatch(/^https:\/\/wa\.me\/\d+$/)
  })
})

describe('toTelUrl', () => {
  it('menghasilkan skema tel:', () => {
    expect(toTelUrl('08123456789')).toBe('tel:+628123456789')
    expect(toTelUrl('+628123456789')).toBe('tel:+628123456789')
  })

  it('nomor tidak valid -> null', () => {
    expect(toTelUrl('123')).toBeNull()
  })
})

describe('normalizeWebUrl', () => {
  it('http dan https diterima', () => {
    expect(normalizeWebUrl('https://maps.google.com/?q=surabaya')).toBe(
      'https://maps.google.com/?q=surabaya',
    )
    expect(normalizeWebUrl('http://contoh.id')).toBe('http://contoh.id/')
  })

  it('skema lain dan teks bebas ditolak', () => {
    expect(normalizeWebUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeWebUrl('contoh.id')).toBeNull()
    expect(normalizeWebUrl('')).toBeNull()
  })

  it('spasi di sekitar URL dibuang', () => {
    expect(normalizeWebUrl('  https://maps.app.goo.gl/abc  ')).toBe(
      'https://maps.app.goo.gl/abc',
    )
  })
})

describe('Instagram', () => {
  it('@nama -> URL', () => {
    expect(toInstagramUrl('@kopisenja')).toBe('https://instagram.com/kopisenja')
  })

  it('nama tanpa @ -> URL', () => {
    expect(toInstagramUrl('kopisenja')).toBe('https://instagram.com/kopisenja')
  })

  it('URL lengkap dipertahankan', () => {
    expect(toInstagramUrl('https://instagram.com/kopisenja')).toBe(
      'https://instagram.com/kopisenja',
    )
  })

  it('nilai tidak dikenal -> null', () => {
    expect(toInstagramUrl('a')).toBeNull()
    expect(toInstagramUrl('https://contoh.id/profil')).toBe('https://contoh.id/profil')
  })

  it('display: @nama tetap @nama', () => {
    expect(instagramDisplay('@kopisenja')).toBe('@kopisenja')
    expect(instagramDisplay('kopisenja')).toBe('@kopisenja')
    expect(instagramDisplay('https://instagram.com/kopisenja')).toBe('@kopisenja')
    expect(instagramDisplay('')).toBe('')
  })
})