import { describe, it, expect } from 'vitest'
import { ApiError } from './client'
import { canRetryError, getErrorMessage, isAlreadyGenerating, isUseReviseInstead, reasonInfo } from './errors'

describe('reasonInfo (api.md §9.3.1)', () => {
  const cases: Array<[string, RegExp, boolean]> = [
    ['PROVIDER_OVERLOADED', /sibuk/, true],
    ['STREAM_TIMEOUT', /kehabisan waktu/, true],
    ['STREAM_STALLED', /terputus/, true],
    ['OUTPUT_TRUNCATED', /terpotong/, true],
    ['OUTPUT_BLOCKED', /filter keamanan/, false],
    ['STREAM_INTERRUPTED', /terputus/, true],
    ['INVALID_OUTPUT', /tidak valid/, true],
    ['PROVIDER_ERROR', /gangguan/, true],
  ]
  it.each(cases)('%s → pesan Indonesia, canRetry=%s', (reason, pattern, retry) => {
    const info = reasonInfo(reason)
    expect(info.message).toMatch(pattern)
    expect(info.canRetry).toBe(retry)
  })

  it('OUTPUT_BLOCKED tidak menawarkan coba lagi buta', () => {
    const err = new ApiError(502, 'blocked', 'AI_PROVIDER_ERROR', { reason: 'OUTPUT_BLOCKED' })
    expect(canRetryError(err)).toBe(false)
    expect(getErrorMessage(err)).toContain('Ubah deskripsi')
  })
})

describe('varian 409', () => {
  it('membedakan generating vs use-revise', () => {
    const generating = new ApiError(409, 'A generation is already in progress for this project', 'CONFLICT')
    const revise = new ApiError(409, 'Project already has a version, use revise instead', 'CONFLICT')
    expect(isAlreadyGenerating(generating)).toBe(true)
    expect(isAlreadyGenerating(revise)).toBe(false)
    expect(isUseReviseInstead(revise)).toBe(true)
    expect(isUseReviseInstead(generating)).toBe(false)
    expect(getErrorMessage(revise)).toContain('revisi')
  })
})

describe('getErrorMessage', () => {
  it('401 expired → pesan sesi berakhir', () => {
    const err = new ApiError(401, 'Authentication token has expired', 'UNAUTHORIZED')
    expect(getErrorMessage(err)).toContain('Sesi berakhir')
  })

  it('401 login → email atau kata sandi salah', () => {
    const err = new ApiError(401, 'Invalid email or password', 'UNAUTHORIZED')
    expect(getErrorMessage(err)).toContain('Email atau kata sandi salah')
  })

  it('429 memuat hitung mundur', () => {
    const err = new ApiError(429, 'slow', 'RATE_LIMITED', { retryAfter: 60 })
    expect(getErrorMessage(err)).toContain('60 detik')
  })

  it('500 generik tanpa detail internal', () => {
    const err = new ApiError(500, 'sql: something', 'DATABASE_ERROR')
    expect(getErrorMessage(err)).not.toContain('sql')
  })
})

/**
 * Tabel lengkap semua jalur pesan (Fase 3.3). Setiap baris menguji satu
 * kondisi: kode, status, pesan English dari backend, dan hasil Indonesia
 * yang diharapkan. Pesan mentah backend TIDAK BOLEH muncul di hasil.
 */
