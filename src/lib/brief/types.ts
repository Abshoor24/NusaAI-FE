import type { ContentLanguage, WebsiteType } from '@/types/api'

/** Kategori usaha (dipakai untuk menentukan bagian halaman default). */
export type BusinessCategoryId =
  | 'kuliner'
  | 'fashion'
  | 'jasa'
  | 'pendidikan'
  | 'kesehatan'
  | 'kreatif'
  | 'toko-online'
  | 'lainnya'

/** Tujuan utama website — menentukan gaya ajakan (tombol) yang ditampilkan. */
export type BriefGoalId =
  | 'terima-pesanan'
  | 'perkenalkan-usaha'
  | 'kumpulkan-kontak'
  | 'pamerkan-karya'
  | 'terima-reservasi'

/** Sumber warna: PILIH AI atau dua warna pilihan pengguna. */
export type ColorMode = 'ai' | 'custom'

/** Id bagian halaman yang dinyalakan (lihat sections-catalog.ts). */
export type SectionId = string

export interface BriefContact {
  whatsapp: string
  phone: string
  email: string
  address: string
  mapsUrl: string
  instagram: string
  openingHours: string
}

/**
 * Draft brief = state form terstruktur.
 *
 * SEMUA field opsional kecuali `description`. Brief sengaja hanya berisi data
 * yang bisa dipetakan ke field API yang sudah ada (lihat build-payload.ts):
 * website statis, tanpa fitur yang butuh server.
 */
export interface BriefDraft {
  /** Judul project di daftar; backend memakai brief.business_name sebagai cadangan. */
  title: string
  /** Teks bebas utama. WAJIB 10..MAX_USER_DESCRIPTION karakter. */
  description: string
  businessCategory: BusinessCategoryId | ''
  goal: BriefGoalId | ''
  /** Target pengunjung, teks pendek (opsional). */
  audience: string
  /** Nama bisnis/brand (opsional). */
  brandName: string
  /** Chip gaya, maksimal MAX_STYLES. */
  styles: string[]
  colorMode: ColorMode
  /** Hex warna utama, mis. #6F4E37 (tanpa '#' juga diterima lalu dinormalkan). */
  primaryColor: string
  /** Hex warna aksen. */
  accentColor: string
  /** Id palet siap pakai, bila dipilih dari galet palet. */
  palettePreset: string
  /** '' = biarkan server (default landing_page). */
  websiteType: WebsiteType | ''
  /** '' = biarkan server (default id). */
  language: ContentLanguage | ''
  /** Id bagian halaman yang dinyalakan, maksimal 12. */
  sections: SectionId[]
  contact: BriefContact
  extraNotes: string
}

export const MAX_STYLES = 3
export const MAX_SECTIONS = 12

/**
 * Batas karakter untuk textarea deskripsi.
 *
 * Brief yang dikirim = deskripsi user + baris berlabel + satu kalimat tetap
 * (lihat build-payload.ts) dan hard limit backend 4000 karakter. 3600
 * menyisakan ruang 400 karakter untuk baris tambahan pada skenario terburuk,
 * sehingga kalimat user tidak pernah perlu dipangkas.
 */
export const MAX_USER_DESCRIPTION = 3600

/** Batas keras backend (diverifikasi lewat API, Fase 0.3). */
export const API_LIMITS = {
  description: 4000,
  title: 200,
  businessName: 120,
  style: 200,
  colorPalette: 200,
  sections: 12,
  sectionName: 50,
  descriptionMin: 10,
} as const

/** Nilai website_type yang diterima backend (tidak menambah jenis baru). */
export const WEBSITE_TYPE_VALUES: readonly WebsiteType[] = [
  'landing_page',
  'portfolio',
  'company_profile',
  'online_store',
  'blog',
  'other',
]

/** Nilai language yang diterima backend. */
export const LANGUAGE_VALUES: readonly ContentLanguage[] = ['id', 'en']

/** Draft kosong (default form). */
export function createEmptyBrief(): BriefDraft {
  return {
    title: '',
    description: '',
    businessCategory: '',
    goal: '',
    audience: '',
    brandName: '',
    styles: [],
    colorMode: 'ai',
    primaryColor: '#6F4E37',
    accentColor: '#F5E6D3',
    palettePreset: '',
    websiteType: '',
    language: '',
    sections: [],
    contact: {
      whatsapp: '',
      phone: '',
      email: '',
      address: '',
      mapsUrl: '',
      instagram: '',
      openingHours: '',
    },
    extraNotes: '',
  }
}