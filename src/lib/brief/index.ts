import type { BriefDraft } from './types'
import { sanitizeText } from './sanitize'
import { normalizePhoneNumber } from './contact'

export * from './types'
export * from './errors'
export * from './options'
export * from './sanitize'
export * from './color-names'
export * from './contact'
export * from './sections-catalog'
export * from './palettes'
export * from './templates'
export * from './validate'
export * from './build-payload'
export {
  BRIEF_DRAFT_KEY,
  saveBriefDraft,
  loadBriefDraft,
  clearBriefDraft,
  saveSelectedTemplate,
  loadSelectedTemplate,
} from './draft-storage'

/** Opsi gaya yang ditawarkan ke pengguna (chip, maksimal 3). */
export const STYLE_OPTIONS = [
  'Modern',
  'Minimalis',
  'Hangat',
  'Mewah',
  'Ceria',
  'Elegan',
  'Rustic',
  'Profesional',
] as const

export interface CompletenessResult {
  /** Persen 0..100. */
  percent: number
  /** Baris teks, mis. "Brief 70% lengkap". */
  label: string
  /** Saran satu baris untuk langkah berikutnya; '' bila sudah lengkap. */
  nextStep: string
  /** Rincian butir agar aturan mainnya transparan. */
  items: Array<{ label: string; done: boolean; points: number }>
}

/** Bobot tiap butir; total 100. */
const WEIGHTS = {
  description: 40,
  category: 10,
  goal: 10,
  brandName: 10,
  styles: 10,
  sections: 10,
  contact: 10,
} as const

/**
 * Penunjuk kelengkapan brief dengan aturan sederhana & transparan:
 * deskripsi 40, jenis usaha 10, tujuan 10, nama usaha 10, gaya 10,
 * bagian halaman 10, kontak WhatsApp 10. Warna selalu dianggap selesai
 * karena "biarkan AI yang memilih" juga sah.
 *
 * Tidak pernah memblokir submit.
 */
export function computeCompleteness(draft: BriefDraft): CompletenessResult {
  const desc = sanitizeText(draft.description)
  const descPartial = desc.length >= 10
  const descDone = desc.length >= 40
  const hasCategory = draft.businessCategory !== ''
  const hasGoal = draft.goal !== ''
  const hasBrand = draft.brandName.trim().length > 0
  const hasStyles = draft.styles.length > 0
  const hasSections = draft.sections.length > 0
  const hasContact = normalizePhoneNumber(draft.contact.whatsapp) !== null

  const items: CompletenessResult['items'] = [
    {
      label: descDone
        ? 'Deskripsi lengkap'
        : descPartial
          ? 'Deskripsi masih pendek'
          : 'Ceritakan usaha kamu',
      done: descDone,
      points: descDone
        ? WEIGHTS.description
        : descPartial
          ? Math.round(WEIGHTS.description / 2)
          : 0,
    },
    {
      label: 'Jenis usaha dipilih',
      done: hasCategory,
      points: hasCategory ? WEIGHTS.category : 0,
    },
    {
      label: 'Tujuan website dipilih',
      done: hasGoal,
      points: hasGoal ? WEIGHTS.goal : 0,
    },
    {
      label: 'Nama usaha terisi',
      done: hasBrand,
      points: hasBrand ? WEIGHTS.brandName : 0,
    },
    {
      label: 'Gaya dipilih',
      done: hasStyles,
      points: hasStyles ? WEIGHTS.styles : 0,
    },
    {
      label: 'Bagian halaman dipilih',
      done: hasSections,
      points: hasSections ? WEIGHTS.sections : 0,
    },
    {
      label: 'Nomor WhatsApp terisi',
      done: hasContact,
      points: hasContact ? WEIGHTS.contact : 0,
    },
  ]

  const points = items.reduce((sum, item) => sum + item.points, 0)
  const percent = Math.min(100, Math.round(points))

  let nextStep = ''
  if (!descPartial) {
    nextStep = 'Tulis deskripsi singkat: apa usahamu dan siapa pelanggannya.'
  } else if (!descDone) {
    nextStep = 'Deskripsi masih pendek. Tambahkan detail layanan atau pelangganmu.'
  } else if (!hasCategory) {
    nextStep = 'Pilih jenis usaha supaya AI tidak salah arah.'
  } else if (!hasGoal) {
    nextStep = 'Pilih tujuan utama website, misalnya menerima pesanan.'
  } else if (!hasSections) {
    nextStep = 'Pilih bagian halaman yang mau ditampilkan.'
  } else if (!hasContact) {
    nextStep = 'Isi nomor WhatsApp supaya ada tombol pemesan yang bisa diklik.'
  } else if (!hasStyles) {
    nextStep = 'Pilih gaya tampilan agar websitenya terasa milikmu.'
  } else if (!hasBrand) {
    nextStep = 'Tambahkan nama usaha agar tampil di judul website.'
  }

  return { percent, label: `Brief ${percent}% lengkap`, nextStep, items }
}