describe('tabel pesan error', () => {
  const cases: Array<{
    label: string
    err: unknown
    expect: RegExp
    /** Potongan yang tidak boleh bocor ke UI. */
    leak?: string
  }> = [
    {
      label: 'NETWORK_ERROR (jaringan putus)',
      err: new ApiError(0, 'Failed to fetch', 'NETWORK_ERROR'),
      expect: /Tidak dapat terhubung ke server\. Periksa koneksi internet/,
      leak: 'Failed to fetch',
    },
    {
      label: 'VALIDATION_ERROR',
      err: new ApiError(422, 'Validation failed', 'VALIDATION_ERROR'),
      expect: /Periksa kembali isian formulir/,
    },
    {
      label: 'BAD_REQUEST 400',
      err: new ApiError(400, 'Bad request', 'BAD_REQUEST'),
      expect: /Permintaan tidak valid/,
    },
    {
      label: 'BAD_REQUEST dengan status 2xx (body bukan JSON)',
      err: new ApiError(200, 'Respons server tidak valid (bukan JSON).', 'BAD_REQUEST'),
      expect: /Respons server tidak bisa dibaca\. Muat ulang halaman/,
    },
    {
      label: 'UNAUTHORIZED selain 401 yang dikenal',
      err: new ApiError(403, 'Forbidden', 'UNAUTHORIZED'),
      expect: /Sesi tidak valid/,
    },
    {
      label: 'NOT_FOUND',
      err: new ApiError(404, 'Not found', 'NOT_FOUND'),
      expect: /Data tidak ditemukan/,
    },
    {
      label: 'METHOD_NOT_ALLOWED',
      err: new ApiError(405, 'Method not allowed', 'METHOD_NOT_ALLOWED'),
      expect: /Aksi tidak didukung/,
    },
    {
      label: 'CONFLICT tanpa pola yang dikenali',
      err: new ApiError(409, 'Conflict detected on resource', 'CONFLICT'),
      expect: /Terjadi konflik\. Muat ulang halaman/,
      leak: 'Conflict detected',
    },
    {
      label: 'CONFLICT email sudah terdaftar',
      err: new ApiError(409, 'Email already exists', 'CONFLICT'),
      expect: /Email sudah terdaftar/,
    },
    {
      label: 'RATE_LIMITED tanpa Retry-After (default 60)',
      err: new ApiError(429, 'Too many requests', 'RATE_LIMITED'),
      expect: /dalam 60 detik/,
    },
    {
      label: 'SERVICE_UNAVAILABLE 503',
      err: new ApiError(503, 'Service Unavailable', 'SERVICE_UNAVAILABLE'),
      expect: /Layanan sedang tidak tersedia/,
      leak: 'Service Unavailable',
    },
    {
      label: '502 Bad Gateway dengan kode generik',
      err: new ApiError(502, 'Bad Gateway', 'INTERNAL_SERVER_ERROR'),
      expect: /Layanan sedang tidak tersedia\. Coba lagi dalam beberapa saat/,
      leak: 'Bad Gateway',
    },
    {
      label: '503 dengan kode generik',
      err: new ApiError(503, 'Service Unavailable', 'INTERNAL_SERVER_ERROR'),
      expect: /Layanan sedang tidak tersedia/,
      leak: 'Service Unavailable',
    },
    {
      label: '504 Gateway Timeout dengan kode generik',
      err: new ApiError(504, 'Gateway Timeout', 'INTERNAL_SERVER_ERROR'),
      expect: /Layanan sedang tidak tersedia/,
      leak: 'Gateway Timeout',
    },
    {
      label: '500 dengan kode generik',
      err: new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR'),
      expect: /Terjadi kesalahan pada server\. Coba lagi beberapa saat/,
      leak: 'Internal Server Error',
    },
    {
      label: 'DATABASE_ERROR 500',
      err: new ApiError(500, 'relation "users" does not exist', 'DATABASE_ERROR'),
      expect: /Terjadi kesalahan pada server/,
      leak: 'relation',
    },
    {
      label: 'kode yang tidak dikenali',
      err: new ApiError(418, "I'm a teapot", 'TEAPOT'),
      expect: /Terjadi kesalahan\. Coba lagi beberapa saat/,
      leak: 'teapot',
    },
    {
      label: 'Error runtime non-ApiError (bahasa Inggris)',
      err: new TypeError("Cannot read properties of undefined (reading 'foo')"),
      expect: /Terjadi kesalahan di aplikasi ini\. Muat ulang halaman/,
      leak: 'Cannot read properties',
    },
    {
      label: 'Error runtime Error biasa',
      err: new Error('NetworkError when attempting to fetch resource'),
      expect: /Muat ulang halaman/,
      leak: 'NetworkError',
    },
    {
      label: 'nilai yang bukan Error sama sekali',
      err: { foo: 'bar' },
      expect: /Terjadi kesalahan tak terduga\. Muat ulang halaman/,
    },
  ]

  it.each(cases)('$label', ({ err, expect: pattern, leak }) => {
    const message = getErrorMessage(err)
    expect(message, message).toMatch(pattern)
    expect(message).toMatch(/[a-z]/)
    if (leak) expect(message).not.toContain(leak)
  })

  it('AI_PROVIDER_ERROR dengan status 502 tetap memakai pesan reason, bukan pesan 502', () => {
    const err = new ApiError(502, 'upstream exploded', 'AI_PROVIDER_ERROR', { reason: 'PROVIDER_OVERLOADED' })
    expect(getErrorMessage(err)).toBe('Layanan AI sedang sibuk, coba lagi beberapa saat.')
  })

  it('AbortError (batal) tetap "Dibatalkan." tanpa langkah berikutnya', () => {
    const err = new DOMException('The user aborted a request.', 'AbortError')
    expect(getErrorMessage(err)).toBe('Dibatalkan.')
  })

  it('setiap pesan punya langkah berikutnya, kecuali pembatalan', () => {
    const all = [
      new ApiError(0, 'Failed to fetch', 'NETWORK_ERROR'),
      new ApiError(502, 'Bad Gateway', 'INTERNAL_SERVER_ERROR'),
      new ApiError(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR'),
      new ApiError(200, 'not json', 'BAD_REQUEST'),
      new TypeError('boom'),
    ]
    for (const err of all) {
      const m = getErrorMessage(err)
      expect(
        /coba lagi|Coba lagi|Muat ulang/.test(m),
        `pesan "${m}" harus menyebut langkah berikutnya`,
      ).toBe(true)
    }
  })
})
