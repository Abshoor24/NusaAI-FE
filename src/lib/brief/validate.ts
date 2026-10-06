import { sanitizeText, sanitizeMultiline } from './sanitize'
import { isHexColor } from './color-names'
import {
  normalizePhoneNumber,
  normalizeWebUrl,
  toInstagramUrl,
  instagramDisplay,
} from './contact'
import type { BriefErrors } from './errors'

/**
 * Validasi field brief (teks bebas + kontak + warna).
 * Semua field opsional KECUALI description. Field kosong tidak error.
 * Fungsi murni: tanpa DOM, tanpa I/O.
 */

export const BRIEF_TEXT_LIMITS = {
  title: 200,
  brandName: 120,
  audience: 200,
  extraNotes: 1000,
  address: 200,
  openingHours: 120,
} as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Instagram: "@nama", "nama", atau URL http/https lengkap. */
export function isValidInstagram(value: string): boolean {
  return toInstagramUrl(value) !== null
}

/** 9-15 digit setelah normalisasi. */
export function isValidPhoneDigits(digits: string): boolean {
  return digits.length >= 9 && digits.length <= 15
}

/** Validasi satu blok kontak (nomor, email, tautan). */
export function validateContact(input: {
  whatsapp: string
  phone: string
  email: string
  mapsUrl: string
  instagram: string
}): BriefErrors {
  const errors: BriefErrors = {}

  const wa = sanitizeText(input.whatsapp)
  if (wa && normalizePhoneNumber(wa) === null) {
    errors.whatsapp = 'Nomor WhatsApp belum lengkap. Contoh: 08123456789'
  }

  const phone = sanitizeText(input.phone)
  if (phone && normalizePhoneNumber(phone) === null) {
    errors.phone = 'Nomor telepon belum lengkap. Contoh: 08123456789'
  }

  const email = sanitizeText(input.email)
  if (email && !EMAIL_RE.test(email)) {
    errors.email = 'Format email belum benar. Contoh: info@contoh.com'
  }

  const maps = sanitizeText(input.mapsUrl)
  if (maps && normalizeWebUrl(maps) === null) {
    errors.mapsUrl = 'Tautan lokasi harus diawali http:// atau https://'
  }

  const instagram = sanitizeText(input.instagram)
  if (instagram && !isValidInstagram(instagram)) {
    errors.instagram = 'Tautan Instagram belum benar. Contoh: @namatoko'
  }

  return errors
}

export interface ValidateBriefInput {
  title: string
  description: string
  brandName: string
  audience: string
  extraNotes: string
  primaryColor: string
  accentColor: string
  colorMode: 'ai' | 'custom'
  contact: {
    whatsapp: string
    phone: string
    email: string
    address: string
    mapsUrl: string
    instagram: string
    openingHours: string
  }
}

export interface ValidateBriefOptions {
  minDescriptionLength: number
  maxDescriptionLength: number
}

export const DEFAULT_VALIDATE_OPTIONS: ValidateBriefOptions = {
  minDescriptionLength: 10,
  maxDescriptionLength: 3600,
}

/** Validasi seluruh brief; `errors.description` hanya muncul bila bermasalah. */
export function validateBrief(
  input: ValidateBriefInput,
  options: ValidateBriefOptions = DEFAULT_VALIDATE_OPTIONS,
): BriefErrors {
  const errors: BriefErrors = {}

  const description = sanitizeMultiline(input.description)
  if (description.length < options.minDescriptionLength) {
    errors.description = `Ceritakan usaha kamu minimal ${options.minDescriptionLength} karakter.`
  } else if (description.length > options.maxDescriptionLength) {
    errors.description = `Deskripsi maksimal ${options.maxDescriptionLength} karakter.`
  }

  const title = sanitizeText(input.title)
  if (title.length > BRIEF_TEXT_LIMITS.title) {
    errors.title = `Judul maksimal ${BRIEF_TEXT_LIMITS.title} karakter.`
  }

  const brandName = sanitizeText(input.brandName)
  if (brandName.length > BRIEF_TEXT_LIMITS.brandName) {
    errors.brandName = `Nama usaha maksimal ${BRIEF_TEXT_LIMITS.brandName} karakter.`
  }

  const audience = sanitizeText(input.audience)
  if (audience.length > BRIEF_TEXT_LIMITS.audience) {
    errors.audience = `Target pengunjung maksimal ${BRIEF_TEXT_LIMITS.audience} karakter.`
  }

  const extraNotes = sanitizeMultiline(input.extraNotes)
  if (extraNotes.length > BRIEF_TEXT_LIMITS.extraNotes) {
    errors.extraNotes = `Catatan tambahan maksimal ${BRIEF_TEXT_LIMITS.extraNotes} karakter.`
  }

  const address = sanitizeMultiline(input.contact.address)
  if (address.length > BRIEF_TEXT_LIMITS.address) {
    errors.address = `Alamat maksimal ${BRIEF_TEXT_LIMITS.address} karakter.`
  }

  const openingHours = sanitizeText(input.contact.openingHours)
  if (openingHours.length > BRIEF_TEXT_LIMITS.openingHours) {
    errors.openingHours = `Jam buka maksimal ${BRIEF_TEXT_LIMITS.openingHours} karakter.`
  }

  if (input.colorMode === 'custom') {
    const primary = sanitizeText(input.primaryColor)
    if (primary && !isHexColor(primary)) {
      errors.primaryColor = 'Warna utama harus berupa kode warna, contoh #6F4E37'
    }
    const accent = sanitizeText(input.accentColor)
    if (accent && !isHexColor(accent)) {
      errors.accentColor = 'Warna aksen harus berupa kode warna, contoh #F5E6D3'
    }
  }

  Object.assign(errors, validateContact(input.contact))

  return errors
}

export { instagramDisplay }