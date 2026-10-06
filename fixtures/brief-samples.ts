/**
 * Delapan contoh brief lengkap untuk evaluasi manual Tahap 2.
 *
 * Berkas ini dipakai oleh:
 * - scripts/brief-contract-check.ts (5.4: uji kontrak ke backend sungguhan).
 * - docs/BRIEF-EVAL.md (5.3: bahan penilaian manual).
 *
 * SETIAP contoh adalah BriefDraft yang valid: melewati validateBrief tanpa
 * error, dan hanya memakai field API yang sudah ada. Tidak ada fitur yang
 * butuh server (formulir kirim data, login, pembayaran, keranjang).
 */

import type { BriefDraft } from '@/lib/brief/types'

export interface BriefSample {
  id: string
  label: string
  draft: BriefDraft
}

const contact = (patch: Partial<BriefDraft['contact']> = {}): BriefDraft['contact'] => ({
  whatsapp: '',
  phone: '',
  email: '',
  address: '',
  mapsUrl: '',
  instagram: '',
  openingHours: '',
  ...patch,
})

export const BRIEF_SAMPLES: BriefSample[] = [
  {
    id: 'kedai-kopi',
    label: 'Kedai kopi',
    draft: {
      title: 'Website Kopi Senja',
      description:
        'Kedai kopi kecil di Purwokerto yang menyangrai kopinya sendiri. Kami buka jam 08.00 sampai 22.00 setiap hari, punya sudut duduk yang tenang untuk bekerja, dan menerima pesanan biji kopi untuk pelanggan yang ingin menyeduh di rumah. Suasana kami hangat dan sederhana, cocok untuk santai atau rapat singkat.',
      businessCategory: 'kuliner',
      goal: 'terima-pesanan',
      audience: 'Mahasiswa dan pekerja kantoran yang butuh tempat tenang',
      brandName: 'Kopi Senja',
      styles: ['Hangat', 'Minimalis'],
      colorMode: 'custom',
      primaryColor: '#6F4E37',
      accentColor: '#F5E6D3',
      palettePreset: 'hangat',
      websiteType: 'landing_page',
      language: 'id',
      sections: [
        'hero',
        'about',
        'menu',
        'gallery',
        'pricing',
        'hours',
        'benefits',
        'testimonials',
        'cta',
        'contact',
        'footer',
      ],
      contact: contact({
        whatsapp: '081234567890',
        email: 'halo@kopisenja.id',
        address: 'Jl. Meranti No. 12, Purwokerto',
        mapsUrl: 'https://maps.google.com/?q=Purwokerto',
        instagram: '@kopisenja',
        openingHours: 'Setiap hari, 08.00-22.00',
      }),
      extraNotes: 'Gunakan foto suasana kedai, bukan foto stok orang yang sedang minum kopi.',
    },
  },
  {
    id: 'jasa-foto',
    label: 'Jasa foto',
    draft: {
      title: 'Website Sejaran Foto',
      description:
        'Fotografer independen yang fokus pada foto pernikahan, foto produk, dan potret keluarga. Pemotretan dilakukan di lokasi pilihan klien. Foto dikirim lewat tautan unduhan paling lama tujuh hari setelah pemotretan selesai, sudah termasuk revisi minor dua kali.',
      businessCategory: 'kreatif',
      goal: 'terima-pesanan',
      audience: 'Pasangan pengantin dan pemilik usaha kecil',
      brandName: 'Sejaran Foto',
      styles: ['Elegan', 'Profesional'],
      colorMode: 'custom',
      primaryColor: '#1E3A8A',
      accentColor: '#DDD6FE',
      palettePreset: 'elegan',
      websiteType: 'portfolio',
      language: 'id',
      sections: [
        'hero',
        'about',
        'gallery',
        'pricing',
        'howto',
        'benefits',
        'testimonials',
        'cta',
        'contact',
        'footer',
      ],
      contact: contact({
        whatsapp: '085611223344',
        email: 'halo@sejaranfoto.id',
        address: 'Yogyakarta',
        instagram: '@sejaranfoto',
        openingHours: 'Booking minimal H-3',
      }),
      extraNotes: '',
    },
  },
  {
    id: 'toko-online-baju',
    label: 'Toko online baju',
    draft: {
      title: 'Toko Melati Online',
      description:
        'Toko online rumahan yang menjual pakaian wanita ukuran S sampai XL. Bahan adem dan jahitannya rapi, kami kirim ke seluruh Indonesia lewat kurir. Pelanggan bisa pesan lewat WhatsApp dan kami kirim foto produk terbaru kalau ingin melihat detail kainnya.',
      businessCategory: 'toko-online',
      goal: 'terima-pesanan',
      audience: 'Wanita usia 20 sampai 40 tahun yang mencari pakaian kasual',
      brandName: 'Toko Melati',
      styles: ['Ceria', 'Modern'],
      colorMode: 'custom',
      primaryColor: '#DB2777',
      accentColor: '#FBCFE8',
      palettePreset: 'ceria',
      websiteType: 'online_store',
      language: 'id',
      sections: [
        'hero',
        'about',
        'menu',
        'gallery',
        'pricing',
        'howto',
        'benefits',
        'faq',
        'cta',
        'contact',
        'footer',
      ],
      contact: contact({
        whatsapp: '081298765432',
        email: 'order@tokomelati.id',
        address: 'Bandung, Jawa Barat',
        instagram: '@tokomelati',
        openingHours: 'Online 08.00-21.00',
      }),
      extraNotes: 'Harga ditulis dalam rupiah tanpa titik ribuan.',
    },
  },
  {
    id: 'bimbel',
    label: 'Bimbel dan les',
    draft: {
      title: 'Kelas Matematika Pesar',
      description:
        'Kursus privat matematika untuk siswa SMA dan mahasiswa yang kesulitan mengerjakan soal cerita. Satu pertemuan 90 menit dengan maksimal empat murid agar semua bisa ikut berdiskusi. Bisa lewat Zoom atau datang ke rumah.',
      businessCategory: 'pendidikan',
      goal: 'terima-reservasi',
      audience: 'Siswa SMA dan mahasiswa yang kesulitan soal cerita',
      brandName: 'Kelas Matematika Pesar',
      styles: ['Profesional', 'Hangat'],
      colorMode: 'custom',
      primaryColor: '#4D7C0F',
      accentColor: '#FFF7ED',
      palettePreset: 'alam',
      websiteType: 'landing_page',
      language: 'id',
      sections: [
        'hero',
        'about',
        'menu',
        'pricing',
        'howto',
        'benefits',
        'testimonials',
        'faq',
        'cta',
        'contact',
        'footer',
      ],
      contact: contact({
        whatsapp: '081222334455',
        email: 'daftar@kelasmatematika.id',
        address: 'Kota Bandung',
        instagram: '@kelasmatematika',
        openingHours: 'Senin-Sabtu, 16.00-20.00',
      }),
      extraNotes: 'Tampilkan cara daftar lewat WhatsApp, bukan formulir panjang.',
    },
  },
  {
    id: 'barbershop',
    label: 'Barbershop',
    draft: {
      title: 'Website Pangkas Rapi',
      description:
        'Barbershop di Surabaya yang fokus pada potongan rambut pria dan perawatan kumis. Selesai dalam 45 menit dan bisa dipesan jamnya lewat WhatsApp supaya tidak datang sia-sia. Ada ruang tunggu ber-AC dan teh gratis.',
      businessCategory: 'jasa',
      goal: 'terima-reservasi',
      audience: 'Pria usia 20 sampai 40 tahun di sekitar Surabaya',
      brandName: 'Pangkas Rapi',
      styles: ['Rustic', 'Profesional'],
      colorMode: 'custom',
      primaryColor: '#111111',
      accentColor: '#C68642',
      palettePreset: 'gelap-mewah',
      websiteType: 'company_profile',
      language: 'id',
      sections: [
        'hero',
        'about',
        'pricing',
        'hours',
        'gallery',
        'benefits',
        'testimonials',
        'cta',
        'contact',
        'footer',
      ],
      contact: contact({
        whatsapp: '081333445566',
        phone: '031-8877665',
        address: 'Jl. Gajah Mada No. 45, Surabaya',
        mapsUrl: 'https://maps.google.com/?q=Surabaya',
        instagram: '@pangkasrapi',
        openingHours: 'Setiap hari, 10.00-21.00',
      }),
      extraNotes: 'Harga per layanan, tulis ulang daftar harga bila berubah.',
    },
  },
  {
    id: 'katering',
    label: 'Katering',
    draft: {
      title: 'Website Dapur Ibu',
      description:
        'Katering rumahan untuk rapat, arisan, dan acara keluarga di Semarang. Menu harian berganti, mulai dari 25.000 rupiah per porsi, dan bisa dipesan H-2. Kami antar ke seluruh kota Semarang.',
      businessCategory: 'kuliner',
      goal: 'terima-pesanan',
      audience: 'Kantor dan keluarga di Semarang',
      brandName: 'Dapur Ibu',
      styles: ['Hangat', 'Ceria'],
      colorMode: 'custom',
      primaryColor: '#DC2626',
      accentColor: '#FFF7ED',
      palettePreset: 'hangat',
      websiteType: 'online_store',
      language: 'id',
      sections: [
        'hero',
        'about',
        'menu',
        'pricing',
        'gallery',
        'howto',
        'hours',
        'benefits',
        'testimonials',
        'faq',
        'cta',
        'contact',
        'footer',
      ],
      contact: contact({
        whatsapp: '081244556677',
        email: 'order@dapuribu.id',
        address: 'Semarang, Jawa Tengah',
        instagram: '@dapuribu',
        openingHours: 'Pesanan H-2, antar 09.00-15.00',
      }),
      extraNotes: 'Sertakan contoh menu 7 hari terakhir.',
    },
  },
  {
    id: 'undangan-pernikahan',
    label: 'Undangan pernikahan',
    draft: {
      title: 'Undangan Pernikahan Rani dan Bagus',
      description:
        'Undangan pernikahan kami. Tamu bisa melihat detail acara, membuka peta lokasi, lalu mengonfirmasi kehadiran lewat WhatsApp kami. Mohon konfirmasi sebelum tanggal 20 Mei 2026 agar kami bisa menyiapkan tempat.',
      businessCategory: 'lainnya',
      goal: 'kumpulkan-kontak',
      audience: 'Keluarga, teman, dan rekan kerja',
      brandName: 'Rani dan Bagus',
      styles: ['Mewah', 'Elegan'],
      colorMode: 'custom',
      primaryColor: '#1E40AF',
      accentColor: '#D4AF37',
      palettePreset: 'gelap-mewah',
      websiteType: 'landing_page',
      language: 'id',
      sections: ['hero', 'about', 'hours', 'gallery', 'faq', 'cta', 'contact', 'footer'],
      contact: contact({
        whatsapp: '081355667788',
        address: 'Gedung Serbaguna Mutiara, Jl. Melati No. 4, Semarang',
        openingHours: 'Sabtu, 12 Juni 2026, 10.00-14.00',
      }),
      extraNotes: 'Gunakan kata "kami" saat berbicara, bukan nama pasangan.',
    },
  },
  {
    id: 'portofolio-desainer',
    label: 'Portofolio desainer',
    draft: {
      title: 'Website Studio Aris',
      description:
        'Desainer grafis freelance yang mengerjakan identitas visual, logo, dan materi promosi untuk usaha kecil. Fokus saya pada desain yang sederhana tapi mudah diingat, dan pengerjaan selesai lima sampai tujuh hari kerja.',
      businessCategory: 'kreatif',
      goal: 'pamerkan-karya',
      audience: 'Pemilik usaha kecil yang butuh identitas visual',
      brandName: 'Studio Aris',
      styles: ['Minimalis', 'Modern'],
      colorMode: 'custom',
      primaryColor: '#111111',
      accentColor: '#D1D5DB',
      palettePreset: 'netral',
      websiteType: 'portfolio',
      language: 'id',
      sections: ['hero', 'about', 'gallery', 'benefits', 'pricing', 'cta', 'contact', 'footer'],
      contact: contact({
        whatsapp: '081377889900',
        email: 'halo@studioaris.id',
        address: 'Surabaya',
        instagram: '@studioaris',
      }),
      extraNotes: '',
    },
  },
]

/** Cari sampel berdasarkan id. */
export function getSample(id: string): BriefSample | undefined {
  return BRIEF_SAMPLES.find((s) => s.id === id)
}