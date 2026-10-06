import { describe, it, expect } from 'vitest'
import {
  describeColor,
  describeColorText,
  isHexColor,
  normalizeHex,
  NAMED_COLORS,
} from '@/lib/brief/color-names'

describe('isHexColor', () => {
  it('menerima 3 dan 6 digit, dengan atau tanpa #', () => {
    expect(isHexColor('#6F4E37')).toBe(true)
    expect(isHexColor('6F4E37')).toBe(true)
    expect(isHexColor('#abc')).toBe(true)
    expect(isHexColor('  #ABC  ')).toBe(true)
  })

  it('menolak yang bukan hex', () => {
    expect(isHexColor('')).toBe(false)
    expect(isHexColor('cokelat')).toBe(false)
    expect(isHexColor('#12345')).toBe(false)
    expect(isHexColor('#1234567')).toBe(false)
    expect(isHexColor('#GGGGGG')).toBe(false)
  })
})

describe('normalizeHex', () => {
  it('huruf besar + tanda #', () => {
    expect(normalizeHex('6f4e37')).toBe('#6F4E37')
    expect(normalizeHex('#6F4E37')).toBe('#6F4E37')
  })

  it('3 digit diperluas ke 6 digit', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC')
    expect(normalizeHex('f00')).toBe('#FF0000')
  })

  it('input tidak valid -> null', () => {
    expect(normalizeHex('bukan hex')).toBeNull()
    expect(normalizeHex('')).toBeNull()
  })
})

describe('describeColor (nama warna terdekat)', () => {
  it('sampel nama warna yang diharapkan', () => {
    expect(describeColor('#6F4E37')?.name).toBe('cokelat tua')
    expect(describeColor('#F5E6D3')?.name).toBe('krem')
    expect(describeColor('#1E3A8A')?.name).toBe('biru laut')
    expect(describeColor('#D4AF37')?.name).toBe('emas')
    expect(describeColor('#FFFFFF')?.name).toBe('putih')
    expect(describeColor('#111111')?.name).toBe('hitam')
    expect(describeColor('#4D7C0F')?.name).toBe('hijau daun')
    expect(describeColor('#DC2626')?.name).toBe('merah')
    expect(describeColor('#7F1D1D')?.name).toBe('merah marun')
    expect(describeColor('#0F766E')?.name).toBe('teal')
    expect(describeColor('#BAE6FD')?.name).toBe('biru langit muda')
  })

  it('hex dinormalkan pada hasil', () => {
    expect(describeColor('6f4e37')).toEqual({ name: 'cokelat tua', hex: '#6F4E37' })
    expect(describeColor('#abc')).toEqual({ name: 'perak', hex: '#AABBCC' })
  })

  it('hex tidak valid -> null', () => {
    expect(describeColor('bukan warna')).toBeNull()
    expect(describeColor('')).toBeNull()
  })

  it('hex tepat sama dengan nama -> nama itu sendiri', () => {
    for (const entry of NAMED_COLORS) {
      expect(describeColor(`#${entry.hex}`)).toEqual({ name: entry.name, hex: `#${entry.hex}` })
    }
  })

  it('deskripsi warna dekat tetap punya nama', () => {
    // Warna sovereign di antara dua nama tetap dipetakan ke yang terdekat.
    const described = describeColor('#6B4F3A')
    expect(described).not.toBeNull()
    expect(described?.name.length).toBeGreaterThan(0)
    expect(described?.hex).toBe('#6B4F3A')
  })

  it('seluruh nama warna Indonesia & unik', () => {
    const names = NAMED_COLORS.map((c) => c.name)
    expect(new Set(names).size).toBe(names.length)
    for (const name of names) {
      // Huruf kecil, spasi, dan tanda hubung (abu-abu) sah.
      expect(name).toMatch(/^[a-z-]+(?: [a-z-]+)*$/)
    }
    expect(NAMED_COLORS.length).toBeGreaterThanOrEqual(25)
    expect(NAMED_COLORS.length).toBeLessThanOrEqual(35)
  })
})

describe('describeColorText', () => {
  it('format "nama (#HEX)"', () => {
    expect(describeColorText('#6F4E37')).toBe('cokelat tua (#6F4E37)')
    expect(describeColorText('#1E3A8A')).toBe('biru laut (#1E3A8A)')
  })

  it('null untuk hex tidak valid', () => {
    expect(describeColorText('bukan warna')).toBeNull()
  })
})