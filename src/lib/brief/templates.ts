import type { BriefDraft } from './types'
import { createEmptyBrief } from './types'
import { defaultSectionsFor } from './sections-catalog'
import { PALETTE_PRESETS } from './palettes'

/**
 * Template mulai-cepat: mengisi sebagian BriefDraft agar pengguna awam cukup
 * menyunting, bukan menulis dari nol. Tidak ada yang terkunci — semua field
 * tetap bisa diubah setelah template dipilih.
 */

export interface BriefTemplate {
  id: string
  /** Nama template dalam bahasa sehari-hari. */
  label: string
  /** Satu baris penjelasan. */
  description: string
  /** Nama ikon lucide-react, dipakai UI. */
  icon: string
  /** Draft yang digabung ke draft pengguna. */
  draft: Partial<BriefDraft>
}

export const BRIEF_TEMPLATES: BriefTemplate[] = [
  {
    id: 'kedai-kopi',
    label: 'Kedai kopi',
    description: 'Menu, jam buka, lokasi, dan tombol pesan lewat WhatsApp.',
    icon: 'coffee',
    draft: {
      businessCategory: 'kuliner',
      goal: 'terima-pesanan',
      styles: ['Hangat', 'Minimalis'],
      palettePreset: 'hangat',
      primaryColor: '#6F4E37',
      accentColor: '#F5E6D3',
      sections: defaultSectionsFor('kuliner'),
      description:
        'Kedai kopi kecil di Purwokerto yang sangrai kopinya sendiri. Buka jam 08.00 sampai 22.00, ada tempat duduk nyaman untuk bekerja, dan kami menerima pesanan biji kopi untuk pelanggan yang ingin menyeduh di rumah.',
      contact: {
        whatsapp: '081234567890',
        phone: '',
        email: 'halo@kopisenja.id',
        address: 'Jl. Meranti No. 12, Purwokerto',
        mapsUrl: '',
        instagram: '@kopisenja',
        openingHours: 'Setiap hari, 08.00-22.00',
      },
    },
  },
  {
    id: 'toko-online',
    label: 'Toko online / UMKM',
    description: 'Katalog produk, harga, dan cara order lewat WhatsApp.',
    icon: 'shopping-bag',
    draft: {
      businessCategory: 'toko-online',
      goal: 'terima-pesanan',
      styles: ['Ceria', 'Modern'],
      palettePreset: 'segar',
      primaryColor: '#0F766E',
      accentColor: '#BBF7D0',
      sections: defaultSectionsFor('toko-online'),
      description:
        'Toko online rumahan yang menjual pakaian wanita ukuran S sampai XL dan dikirim ke seluruh Indonesia. Pelanggan bisa pesan lewat WhatsApp, dan kami kirim foto produk terbaru bila ingin melihat detail kainnya.',
      contact: {
        whatsapp: '081298765432',
        phone: '',
        email: 'order@tokomelati.id',
        address: 'Bandung, Jawa Barat',
        mapsUrl: '',
        instagram: '@tokomelati',
        openingHours: 'Online 08.00-21.00',
      },
    },
  },
  {
    id: 'jasa-foto',
    label: 'Jasa foto',
    description: 'Portofolio hasil kerja, paket harga, dan cara booking.',
    icon: 'camera',
    draft: {
      businessCategory: 'kreatif',
      goal: 'terima-pesanan',
      styles: ['Elegan', 'Profesional'],
      palettePreset: 'elegan',
      primaryColor: '#1E3A8A',
      accentColor: '#DDD6FE',
      sections: defaultSectionsFor('kreatif'),
      description:
        'Fotografer independen yang fokus pada foto pernikahan, foto produk, dan potret. Pemotretan dilakukan di lokasi pilihan Anda. Setelah selesai, foto dikirim lewat tautan unduhan paling lama tujuh hari.',
      contact: {
        whatsapp: '085611223344',
        phone: '',
        email: 'halo@sejaranfoto.id',
        address: 'Yogyakarta',
        mapsUrl: '',
        instagram: '@sejaranfoto',
        openingHours: 'Booking minimal H-3',
      },
    },
  },
  {
    id: 'undangan-acara',
    label: 'Undangan acara',
    description: 'Detail acara, lokasi, jam, dan konfirmasi hadir lewat WhatsApp.',
    icon: 'mail',
    draft: {
      businessCategory: 'lainnya',
      goal: 'kumpulkan-kontak',
      styles: ['Mewah', 'Elegan'],
      palettePreset: 'gelap-mewah',
      primaryColor: '#1E40AF',
      accentColor: '#D4AF37',
      sections: ['hero', 'about', 'hours', 'gallery', 'faq', 'cta', 'contact', 'footer'],
      description:
        'Undangan pernikahan kami. Tamu bisa melihat detail acara, membuka peta lokasi, lalu mengonfirmasi kehadiran lewat WhatsApp kami. Mohon konfirmasi sebelum tanggal 20 Mei 2026.',
      contact: {
        whatsapp: '081355667788',
        phone: '',
        email: '',
        address: 'Gedung Serbaguna Mutiara, Jl. Melati No. 4, Semarang',
        mapsUrl: '',
        instagram: '',
        openingHours: 'Sabtu, 12 Juni 2026, 10.00-14.00',
      },
    },
  },
  {
    id: 'portofolio',
    label: 'Portofolio',
    description: 'Menampilkan karya dan cara menghubungi untuk pesanan baru.',
    icon: 'palette',
    draft: {
      businessCategory: 'kreatif',
      goal: 'pamerkan-karya',
      styles: ['Minimalis', 'Modern'],
      palettePreset: 'netral',
      primaryColor: '#111111',
      accentColor: '#D1D5DB',
      sections: ['hero', 'about', 'gallery', 'benefits', 'cta', 'contact', 'footer'],
      description:
        'Desainer grafis freelance yang mengerjakan identitas visual, logo, dan materi promosi untuk usaha kecil. Fokus saya pada desain yang sederhana tapi mudah diingat.',
      contact: {
        whatsapp: '081377889900',
        phone: '',
        email: 'halo@studioaris.id',
        address: 'Surabaya',
        mapsUrl: '',
        instagram: '@studioaris',
        openingHours: '',
      },
    },
  },
  {
    id: 'kelas-les',
    label: 'Jasa / Les',
    description: 'Program belajar, biaya, jadwal, dan pendaftaran lewat WhatsApp.',
    icon: 'graduation-cap',
    draft: {
      businessCategory: 'pendidikan',
      goal: 'terima-reservasi',
      styles: ['Profesional', 'Hangat'],
      palettePreset: 'netral',
      primaryColor: '#4D7C0F',
      accentColor: '#FFF7ED',
      sections: defaultSectionsFor('pendidikan'),
      description:
        'Kursus privat matematika untuk siswa SMA dan mahasiswa yang kesulitan soal cerita. Satu pertemuan 90 menit, maksimal empat murid agar semua bisa ikut berdiskusi. Bisa lewat Zoom atau datang ke rumah.',
      contact: {
        whatsapp: '081222334455',
        phone: '',
        email: 'daftar@kelasmatematika.id',
        address: 'Kota Bandung',
        mapsUrl: '',
        instagram: '@kelasmatematika',
        openingHours: 'Senin-Sabtu, 16.00-20.00',
      },
    },
  },
]

