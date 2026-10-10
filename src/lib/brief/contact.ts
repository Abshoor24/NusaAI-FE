/**
 * Normalisasi data kontak untuk website statis.
 *
 * Website hasil generate tidak punya server, jadi "kontak" selalu berbentuk
 * tautan: wa.me, tel:, mailto:, tautan Google Maps, tautan Instagram.
 */

/** Buang semua karakter selain digit dan tanda plus di depan. */
function compactNumber(input: string): string {
  return input.replace(/[^\d+]/g, '')
}

/**
 * Nomor telepon/WhatsApp -> format internasional.
 *
 * Aturan Indonesia:
 * - 62xxx, +62xxx, 0062xxx -> +62xxx
 * - 08xx -> +628xx
 * - nomor luar negeri lain (digit 7-15) -> +<digit apa adanya>
 *
 * Return null bila tidak menghasilkan nomor yang wajar (9-15 digit).
 */
export function normalizePhoneNumber(input: string): string | null {
  const raw = compactNumber(input)
  if (!raw) return null

  let digits = raw.replace(/\+/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (!/^\d+$/.test(digits) || digits.length === 0) return null

  // 08xx (Indonesia) -> 62 8xx. Nomor berawalan 62 atau kode negara lain
  // dianggap sudah internasional.
  if (!digits.startsWith('62') && digits.startsWith('0')) {
    digits = `62${digits.replace(/^0+/, '')}`
  }

  if (digits.length < 9 || digits.length > 15) return null
  return `+${digits}`
}

/**
 * Tautan WhatsApp wa.me — HANYA digit, tanpa "+" dan tanpa spasi.
 * Contoh: "+628123456789" -> "https://wa.me/628123456789".
 * Return null bila nomor tidak valid.
 */
export function toWaMeUrl(input: string): string | null {
  const normalized = normalizePhoneNumber(input)
  if (!normalized) return null
  return `https://wa.me/${normalized.replace(/^\+/, '')}`
}

/** Tautan telepon (tel:) dari input; null bila tidak valid. */
export function toTelUrl(input: string): string | null {
  const normalized = normalizePhoneNumber(input)
  if (!normalized) return null
  return `tel:${normalized}`
}

/** Bersihkan input URL: buang spasi, pastikan ada skema http(s). */
export function normalizeWebUrl(input: string): string | null {
  const trimmed = input.trim().replace(/\s+/g, '')
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

/**
 * Instagram menerima "@nama", "nama", atau URL lengkap; dikembalikan sebagai
 * URL publik. Null bila tidak dikenali.
 */
export function toInstagramUrl(input: string): string | null {
  const trimmed = input.trim().replace(/\s+/g, '')
  if (!trimmed) return null
  const direct = normalizeWebUrl(trimmed)
  if (direct) return direct
  const handle = trimmed.replace(/^@+/, '').replace(/\/+$/, '')
  if (!/^[A-Za-z0-9._]{2,30}$/.test(handle)) return null
  return `https://instagram.com/${handle}`
}

/**
 * Nama tampilan Instagram untuk teks brief, selalu berformat "@nama" —
 * entah user mengetik "@nama", "nama", atau URL lengkap.
 */
export function instagramDisplay(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, '')
  if (!trimmed) return ''
  if (!toInstagramUrl(trimmed)) return trimmed
  const handle = trimmed
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/\/+$/, '')
    .replace(/^@+/, '')
  return handle ? `@${handle}` : ''
}