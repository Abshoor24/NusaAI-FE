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

export type Step = { title: string; description: string }

export const steps: Step[] = [
  {
    title: 'Isi brief',
    description: 'Ceritakan usahamu, lalu pilih jenis website, gaya, warna, dan bagian yang kamu mau.',
  },
  {
    title: 'AI menulis websitenya',
    description: 'AI menyusun satu file HTML, dan kamu bisa melihat prosesnya langsung.',
  },
  {
    title: 'Lihat dan revisi',
    description:
      'Cek hasilnya di tampilan HP, tablet, dan komputer. Tulis revisi dengan kalimat biasa, tiap revisi tersimpan sebagai versi baru.',
  },
  {
    title: 'Unduh file HTML',
    description: 'Satu file HTML yang bisa langsung dibuka di browser.',
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
      'Bisa. Tulis perubahan yang kamu inginkan dengan kalimat biasa dan Pakhir Studio akan membuat versi baru untukmu.',
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
