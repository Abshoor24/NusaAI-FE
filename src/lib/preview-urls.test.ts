import { describe, it, expect, vi } from 'vitest'
import { createPreviewUrlRegistry } from './preview-urls'

describe('createPreviewUrlRegistry', () => {
  it('revokeAll me-revoke tepat URL yang masih terdaftar (regresi memory leak ImagePicker)', () => {
    const revoke = vi.fn()
    const registry = createPreviewUrlRegistry(revoke)

    registry.track('blob:a')
    registry.track('blob:b')
    registry.track('blob:c')
    expect(registry.size).toBe(3)

    registry.revokeAll()

    expect(revoke).toHaveBeenCalledTimes(3)
    expect(revoke).toHaveBeenCalledWith('blob:a')
    expect(revoke).toHaveBeenCalledWith('blob:b')
    expect(revoke).toHaveBeenCalledWith('blob:c')
    expect(registry.size).toBe(0)
  })

  it('URL yang sudah dihapus satu per satu tidak di-revoke lagi saat revokeAll', () => {
    const revoke = vi.fn()
    const registry = createPreviewUrlRegistry(revoke)

    registry.track('blob:a')
    registry.track('blob:b')
    registry.release('blob:a')

    expect(revoke).toHaveBeenCalledTimes(1)
    expect(revoke).toHaveBeenCalledWith('blob:a')

    registry.revokeAll()

    // Hanya blob:b yang tersisa; total revoke = 2, tanpa ganda.
    expect(revoke).toHaveBeenCalledTimes(2)
    expect(revoke).toHaveBeenCalledWith('blob:b')
  })

  it('release URL yang tidak dikenal atau ganda tidak memicu revoke', () => {
    const revoke = vi.fn()
    const registry = createPreviewUrlRegistry(revoke)

    registry.release('blob:asing')
    expect(revoke).not.toHaveBeenCalled()

    registry.track('blob:a')
    registry.release('blob:a')
    registry.release('blob:a')
    expect(revoke).toHaveBeenCalledTimes(1)
  })

  it('revokeAll ganda aman (tidak revoke ulang)', () => {
    const revoke = vi.fn()
    const registry = createPreviewUrlRegistry(revoke)

    registry.track('blob:a')
    registry.revokeAll()
    registry.revokeAll()
    expect(revoke).toHaveBeenCalledTimes(1)
  })
})
