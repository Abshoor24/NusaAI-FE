import type { WebsiteType } from '@/types/api'
import type { BusinessCategoryId, BriefGoalId } from './types'

/**
 * Opsi pilihan yang ditampilkan ke pengguna.
 *
 * Semua teks berbahasa sehari-hari dan TIDAK memakai istilah teknis.
 * Nilai yang dikirim ke backend tetap nilai yang sudah diterima backend
 * (lihat types.ts WEBSITE_TYPE_VALUES / LANGUAGE_VALUES).
 */

export interface OptionWithDescription<V extends string> {
  value: V
  label: string
  description: string
}

/**
 * "Jenis halaman" — memetakan ke brief.website_type.
 * Hanya 6 nilai yang diterima backend (Fase 0.2), tidak ada jenis baru.
 */
export const WEBSITE_TYPE_OPTIONS: Array<OptionWithDescription<WebsiteType>> = [
  {
    value: 'landing_page',
    label: 'Halaman promo',
    description: 'Satu halaman menjelaskan usaha dan ajakan bertindak.',
  },
  {
    value: 'company_profile',
    label: 'Profil usaha',
    description: 'Profil lengkap: layanan, sejarah singkat, cara hubungi.',
  },
  {
    value: 'online_store',
    label: 'Toko online',
    description: 'Daftar produk atau jasa beserta harga dan cara order.',
  },
  {
    value: 'portfolio',
    label: 'Portofolio / karya',
    description: 'Menampilkan contoh hasil kerja atau karya.',
  },
  {
    value: 'blog',
    label: 'Blog / artikel',
    description: 'Tulisan panjang atau berita yang diperbarui.',
  },
  { value: 'other', label: 'Lainnya', description: 'Bebas, jelaskan sendiri di kolom deskripsi.' },
]

/** "Jenis usaha" — hanya untuk menentukan bagian halaman default & nada brief. */
export const BUSINESS_CATEGORY_OPTIONS: Array<OptionWithDescription<BusinessCategoryId>> = [
  { value: 'kuliner', label: 'Makanan & minuman', description: 'Kedai kopi, restoran, katering, jajanan.' },
  { value: 'fashion', label: 'Pakaian & aksesori', description: 'Konveksi, butik, sepatu, tas.' },
  { value: 'jasa', label: 'Jasa', description: 'Servis, laundry, konsultasi, perbaikan.' },
  { value: 'pendidikan', label: 'Pendidikan', description: 'Kursus, les, bimbel, pelatihan.' },
  { value: 'kesehatan', label: 'Kesehatan', description: 'Klinik, fisioterapi, apotek, gym.' },
  { value: 'kreatif', label: 'Kreatif & desain', description: 'Fotografi, desain, event, kerajinan.' },
  { value: 'toko-online', label: 'Toko online', description: 'Jualan produk secara online.' },
  { value: 'lainnya', label: 'Lainnya', description: 'Belum yakin? Ini aman.' },
]

/** "Tujuan utama website" — menentukan jenis ajakan yang ditonjolkan. */
export const BRIEF_GOAL_OPTIONS: Array<OptionWithDescription<BriefGoalId>> = [
  {
    value: 'terima-pesanan',
    label: 'Menerima pesanan',
    description: 'Pengunjung ingin membeli atau memesan.',
  },
  {
    value: 'perkenalkan-usaha',
    label: 'Memperkenalkan usaha',
    description: 'Ingin dikenal orang lebih banyak.',
  },
  {
    value: 'kumpulkan-kontak',
    label: 'Mengumpulkan kontak',
    description: 'Mau menyimpan nomor calon pelanggan.',
  },
  {
    value: 'pamerkan-karya',
    label: 'Memamerkan karya',
    description: 'Menampilkan hasil kerja atau portofolio.',
  },
  {
    value: 'terima-reservasi',
    label: 'Menerima reservasi',
    description: 'Pengunjung ingin memblokir jadwal atau daftar.',
  },
]
