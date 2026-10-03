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
