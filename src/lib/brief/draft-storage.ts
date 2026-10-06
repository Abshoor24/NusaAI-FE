import type { BriefDraft } from './types'
import { createEmptyBrief, MAX_STYLES, MAX_SECTIONS } from './types'
import { sanitizeSectionIds } from './sections-catalog'
import { normalizeHex } from './color-names'

/**
 * Draf form disimpan di sessionStorage (BUKAN localStorage) agar hilang saat
 * tab ditutup, tidak terbaca skrip lain, dan tidak ikut tersisa di perangkat.
 * - Tanpa gambar (File tidak bisa diserialisasi, dan aturan privasi).
 * - Semua akses dibungkus try/catch: mode privat / storage penuh tidak boleh
 *   menjatuhkan form.
 */

export const BRIEF_DRAFT_KEY = 'pakhir_brief_draft_v1'

/** Batas ukuran draf; protecting sessionStorage dari objek raksasa. */
const MAX_SERIALIZED = 200_000

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null
    return window.sessionStorage
  } catch {
    return null
  }
}

/**
 * Bentuk draf saat disimpan: WHITELIST field per field.
 * Menyusun ulang dari nol (bukan spread) supaya field asing — terutama
 * gambar referensi — tidak pernah ikut tersimpan di sessionStorage.
 */
function normalize(draft: BriefDraft): BriefDraft {
  const base = createEmptyBrief()
  const contact = draft.contact ?? base.contact
  const out: BriefDraft = {
    title: typeof draft.title === 'string' ? draft.title : base.title,
    description: typeof draft.description === 'string' ? draft.description : base.description,
    businessCategory: typeof draft.businessCategory === 'string' ? draft.businessCategory : base.businessCategory,
    goal: typeof draft.goal === 'string' ? draft.goal : base.goal,
    audience: typeof draft.audience === 'string' ? draft.audience : base.audience,
    brandName: typeof draft.brandName === 'string' ? draft.brandName : base.brandName,
    styles: Array.isArray(draft.styles)
      ? draft.styles.filter((s): s is string => typeof s === 'string').slice(0, MAX_STYLES)
      : base.styles,
    colorMode: draft.colorMode === 'custom' ? 'custom' : 'ai',
    primaryColor: typeof draft.primaryColor === 'string' ? draft.primaryColor : base.primaryColor,
    accentColor: typeof draft.accentColor === 'string' ? draft.accentColor : base.accentColor,
    palettePreset: typeof draft.palettePreset === 'string' ? draft.palettePreset : base.palettePreset,
    websiteType: typeof draft.websiteType === 'string' ? draft.websiteType : base.websiteType,
    language: typeof draft.language === 'string' ? draft.language : base.language,
    sections: sanitizeSectionIds(draft.sections).slice(0, MAX_SECTIONS),
    contact: {
      whatsapp: typeof contact.whatsapp === 'string' ? contact.whatsapp : base.contact.whatsapp,
      phone: typeof contact.phone === 'string' ? contact.phone : base.contact.phone,
      email: typeof contact.email === 'string' ? contact.email : base.contact.email,
      address: typeof contact.address === 'string' ? contact.address : base.contact.address,
      mapsUrl: typeof contact.mapsUrl === 'string' ? contact.mapsUrl : base.contact.mapsUrl,
      instagram: typeof contact.instagram === 'string' ? contact.instagram : base.contact.instagram,
      openingHours: typeof contact.openingHours === 'string' ? contact.openingHours : base.contact.openingHours,
    },
    extraNotes: typeof draft.extraNotes === 'string' ? draft.extraNotes : base.extraNotes,
  }
  const primary = normalizeHex(out.primaryColor)
  if (primary) out.primaryColor = primary
  const accent = normalizeHex(out.accentColor)
  if (accent) out.accentColor = accent
  return out
}

/** Simpan draf; return true bila berhasil. Tidak pernah melempar error. */
export function saveBriefDraft(draft: BriefDraft): boolean {
  const store = storage()
  if (!store) return false
  try {
    const payload = JSON.stringify(normalize(draft))
    if (payload.length > MAX_SERIALIZED) return false
    store.setItem(BRIEF_DRAFT_KEY, payload)
    return true
  } catch {
    return false
  }
}

/** Baca draf tersimpan; null bila tidak ada / rusak / bukan brief. */
export function loadBriefDraft(): BriefDraft | null {
  const store = storage()
  if (!store) return null
  try {
    const raw = store.getItem(BRIEF_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    return normalize(parsed as BriefDraft)
  } catch {
    return null
  }
}

/** Hapus draf (dipanggil saat submit berhasil, logout, dan 401 global). */
export function clearBriefDraft(): void {
  const store = storage()
  if (!store) return
  try {
    store.removeItem(BRIEF_DRAFT_KEY)
  } catch {
    // Diabaikan: tidak ada yang bisa dilakukan bila storage diblokir.
  }
}

/** Draf + template yang dipilih, untuk pemulihan tampilan "Mulai cepat". */
export interface LoadedDraft {
  draft: BriefDraft
  templateId: string
}

const TEMPLATE_KEY = 'pakhir_brief_template_v1'

export function saveSelectedTemplate(id: string): void {
  const store = storage()
  if (!store) return
  try {
    store.setItem(TEMPLATE_KEY, id)
  } catch {
    // Diabaikan.
  }
}

export function loadSelectedTemplate(): string {
  const store = storage()
  if (!store) return ''
  try {
    // Id diverifikasi bentuknya saja di sini (tanpa mengimpor templates.ts,
    // agar modul ini tetap bebas data berat); pemeriksa nama template ada di
    // applyTemplateToDraft.
    const id = store.getItem(TEMPLATE_KEY) ?? ''
    return /^[a-z-]{1,40}$/.test(id) ? id : ''
  } catch {
    return ''
  }
}