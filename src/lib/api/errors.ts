import { ApiError } from './client'

// ── Pesan 401 (hanya untuk 401, dibedakan via message persis — api.md §9.1) ──

export const AUTH_EXPIRED_MESSAGE = 'Authentication token has expired'

/** Pesan 401 → aksi + pesan Indonesia. */
export function classifyAuthError(
  err: ApiError,
): { expired: boolean; message: string } | null {
  if (err.status !== 401 || err.code !== 'UNAUTHORIZED') return null
  if (err.message === AUTH_EXPIRED_MESSAGE) {
    return { expired: true, message: 'Sesi berakhir, silakan login kembali.' }
  }
  return { expired: false, message: 'Sesi tidak valid. Silakan login kembali.' }
}

// ── Varian 409 project (hanya dua pesan yang perlu mengarahkan UI) ──────────

export function isAlreadyGenerating(err: ApiError): boolean {
  return (
    err.status === 409 &&
    err.code === 'CONFLICT' &&
    err.message.includes('A generation is already in progress')
  )
}

export function isUseReviseInstead(err: ApiError): boolean {
  return (
    err.status === 409 &&
    err.code === 'CONFLICT' &&
    err.message.includes('Project already has a version')
  )
}

// ── Mapper reason AI_PROVIDER_ERROR → pesan Indonesia (api.md §9.3.1) ────────
// PENTING: switch berdasarkan `reason`, JANGAN berdasarkan teks message.

export interface ReasonInfo {
  message: string
  /** false → jangan tawarkan "Coba lagi" buta (OUTPUT_BLOCKED). */
  canRetry: boolean
}

const REASON_MAP: Record<string, ReasonInfo> = {
  PROVIDER_OVERLOADED: {
    message: 'Layanan AI sedang sibuk, coba lagi beberapa saat.',
    canRetry: true,
  },
  STREAM_TIMEOUT: {
    message: 'Proses AI kehabisan waktu, coba lagi. Tidak perlu mengubah input.',
    canRetry: true,
  },
  STREAM_STALLED: {
    message: 'Koneksi AI terputus, coba lagi.',
    canRetry: true,
  },
  OUTPUT_TRUNCATED: {
    message: 'Hasil AI terpotong, coba lagi.',
    canRetry: true,
  },
  OUTPUT_BLOCKED: {
    message: 'Permintaan ditolak filter keamanan. Ubah deskripsi atau instruksi Anda.',
    canRetry: false,
  },
  STREAM_INTERRUPTED: {
    message: 'Koneksi AI terputus, coba lagi.',
    canRetry: true,
  },
  INVALID_OUTPUT: {
    message: 'Hasil AI tidak valid, coba lagi.',
    canRetry: true,
  },
  PROVIDER_ERROR: {
    message: 'Layanan AI mengalami gangguan, coba lagi.',
    canRetry: true,
  },
}

export function reasonInfo(reason?: string): ReasonInfo {
  if (reason && REASON_MAP[reason]) return REASON_MAP[reason]
  return REASON_MAP.PROVIDER_ERROR
}

// ── Mapper umum error → pesan Indonesia (satu tempat) ───────────────────────

export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'NETWORK_ERROR':
        return err.message
      case 'VALIDATION_ERROR':
        return 'Periksa kembali isian formulir Anda.';
      case 'BAD_REQUEST':
        return 'Permintaan tidak valid. Periksa kembali data yang dikirim.';
      case 'UNAUTHORIZED': {
        // 401 login form: kredensial salah (bukan masalah token).
        if (err.message === 'Invalid email or password') {
          return 'Email atau kata sandi salah.';
        }
        const classified = classifyAuthError(err)
        if (classified) return classified.message
        return 'Sesi tidak valid. Silakan login kembali.';
      }
      case 'NOT_FOUND':
        return 'Data tidak ditemukan. Mungkin sudah dihapus atau bukan milik Anda.';
      case 'METHOD_NOT_ALLOWED':
        return 'Aksi tidak didukung untuk alamat ini.';
      case 'CONFLICT':
        if (isAlreadyGenerating(err)) {
          return 'Proses AI sedang berjalan untuk project ini. Tunggu hingga selesai.'
        }
        if (isUseReviseInstead(err)) {
          return 'Project ini sudah punya versi. Gunakan revisi, bukan generate ulang.'
        }
        if (err.message.includes('already exists')) {
          return 'Email sudah terdaftar. Silakan masuk.';
        }
        return 'Terjadi konflik. Muat ulang halaman lalu coba lagi.';
      case 'RATE_LIMITED': {
        const wait = err.retryAfter ?? 60
        return `Terlalu banyak permintaan. Coba lagi dalam ${wait} detik.`
      }
      case 'AI_PROVIDER_ERROR':
        return reasonInfo(err.reason).message
      case 'SERVICE_UNAVAILABLE':
        return 'Layanan sedang tidak tersedia. Coba lagi beberapa saat.';
      case 'DATABASE_ERROR':
      case 'INTERNAL_SERVER_ERROR':
        return 'Terjadi kesalahan pada server. Coba lagi beberapa saat.';
      default:
        return 'Terjadi kesalahan. Coba lagi beberapa saat.';
    }
  }
  if (err instanceof DOMException && err.name === 'AbortError') {
    return 'Dibatalkan.';
  }
  if (err instanceof Error && err.message) return err.message
  return 'Terjadi kesalahan tak terduga.'
}

/** Ambil hitung mundur detik dari error 429 (default 60, sesuai backend). */
export function getRetryAfter(err: unknown): number {
  if (err instanceof ApiError && err.code === 'RATE_LIMITED') {
    return err.retryAfter ?? 60
  }
  return 60
}

/** Apakah error ini membolehkan tombol "Coba lagi". */
export function canRetryError(err: unknown): boolean {
  if (err instanceof ApiError && err.code === 'AI_PROVIDER_ERROR') {
    return reasonInfo(err.reason).canRetry
  }
  return true
}
