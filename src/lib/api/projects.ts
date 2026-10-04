import { api, ApiError, apiUrl } from './client'
import { getToken } from './token'
import type {
  ApiResponse,
  Brief,
  CreateProjectRequest,
  ProjectAttachment,
  ProjectDetail,
  ProjectSummary,
  Version,
  VersionListItem,
} from '@/types/api'

export type {
  Brief,
  CreateProjectRequest,
  ProjectAttachment,
  ProjectDetail,
  ProjectSummary,
  Version,
  VersionListItem,
}

// Batas klien (sama dengan default backend — api.md §7, §9.5).
export const MAX_IMAGES_PER_REQUEST = 4
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10 MB
export const ACCEPTED_IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

/**
 * Ambil nama file dari header Content-Disposition (RFC 6266/5987).
 * Prioritas: `filename*=UTF-8''...` (di-decode aman) → `filename="..."` →
 * fallback default. Hasil disanitasi dari karakter terlarang nama file.
 */
export function parseDispositionFilename(
  disposition: string,
  fallback: string,
): string {
  const extended = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition)
  if (extended?.[1]) {
    try {
      const decoded = decodeURIComponent(extended[1].trim().replace(/^"|"$/g, ''))
      const clean = sanitizeFilename(decoded)
      if (clean) return clean
    } catch {
      // Lanjut ke filename biasa.
    }
  }
  const quoted = /filename\s*=\s*"([^"]+)"/i.exec(disposition)
  if (quoted?.[1]) {
    const clean = sanitizeFilename(quoted[1])
    if (clean) return clean
  }
  const bare = /filename\s*=\s*([^;]+)/i.exec(disposition)
  if (bare?.[1]) {
    const clean = sanitizeFilename(bare[1].trim().replace(/^"|"$/g, ''))
    if (clean) return clean
  }
  return fallback
}