/** Template berdasarkan id; undefined bila tidak dikenal. */
export function getTemplate(id: string): BriefTemplate | undefined {
  return BRIEF_TEMPLATES.find((t) => t.id === id)
}

/**
 * Gabungkan template ke draft yang sudah ada.
 * - Teks bebas yang sudah diisi user TIDAK ditimpa.
 * - Field struktural (kategori, tujuan, gaya, palet, bagian, kontak) diisi dari
 *   template HANYA bila masih kosong, jadi pilihan lama user tetap dihormati.
 */
export function applyTemplate(current: BriefDraft, template: BriefTemplate): BriefDraft {
  const patch = template.draft
  const patchContact: Partial<BriefDraft['contact']> = patch.contact ?? {}

  // Warna dari createEmptyBrief() — jika current masih sama dengan ini,
  // berarti user belum mengetik warna sendiri dan template boleh menimpa.
  const defaults = createEmptyBrief()
  const colorUntouched =
    current.primaryColor === defaults.primaryColor &&
    current.accentColor === defaults.accentColor

  const next: BriefDraft = {
    ...current,
    description: current.description.trim() ? current.description : (patch.description ?? ''),
    brandName: current.brandName.trim() ? current.brandName : (patch.brandName ?? ''),
    audience: current.audience.trim() ? current.audience : (patch.audience ?? ''),
    extraNotes: current.extraNotes.trim() ? current.extraNotes : (patch.extraNotes ?? ''),
    businessCategory: current.businessCategory || patch.businessCategory || '',
    goal: current.goal || patch.goal || '',
    styles: current.styles.length > 0 ? current.styles : (patch.styles ?? []),
    palettePreset: current.palettePreset || patch.palettePreset || '',
    primaryColor: colorUntouched ? (patch.primaryColor ?? current.primaryColor) : current.primaryColor,
    accentColor: colorUntouched ? (patch.accentColor ?? current.accentColor) : current.accentColor,
    colorMode:
      current.colorMode === 'custom' || patch.palettePreset ? 'custom' : 'ai',
    sections: current.sections.length > 0 ? current.sections : (patch.sections ?? []),
    contact: { ...current.contact },
  }

  for (const key of Object.keys(patchContact) as Array<keyof BriefDraft['contact']>) {
    if (!next.contact[key]) next.contact[key] = patchContact[key] ?? ''
  }

  return next
}

/** Draft baru dari sebuah template. */
export function draftFromTemplate(template: BriefTemplate): BriefDraft {
  return applyTemplate(createEmptyBrief(), template)
}

/** Warna utama/aksen dari id palet; null bila id tidak dikenal. */
export function paletteColors(
  presetId: string,
): { primary: string; accent: string } | null {
  const preset = PALETTE_PRESETS.find((p) => p.id === presetId)
  if (!preset) return null
  return { primary: preset.primary, accent: preset.accent }
}