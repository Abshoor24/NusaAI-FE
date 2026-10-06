import { describe, it, expect } from 'vitest'
import { sanitizeText, sanitizeMultiline } from '@/lib/brief/sanitize'

describe('sanitizeText', () => {
  it('memangkas ujung dan merapatkan spasi', () => {
    expect(sanitizeText('  halo   dunia  ')).toBe('halo dunia')
    expect(sanitizeText('a\t\tb')).toBe('a b')
  })

  it('membuang karakter kontrol', () => {
    expect(sanitizeText('halo\u0000dunia')).toBe('halodunia')
    expect(sanitizeText('halo\u0007dunia')).toBe('halodunia')
    expect(sanitizeText('halo\u001Fdunia')).toBe('halodunia')
    expect(sanitizeText('halo\u007Fdunia')).toBe('halodunia')
    expect(sanitizeText('halo\u009Fdunia')).toBe('halodunia')
  })

  it('TIDAK menghapus emoji, huruf Indonesia, atau huruf beraksen', () => {
    expect(sanitizeText('Kedai kopi ☕')).toBe('Kedai kopi ☕')
    expect(sanitizeText('JasaWARung')).toBe('JasaWARung')
    expect(sanitizeText('caféCréditFürAlle')).toBe('caféCréditFürAlle')
    expect(sanitizeText('Baju Boundtoh')).toBe('Baju Boundtoh')
    expect(sanitizeText('Kulit Chronicle')).toBe('Kulit Chronicle')
    expect(sanitizeText('naïve Beyoncé 😀🎉')).toBe('naïve Beyoncé 😀🎉')
  })

  it('string kosong & whitespace-only jadi string kosong', () => {
    expect(sanitizeText('')).toBe('')
    expect(sanitizeText('     ')).toBe('')
    expect(sanitizeText('\n\n')).toBe('')
  })

  it('menghapus baris baru (mode satu baris)', () => {
    expect(sanitizeText('baris satu\nbaris dua')).toBe('baris satu baris dua')
  })
})

describe('sanitizeMultiline', () => {
  it('mempertahankan pemisah baris', () => {
    expect(sanitizeMultiline('baris satu\nbaris dua')).toBe('baris satu\nbaris dua')
    expect(sanitizeMultiline('satu\r\ndua\r\ntiga')).toBe('satu\ndua\ntiga')
  })

  it('merapikan tiap baris', () => {
    expect(sanitizeMultiline('  a   b  \n   c  ')).toBe('a b\nc')
  })

  it('membuang baris kosong excess, menyisakan satu', () => {
    expect(sanitizeMultiline('a\n\n\n\n\nb')).toBe('a\n\nb')
  })

  it('membuang baris kosong di awal & akhir', () => {
    expect(sanitizeMultiline('\n\n\na\nb\n\n\n')).toBe('a\nb')
  })

  it('membuang karakter kontrol tapi mempertahankan emoji', () => {
    expect(sanitizeMultiline('halo\u0000\n\u001Fdukuh ☕')).toBe('halo\ndukuh ☕')
  })

  it('hasilnya bisa diratakan kembali ke sanitizeText', () => {
    const input = '  a  \n\n  b  '
    expect(sanitizeText(sanitizeMultiline(input))).toBe('a b')
  })
})