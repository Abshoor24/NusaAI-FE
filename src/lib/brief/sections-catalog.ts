import type { BusinessCategoryId } from './types'

/**
 * Katalog bagian halaman.
 *
 * `apiName` dikirim apa adanya ke backend sebagai item `brief.sections`
 * (maks 12 item, tiap item maks 50 karakter — diverifikasi Fase 0.3).
 * Nama api memakai istilah teknis yang dikenal AI; `label` dan `description`
 * memakai bahasa sehari-hari untuk pengguna awam.
 *
 * DILARANG menambah bagian yang butuh server (formulir kirim data, login,
 * pembayaran, keranjang, database). Website hasil generate adalah HTML statis.
 */
export interface SectionItem {
  id: string
  /** Nama ramah untuk pengguna awam. */
  label: string
  /** Penjelasan satu baris. */
  description: string
  /** Nama teknis yang dikirim ke backend (<= 50 karakter). */
  apiName: string
  /** Kategori usaha yang menyalakan bagian ini secara default. */
  defaultFor: BusinessCategoryId[]
  /**
   * Label alternatif per kategori (mis. "Menu" menjadi "Layanan" untuk jasa).
   * Bila kosong, `label` dipakai apa adanya.
   */
  labelFor?: Partial<Record<BusinessCategoryId, string>>
}

const ALL: BusinessCategoryId[] = [
  'kuliner',
  'fashion',
  'jasa',
  'pendidikan',
  'kesehatan',
  'kreatif',
  'toko-online',
  'lainnya',
]

export const SECTION_CATALOG: SectionItem[] = [
  {
    id: 'hero',
    label: 'Bagian pembuka (judul besar + tombol utama)',
    description: 'Kalimat pertama yang dilihat pengunjung, lengkap dengan tombol ajakan.',
    apiName: 'hero',
    defaultFor: ALL,
  },
  {
    id: 'about',
    label: 'Tentang kami',
    description: 'Cerita singkat usaha: sejak kapan, siapa yang menjalankan, apa keunggulannya.',
    apiName: 'about',
    defaultFor: ALL,
  },
  {
    id: 'menu',
    label: 'Menu / Produk / Layanan',
    description: 'Daftar apa saja yang dijual atau bisa dipesan.',
    apiName: 'menu, produk, atau layanan',
    defaultFor: ['kuliner', 'fashion', 'toko-online'],
    labelFor: {
      kuliner: 'Menu makanan',
      fashion: 'Katalog pakaian',
      'toko-online': 'Daftar produk',
      jasa: 'Daftar layanan',
      pendidikan: 'Program kelas',
      kesehatan: 'Layanan kesehatan',
      kreatif: 'Jenis karya',
    },
  },
  {
    id: 'gallery',
    label: 'Galeri foto',
    description: 'Kumpulan foto hasil kerja, produk, atau suasana tempat.',
    apiName: 'galeri foto',
    defaultFor: ['kuliner', 'fashion', 'kreatif', 'toko-online'],
  },
  {
    id: 'pricing',
    label: 'Harga / Paket',
    description: 'Daftar harga atau nama paket beserta nominalnya.',
    apiName: 'harga dan paket',
    defaultFor: ['kuliner', 'fashion', 'jasa', 'pendidikan', 'kreatif', 'toko-online'],
  },
  {
    id: 'howto',
    label: 'Cara pesan / Cara kerja',
    description: 'Langkah pemesanan atau alur kerja dari awal sampai selesai.',
    apiName: 'cara pesan dan alur kerja',
    defaultFor: ['kuliner', 'jasa', 'pendidikan', 'kreatif', 'toko-online'],
  },
  {
    id: 'hours',
    label: 'Jam buka & lokasi',
    description: 'Jam operasional, hari buka, dan alamat lengkap.',
    apiName: 'jam buka dan lokasi',
    defaultFor: ['kuliner', 'lainnya'],
  },
  {
    id: 'benefits',
    label: 'Keunggulan',
    description: 'Alasan pelanggan sebaiknya memilih usaha ini.',
    apiName: 'keunggulan',
    defaultFor: ALL,
  },
  {
    id: 'testimonials',
    label: 'Ulasan pelanggan',
    description: 'Pendapat atau testimoni dari pelanggan sebelumnya.',
    apiName: 'testimoni',
    defaultFor: ['kuliner', 'jasa', 'pendidikan', 'kesehatan', 'kreatif'],
  },
  {
    id: 'faq',
    label: 'Pertanyaan yang sering ditanyakan',
    description: 'Jawaban singkat untuk pertanyaan yang paling sering muncul.',
    apiName: 'faq',
    defaultFor: ['jasa', 'pendidikan', 'kesehatan', 'toko-online'],
  },
  {
    id: 'cta',
    label: 'Tombol ajakan (mis. Pesan via WhatsApp)',
    description: 'Ajakan bertindak: tombol pesan, reservasi, atau hubungi kami.',
    apiName: 'tombol ajakan bertindak (cta)',
    defaultFor: ALL,
  },
  {
    id: 'contact',
    label: 'Kontak',
    description: 'Nomor WhatsApp atau telepon, email, dan tautan lokasi.',
    apiName: 'kontak',
    defaultFor: ALL,
  },
  {
    id: 'footer',
    label: 'Penutup (kontak & media sosial)',
    description: 'Baris paling bawah: kontak, jam buka, dan tautan media sosial.',
    apiName: 'footer',
    defaultFor: ALL,
  },
]

const BY_ID = new Map(SECTION_CATALOG.map((item) => [item.id, item]))

/** Ambil item katalog; undefined bila id tidak dikenal. */
export function getSection(id: string): SectionItem | undefined {
  return BY_ID.get(id)
}

/** Label ramah; menyesuaikan kategori untuk bagian menu/produk/layanan. */
export function sectionLabel(id: string, category: BusinessCategoryId | ''): string {
  const item = BY_ID.get(id)
  if (!item) return id
  if (category && item.labelFor?.[category]) return item.labelFor[category] as string
  return item.label
}

/** Bagian yang dinyalakan secara default untuk sebuah kategori (urutan katalog). */
export function defaultSectionsFor(category: BusinessCategoryId | ''): string[] {
  if (!category) return []
  return SECTION_CATALOG.filter((item) => item.defaultFor.includes(category))
    .map((item) => item.id)
    .slice(0, 12)
}

/**
 * Petakan id bagian yang aktif menjadi nama API: urutan katalog, dedup
 * case-insensitive, maksimal 12, tiap item dipotong ke 50 karakter.
 */
export function toApiSectionNames(ids: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of SECTION_CATALOG) {
    if (!ids.includes(item.id)) continue
    const name = item.apiName.trim().slice(0, 50)
    const key = name.toLowerCase()
    if (!name || seen.has(key)) continue
    seen.add(key)
    out.push(name)
    if (out.length >= 12) break
  }
  return out
}

/** Ids katalog yang valid saja (pemulihan draf / sessionStorage). */
export function sanitizeSectionIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return []
  const out: string[] = []
  for (const raw of ids) {
    if (typeof raw !== 'string') continue
    const item = BY_ID.get(raw)
    if (!item) continue
    if (!out.includes(item.id)) out.push(item.id)
    if (out.length >= 12) break
  }
  return out
}