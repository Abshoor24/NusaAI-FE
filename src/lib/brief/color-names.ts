/**
 * Tabel nama warna dalam bahasa Indonesia + pencarian warna terdekat.
 *
 * Tujuannya: AI menerima NAMA warna, bukan hanya kode hex. Format yang dikirim
 * ke backend: "warna utama: cokelat tua (#6F4E37); warna aksen: krem (#F5E6D3)".
 * Batas color_palette = 200 karakter, jadi format ini muat lega.
 */

export interface NamedColor {
  /** Nama warna dalam bahasa sehari-hari. */
  name: string
  /** Nilai acuan (hex, tanpa '#'). */
  hex: string
}

/**
 * 30 warna bernama. Nilai hex dipilih sebagai titik tengah rentang warna
 * sekelas agar "terdekat" menghasilkan nama yang masuk akal.
 */
export const NAMED_COLORS: NamedColor[] = [
  { name: 'putih', hex: 'FFFFFF' },
  { name: 'krem', hex: 'F5E6D3' },
  { name: 'beige', hex: 'E8DCC8' },
  { name: 'abu-abu muda', hex: 'D1D5DB' },
  { name: 'abu-abu', hex: '9CA3AF' },
  { name: 'abu-abu tua', hex: '4B5563' },
  { name: 'hitam', hex: '111111' },
  { name: 'cokelat muda', hex: 'A9836B' },
  { name: 'cokelat', hex: '8B5E3C' },
  { name: 'cokelat tua', hex: '6F4E37' },
  { name: 'karamel', hex: 'C68642' },
  { name: 'jingga', hex: 'F97316' },
  { name: 'kuning', hex: 'FACC15' },
  { name: 'krem susu', hex: 'FFF7ED' },
  { name: 'hijau daun', hex: '4D7C0F' },
  { name: 'hijau lumut', hex: '3F6212' },
  { name: 'hijau pastel', hex: 'BBF7D0' },
  { name: 'teal', hex: '0F766E' },
  { name: 'biru laut', hex: '1E3A8A' },
  { name: 'biru langit', hex: '38BDF8' },
  { name: 'biru langit muda', hex: 'BAE6FD' },
  { name: 'biru dongker', hex: '1E40AF' },
  { name: 'ungu', hex: '7C3AED' },
  { name: 'ungu muda', hex: 'DDD6FE' },
  { name: 'magenta', hex: 'DB2777' },
  { name: 'merah marun', hex: '7F1D1D' },
  { name: 'merah', hex: 'DC2626' },
  { name: 'merah muda', hex: 'FBCFE8' },
  { name: 'emas', hex: 'D4AF37' },
  { name: 'perak', hex: 'C0C0C0' },
]

/** True bila string adalah hex 3 atau 6 digit (dengan/tanpa '#'). */
export function isHexColor(value: string): boolean {
  return /^#?(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())
}

/**
 * Normalisasi hex ke bentuk "#RRGGBB" huruf besar; mendukung 3 digit (#abc).
 * Return null bila bukan hex valid.
 */
export function normalizeHex(value: string): string | null {
  const trimmed = value.trim()
  if (!isHexColor(trimmed)) return null
  const body = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed
  const full =
    body.length === 3
      ? body
          .split('')
          .map((c) => c + c)
          .join('')
      : body
  return `#${full.toUpperCase()}`
}

function toRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}

/** Jarak Euclidean RGB (pendek = lebih mirip). */
function distance(a: [number, number, number], b: [number, number, number]): number {
  const dr = a[0] - b[0]
  const dg = a[1] - b[1]
  const db = a[2] - b[2]
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

export interface ColorDescription {
  /** Nama warna terdekat. */
  name: string
  /** Hex yang dinormalisasi, mis. "#6F4E37". */
  hex: string
}

/**
 * Nama warna terdekat untuk sebuah hex. Hex tidak valid -> null.
 * Contoh: describeColor('#6F4E37') -> { name: 'cokelat tua', hex: '#6F4E37' }
 */
export function describeColor(input: string): ColorDescription | null {
  const hex = normalizeHex(input)
  if (!hex) return null
  const rgb = toRgb(hex)
  let best = NAMED_COLORS[0]
  let bestDistance = Number.POSITIVE_INFINITY
  for (const candidate of NAMED_COLORS) {
    const d = distance(rgb, toRgb(candidate.hex))
    if (d < bestDistance) {
      bestDistance = d
      best = candidate
    }
  }
  return { name: best.name, hex }
}

/** Teks siap kirim: "cokelat tua (#6F4E37)". Null bila hex tidak valid. */
export function describeColorText(input: string): string | null {
  const described = describeColor(input)
  if (!described) return null
  return `${described.name} (${described.hex})`
}