/** Buang karakter terlarang untuk nama file (/ \ : * ? " < > | dan kontrol). */
export function sanitizeFilename(name: string): string {
  const withoutForbidden = name.replace(/[/\\:*?"<>|]/g, '')
  // Buang karakter kontrol (U+0000–U+001F, U+007F) per kode-poin
  // agar tidak memakai regex karakter kontrol.
  let out = ''
  for (const ch of withoutForbidden) {
    const code = ch.codePointAt(0) ?? 32
    if (code >= 32 && code !== 127) out += ch
  }
  const clean = out.trim()
  return clean.length > 0 ? clean : ''
}

/** Satu halaman project beserta penanda ada-tidaknya halaman berikut. */
export interface ProjectPage {
  items: ProjectSummary[]
  hasMore: boolean
}

/**
 * Ubah hasil fetch mentah (maks `limit + 1` item) menjadi satu halaman.
 * Murni (tanpa I/O) agar mudah diuji.
 */
export function toProjectPage(fetched: ProjectSummary[], limit: number): ProjectPage {
  const safeLimit = Math.max(1, limit)
  if (fetched.length > safeLimit) {
    return { items: fetched.slice(0, safeLimit), hasMore: true }
  }
  return { items: fetched, hasMore: false }
}

export interface ImageValidationResult {
  valid: File[]
  errors: string[]
}

/**
 * Validasi file gambar di klien SEBELUM dikirim.
 * Aturan: maks 4 file, ≤10 MB per file, hanya JPEG/PNG/WebP.
 */
export function validateImageFiles(files: FileList | File[]): ImageValidationResult {
  const list = Array.from(files)
  const errors: string[] = []
  const valid: File[] = []

  if (list.length > MAX_IMAGES_PER_REQUEST) {
    errors.push(`Maksimal ${MAX_IMAGES_PER_REQUEST} gambar per permintaan.`)
  }

  for (const file of list.slice(0, MAX_IMAGES_PER_REQUEST)) {
    if (!ACCEPTED_IMAGE_MIMES.includes(file.type.toLowerCase())) {
      errors.push(`"${file.name}": format harus JPEG, PNG, atau WebP.`)
      continue
    }
    if (file.size > MAX_IMAGE_BYTES) {
      errors.push(`"${file.name}": ukuran melebihi 10 MB.`)
      continue
    }
    valid.push(file)
  }

  return { valid, errors }
}

export const projectsApi = {
  /** POST /api/v1/projects — hanya menyimpan brief, tanpa memanggil AI. */
  create: async (payload: CreateProjectRequest): Promise<ProjectSummary> => {
    const res = await api.post<ApiResponse<ProjectSummary>>('/projects', payload)
    return res.data
  },

  /** GET /api/v1/projects?limit&offset — item TANPA latest_version. */
  list: async (limit = 20, offset = 0): Promise<ProjectSummary[]> => {
    const safeLimit = Math.max(1, Math.min(100, limit))
    const safeOffset = Math.max(0, offset)
    const res = await api.get<ApiResponse<ProjectSummary[]>>(
      `/projects?limit=${safeLimit}&offset=${safeOffset}`,
    )
    return res.data ?? []
  },

  /**
   * Satu halaman list beserta penanda `hasMore`.
   * Backend belum menyediakan `total`/`has_more` (tugas backend terpisah),
   * jadi strategi limit+1: minta satu item ekstra, tampilkan `limit` item,
   * dan pakai keberadaan item ekstra hanya sebagai penanda halaman berikut.
   */
  listPage: async (limit = 20, offset = 0): Promise<ProjectPage> => {
    const safeLimit = Math.max(1, Math.min(100, limit))
    const fetched = await projectsApi.list(safeLimit + 1, offset)
    return toProjectPage(fetched, safeLimit)
  },

  /** GET /api/v1/projects/{id} — detail + latest_version (dengan html). */
  get: async (id: string): Promise<ProjectDetail> => {
    const res = await api.get<ApiResponse<ProjectDetail>>(`/projects/${id}`)
    return res.data
  },

  /** PATCH /api/v1/projects/{id} — 409 bila generating. */
  rename: async (id: string, title: string): Promise<ProjectSummary> => {
    const res = await api.patch<ApiResponse<ProjectSummary>>(`/projects/${id}`, { title })
    return res.data
  },

  /** DELETE /api/v1/projects/{id} — data null; 409 bila generating. */
  remove: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/projects/${id}`)
  },

  /** GET /api/v1/projects/{id}/versions — terbaru dulu, TANPA html. */
  listVersions: async (projectId: string): Promise<VersionListItem[]> => {
    const res = await api.get<ApiResponse<VersionListItem[]>>(`/projects/${projectId}/versions`)
    return res.data ?? []
  },

  /** GET /api/v1/projects/{id}/versions/{n} — lengkap DENGAN html. */
  getVersion: async (projectId: string, versionNumber: number): Promise<Version> => {
    const res = await api.get<ApiResponse<Version>>(
      `/projects/${projectId}/versions/${versionNumber}`,
    )
    return res.data
  },

  /**
   * GET /api/v1/projects/{id}/export?version=n — file .html (BUKAN JSON).
   * Mengembalikan { blob, filename }. Periksa res.ok dulu karena error
   * berbentuk JSON (400/404). Nama file dari header Content-Disposition
   * (di-expose via CORS); fallback "website-v{n}.html".
   */
  exportHtml: async (
    projectId: string,
    versionNumber?: number,
    fetchFn: typeof fetch = fetch,
  ): Promise<{ blob: Blob; filename: string }> => {
    const token = getToken()
    const query = versionNumber ? `?version=${versionNumber}` : ''
    const res = await fetchFn(apiUrl(`/projects/${projectId}/export${query}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      let message = res.statusText || `HTTP ${res.status}`
      let code = 'INTERNAL_SERVER_ERROR'
      try {
        const errJson = (await res.json()) as {
          success: boolean
          error?: { code?: string; message?: string }
        }
        if (errJson.error) {
          message = errJson.error.message || message
          code = errJson.error.code || code
        }
      } catch {
        // Biarkan message default.
      }
      throw new ApiError(res.status, message, code as 'NOT_FOUND')
    }
    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition') ?? ''
    const filename = parseDispositionFilename(
      disposition,
      `website-v${versionNumber ?? 'latest'}.html`,
    )
    return { blob, filename }
  },

  /** GET /api/v1/projects/{id}/attachments */
  listAttachments: async (projectId: string): Promise<ProjectAttachment[]> => {
    const res = await api.get<ApiResponse<ProjectAttachment[]>>(
      `/projects/${projectId}/attachments`,
    )
    return res.data ?? []
  },

  /**
   * GET /api/v1/projects/{id}/attachments/{attachmentId} — biner gambar.
   * Diambil via fetch + Authorization lalu blob URL (jangan taruh token di URL).
   * Pemanggil WAJIB revoke URL via URL.revokeObjectURL saat tidak dipakai.
   */
  attachmentBlobUrl: async (
    projectId: string,
    attachmentId: string,
    fetchFn: typeof fetch = fetch,
  ): Promise<string> => {
    const token = getToken()
    const res = await fetchFn(apiUrl(`/projects/${projectId}/attachments/${attachmentId}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      throw new ApiError(res.status, 'Gambar tidak ditemukan.', 'NOT_FOUND')
    }
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  },
}
