import type { BriefDraft } from './types'
import { API_LIMITS } from './types'
import { toApiSectionNames } from './sections-catalog'
import { normalizeHex, describeColor } from './color-names'
import { sanitizeText, sanitizeMultiline } from './sanitize'
import {
  normalizePhoneNumber,
  toWaMeUrl,
  normalizeWebUrl,
  instagramDisplay,
} from './contact'
import type { CreateProjectRequest, WebsiteType } from '@/types/api'

/**
 * Pemetaan BriefDraft -> CreateProjectRequest.
 *
 * WAJIB SENGAJA: backend hanya menerima field yang sudah ada
 * (title, brief.description, brief.website_type, brief.business_name,
 * brief.style, brief.color_palette, brief.language, brief.sections).
 * Tidak ada field baru yang dikirim.
 *
 * Field kosong dikirim sebagai undefined (tidak pernah string kosong):
 * Fase 0 membuktikan string kosong diterima backend tapi diabaikan, jadi
 * lebih baik tidak mengirim sama sekali.
 */

/**
 * Kalimat tetap yang menempel di setiap brief. Menjelaskan batas website
 * statis supaya AI tidak membuat formulir, keranjang, atau login.
 */
export const STATIC_SITE_NOTE =
  'Website berupa halaman statis. Tombol kontak memakai tautan WhatsApp/email/telepon, bukan formulir. Semua tautan eksternal dibuka di tab baru (target=_blank rel=noopener noreferrer).'

const CATEGORY_LABELS: Record<string, string> = {
  kuliner: 'makanan dan minuman (kuliner)',
  fashion: 'pakaian dan aksesori (fashion)',
  jasa: 'jasa',
  pendidikan: 'pendidikan dan pelatihan',
  kesehatan: 'kesehatan',
  kreatif: 'kreatif dan desain',
  'toko-online': 'toko online',
  lainnya: 'lainnya',
}

const GOAL_LABELS: Record<string, string> = {
  'terima-pesanan': 'menerima pesanan dari pengunjung',
  'perkenalkan-usaha': 'memperkenalkan usaha kepada masyarakat luas',
  'kumpulkan-kontak': 'mengumpulkan kontak calon pelanggan',
  'pamerkan-karya': 'memamerkan karya atau hasil kerja',
  'terima-reservasi': 'menerima reservasi atau pendaftaran',
}

/**
 * Saran jenis website (website_type) dari jenis usaha. Hanya memakai nilai
 * yang diterima backend; '' berarti biarkan server (default landing_page).
 */
const CATEGORY_TO_WEBSITE_TYPE: Record<string, WebsiteType> = {
  kuliner: 'landing_page',
  fashion: 'online_store',
  jasa: 'company_profile',
  pendidikan: 'landing_page',
  kesehatan: 'company_profile',
  kreatif: 'portfolio',
  'toko-online': 'online_store',
  lainnya: 'landing_page',
}

/** Saran website_type untuk sebuah kategori usaha. */
export function suggestWebsiteType(category: BriefDraft['businessCategory']): WebsiteType | '' {
  if (!category) return ''
  return CATEGORY_TO_WEBSITE_TYPE[category] ?? ''
}

export interface BuildPayloadResult {
  payload: CreateProjectRequest
  /** True bila ada isi brief yang dipangkas agar muat 4000 karakter. */
  trimmed: boolean
  /** Panjang deskripsi final yang dikirim (karakter). */
  descriptionLength: number
  /** Nama warna hasil describeColor, untuk ditampilkan UI. */
  colors: {
    primary: { name: string; hex: string } | null
    accent: { name: string; hex: string } | null
  }
}

/** Label jenis usaha untuk baris "Jenis usaha:". */
export function categoryLabel(category: BriefDraft['businessCategory']): string {
  if (!category) return ''
  return CATEGORY_LABELS[category] ?? category
}

/** Label tujuan untuk baris "Tujuan utama website:". */
export function goalLabel(goal: BriefDraft['goal']): string {
  if (!goal) return ''
  return GOAL_LABELS[goal] ?? goal
}

