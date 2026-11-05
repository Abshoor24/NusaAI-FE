export type LandingCta = { to: '/projects' | '/login'; label: string }

export const useCases = [
  'Landing page',
  'Portofolio',
  'Company profile',
  'Toko online sederhana',
  'Blog',
]

export const heroSuggestions = [
  'Landing page kedai kopi di Purwokerto',
  'Portofolio fotografer dengan gaya editorial',
  'Company profile studio arsitektur yang ringkas',
  'Toko online sederhana untuk produk lokal',
]

// Teks placeholder hero yang berputar (setara TextType React Bits).
// Entri keempat dari permintaan ("Company profile ... minimal dan berani")
// duplikat dengan entri pertama sehingga hanya tiga yang unik yang dipakai.
export const heroPlaceholderTexts = [
  'Contoh: Company profile studio arsitektur yang minimal dan berani...',
  'Contoh: Landing page untuk kedai kopi di Purwokerto, gaya hangat dan modern...',
  'Contoh: Portofolio fotografer dengan tampilan editorial dan elegan...',
]

// Label pil pendek sesuai referensi Figma; setiap pil mengisi kolom input
// dengan contoh prompt yang sesuai (pil berfungsi, bukan hiasan).
export const heroQuickPills = [
  { label: 'Landing page', prompt: 'Landing page kedai kopi di Purwokerto' },
  { label: 'Portofolio', prompt: 'Portofolio fotografer dengan gaya editorial' },
  { label: 'Company profile', prompt: 'Company profile studio arsitektur yang ringkas' },
  { label: 'Toko online', prompt: 'Toko online sederhana untuk produk lokal' },
]

export type Step = { title: string; description: string }

export const steps: Step[] = [
  {
    title: 'Isi brief',
    description: 'Ceritakan jenis website, gaya, dan warna yang kamu mau.',
  },
  {
    title: 'AI menulis websitenya',
    description: 'AI menyusun kode dan menampilkan prosesnya langsung.',
  },
  {
    title: 'Lihat dan revisi',
    description: 'Tulis perubahan dengan kalimat biasa, tanpa menyentuh kode.',
  },
  {
    title: 'Unduh file HTML',
    description: 'Satu file siap dibuka, dibagikan, atau dipublikasikan.',
  },
]

export type Feature = {
  title: string
  description: string
  variant: 'preview' | 'revise' | 'version' | 'reference' | 'file' | 'responsive'
}

export const features: Feature[] = [
  {
    title: 'Pratinjau langsung',
    description: 'Setiap perubahan terlihat di pratinjau HP, tablet, dan desktop sebelum kamu unduh.',
    variant: 'preview',
  },
  {
    title: 'Revisi dengan kalimat biasa',
    description: 'Tidak perlu tahu kode. Tulis yang ingin diubah, AI membuat versi barunya.',
    variant: 'revise',
  },
  {
    title: 'Revisi tersimpan sebagai versi',
    description: 'Tiap revisi tersimpan sebagai versi baru, versi lama tidak tertimpa.',
    variant: 'version',
  },
  {
    title: 'Gambar referensi',
    description: 'Lampirkan logo atau contoh desain saat generate untuk mengarahkan hasil.',
    variant: 'reference',
  },
  {
    title: 'Satu file HTML',
    description: 'Hasilnya satu file mandiri. Buka di browser atau unggah ke hosting mana saja.',
    variant: 'file',
  },
  {
    title: 'Rapi di semua layar',
    description: 'Hasil dibuat responsif sejak awal, bukan ditempel belakangan.',
    variant: 'responsive',
  },
]

export type ShowcaseItem = {
  category: string
  title: string
  heading: string
  kicker: string
  serif: boolean
  tone: 'paper' | 'ink' | 'mist' | 'sand' | 'clay'
  pattern: 'lines' | 'grid' | 'dots' | 'bars' | 'frame'
}

export const showcaseItems: ShowcaseItem[] = [
  {
    category: 'Landing page',
    title: 'Kedai kopi lokal',
    heading: 'Tempat pulang dalam setiap seduhan.',
    kicker: 'Kopi lokal, Purwokerto',
    serif: true,
    tone: 'paper',
    pattern: 'lines',
  },
  {
    category: 'Portofolio',
    title: 'Fotografer editorial',
    heading: 'Mengabadikan yang tak terucap.',
    kicker: 'Nara Visual',
    serif: false,
    tone: 'ink',
    pattern: 'frame',
  },
  {
    category: 'Toko online',
    title: 'Produk perawatan',
    heading: 'Rawat diri dengan bahan sederhana.',
    kicker: 'Katalog kecil, checkout jelas',
    serif: true,
    tone: 'mist',
    pattern: 'grid',
  },
  {
    category: 'Company profile',
    title: 'Studio arsitektur',
    heading: 'Ruang yang hidup bersama waktu.',
    kicker: 'Profil biro, daftar karya',
    serif: false,
    tone: 'sand',
    pattern: 'bars',
  },
  {
    category: 'Blog',
    title: 'Catatan perjalanan',
    heading: 'Cerita dari jalan yang panjang.',
    kicker: 'Tulisan terbaru tiap pekan',
    serif: true,
    tone: 'clay',
    pattern: 'dots',
  },
]

export const faqs: Array<{ question: string; answer: string }> = [
  {
    question: 'Apakah hasilnya bisa dipakai langsung?',
    answer:
      'Ya. Kamu mendapatkan satu file HTML mandiri yang bisa langsung dibuka di browser, dibagikan, atau diunggah ke layanan hosting.',
  },
  {
    question: 'Apakah saya bisa merevisi berkali-kali?',
    answer:
      'Bisa. Tulis perubahan yang kamu inginkan dengan kalimat biasa dan Nusa AI akan membuat versi baru untukmu.',
  },
  {
    question: 'Apakah versi lama akan hilang?',
    answer:
      'Tidak. Setiap revisi disimpan sebagai versi terpisah, jadi hasil sebelumnya tidak tertimpa.',
  },
  {
    question: 'Bisa memakai gambar referensi?',
    answer:
      'Bisa. Kamu dapat melampirkan logo, foto, atau contoh desain untuk membantu AI memahami arah visual yang diinginkan.',
  },
  {
    question: 'Apakah tampil baik di HP?',
    answer:
      'Ya. Setiap website dibuat responsif dan dapat kamu periksa langsung dalam mode HP, tablet, dan desktop.',
  },
]