/**
 * Baris "Kontak: ..." dari data kontak. Hanya memuat bagian yang ada isinya;
 * tidak pernah menghasilkan label kosong atau ": " tanpa isi.
 */
export function buildContactLine(draft: BriefDraft): string {
  const parts: string[] = []
  const c = draft.contact

  if (c.whatsapp.trim()) {
    const international = normalizePhoneNumber(c.whatsapp)
    const wa = toWaMeUrl(c.whatsapp)
    if (international && wa) parts.push(`WhatsApp ${international} (${wa})`)
    else if (international) parts.push(`WhatsApp ${international}`)
  }
  if (c.phone.trim()) {
    const tel = normalizePhoneNumber(c.phone)
    if (tel) parts.push(`telepon ${tel}`)
  }
  if (c.email.trim()) {
    parts.push(`email ${sanitizeText(c.email)}`)
  }
  if (c.instagram.trim()) {
    const display = instagramDisplay(c.instagram)
    if (display) parts.push(`Instagram ${display}`)
  }
  if (c.address.trim()) {
    parts.push(`alamat ${sanitizeMultiline(c.address).replace(/\n/g, ', ')}`)
  }
  if (c.mapsUrl.trim()) {
    const url = normalizeWebUrl(c.mapsUrl)
    if (url) parts.push(`peta ${url}`)
  }
  if (c.openingHours.trim()) {
    parts.push(`jam buka ${sanitizeText(c.openingHours)}`)
  }

  if (parts.length === 0) return ''
  return `Kontak: ${parts.join('; ')}.`
}

/**
 * Rakit blok teks deskripsi dari draft (tanpa memangkas).
 * `compact` memakai satu baris kosong sebagai pemisah — dipakai sebagai tahap
 * pemangkasan terakhir sebelum menyentuh kalimat user.
 */
function assemble(userText: string, draft: BriefDraft, compact = false): string {
  const lines: string[] = []
  if (userText) lines.push(userText)

  const category = categoryLabel(draft.businessCategory)
  if (category) lines.push(`Jenis usaha: ${category}.`)

  const goal = goalLabel(draft.goal)
  if (goal) lines.push(`Tujuan utama website: ${goal}.`)

  const audience = sanitizeText(draft.audience)
  if (audience) lines.push(`Target pengunjung: ${audience}.`)

  const contactLine = buildContactLine(draft)
  if (contactLine) lines.push(contactLine)

  const notes = sanitizeMultiline(draft.extraNotes)
  if (notes) lines.push(`Catatan tambahan: ${notes}`)

  lines.push(STATIC_SITE_NOTE)
  return lines.join(compact ? '\n' : '\n\n')
}

/**
 * Susun deskripsi terstruktur (maksimal 4000 karakter).
 *
 * Pemangkasan dilakukan berurutan dari prioritas TERENDAH:
 * 1. catatan tambahan, 2. target pengunjung,
 * 3. kontak sekunder (peta, jam buka, telepon), 4. alamat.
 * Kalimat user dan catatan website statis TIDAK PERNAH dipangkas; bila
 * setelah semua itu masih melebihi batas, teks digabung dan hanya label
 *_tail_ yang dipotong — kasus ini dicegah di UI lewat batas textarea.
 */
export function buildDescription(draft: BriefDraft): { text: string; trimmed: boolean } {
  const userText = sanitizeMultiline(draft.description)
  const limit = API_LIMITS.description

  const full = assemble(userText, draft)
  if (full.length <= limit) return { text: full, trimmed: false }

  const stages: Array<Partial<Pick<BriefDraft, 'extraNotes' | 'audience' | 'contact'>>> = [
    { extraNotes: '' },
    { audience: '' },
    { contact: { ...draft.contact, phone: '', mapsUrl: '', openingHours: '' } },
    { contact: { ...draft.contact, address: '' } },
  ]

  let current: BriefDraft = draft
  for (const patch of stages) {
    current = { ...current, ...patch, contact: { ...current.contact, ...(patch.contact ?? {}) } }
    const candidate = assemble(userText, current)
    if (candidate.length <= limit) return { text: candidate, trimmed: true }
  }

  // Tahap akhir sebelum menyentuh kalimat user: rapatkan pemisah baris.
  const compacted = assemble(userText, current, true)
  if (compacted.length <= limit) return { text: compacted, trimmed: true }

  // Terakhir: buang seluruh label, pertahankan kalimat user + catatan statis.
  const bare = [userText, STATIC_SITE_NOTE].filter(Boolean).join('\n\n')
  if (bare.length <= limit) return { text: bare, trimmed: true }

  // Jaring pengaman: kalimat user sendiri melebihi 4000 karakter. Ekor
  // kalimat dipotong; catatan statis tetap disertakan.
  const roomForNote = STATIC_SITE_NOTE.length + 2
  const keep = Math.max(0, limit - roomForNote)
  const head = userText.slice(0, keep).replace(/\s+\S*$/, '')
  return { text: `${head}\n\n${STATIC_SITE_NOTE}`, trimmed: true }
}

/**
 * "warna utama: cokelat tua (#6F4E37); warna aksen: krem (#F5E6D3)".
 * undefined bila colorMode 'ai' atau kedua warna kosong/tidak valid.
 * Batas color_palette 200 karakter — format ini hanya ±70 karakter.
 */
export function buildColorPalette(draft: BriefDraft): string | undefined {
  if (draft.colorMode !== 'custom') return undefined
  const parts: string[] = []
  const primary = normalizeHex(draft.primaryColor)
  const accent = normalizeHex(draft.accentColor)
  if (primary) {
    const name = describeColor(primary)
    parts.push(`warna utama: ${name ? name.name : primary} (${primary})`)
  }
  if (accent) {
    const name = describeColor(accent)
    parts.push(`warna aksen: ${name ? name.name : accent} (${accent})`)
  }
  if (parts.length === 0) return undefined
  const text = parts.join('; ')
  return text.length > API_LIMITS.colorPalette
    ? text.slice(0, API_LIMITS.colorPalette)
    : text
}

/** Chip gaya digabung dengan koma; undefined bila kosong. */
export function buildStyle(draft: BriefDraft): string | undefined {
  const seen = new Set<string>()
  const unique: string[] = []
  for (const raw of draft.styles) {
    const chip = sanitizeText(raw)
    if (!chip) continue
    const key = chip.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(chip)
  }
  if (unique.length === 0) return undefined
  const text = unique.join(', ')
  return text.length > API_LIMITS.style ? text.slice(0, API_LIMITS.style) : text
}

/** website_type: '' berarti biarkan server (default landing_page). */
export function buildWebsiteType(draft: BriefDraft): WebsiteType | undefined {
  return draft.websiteType || undefined
}

/**
 * Fungsi pemetaan utama (murni): draft -> payload POST /projects.
 */
export function buildProjectPayload(draft: BriefDraft): BuildPayloadResult {
  const { text, trimmed } = buildDescription(draft)
  const description = text.slice(0, API_LIMITS.description)

  const brief: CreateProjectRequest['brief'] = { description }

  const businessName = sanitizeText(draft.brandName).slice(0, API_LIMITS.businessName)
  if (businessName) brief.business_name = businessName

  const style = buildStyle(draft)
  if (style) brief.style = style

  const colorPalette = buildColorPalette(draft)
  if (colorPalette) brief.color_palette = colorPalette

  const websiteType = buildWebsiteType(draft)
  if (websiteType) brief.website_type = websiteType

  if (draft.language === 'id' || draft.language === 'en') brief.language = draft.language

  const sections = toApiSectionNames(draft.sections)
  if (sections.length > 0) brief.sections = sections

  const payload: CreateProjectRequest = { brief }

  const title = sanitizeText(draft.title).slice(0, API_LIMITS.title)
  if (title) payload.title = title

  return {
    payload,
    trimmed,
    descriptionLength: description.length,
    colors: {
      primary: describeColor(draft.primaryColor),
      accent: describeColor(draft.accentColor),
    },
  }
}