// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { authApi } from '@/lib/api/auth'
import { BRIEF_DRAFT_KEY, saveBriefDraft } from '@/lib/brief/draft-storage'
import { createEmptyBrief } from '@/lib/brief/types'

/**
 * Aturan privasi (Fase 3.9): draf brief di sessionStorage dihapus saat
 * submit berhasil, saat logout, dan saat 401 global. Tes ini mengunci
 * perilaku logout supaya tidak dil lupa di kemudian hari.
 */

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
})

afterEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
})

describe('authApi.logout menghapus draf brief', () => {
  it('draf hilang dari sessionStorage setelah logout', () => {
    saveBriefDraft({
      ...createEmptyBrief(),
      description: 'Kedai kopi di Purwokerto.',
      contact: { ...createEmptyBrief().contact, whatsapp: '08123456789' },
    })
    expect(window.sessionStorage.getItem(BRIEF_DRAFT_KEY)).not.toBeNull()

    authApi.logout()

    expect(window.sessionStorage.getItem(BRIEF_DRAFT_KEY)).toBeNull()
  })

  it('token lokal juga dihapus (perilaku lama tidak berubah)', () => {
    window.localStorage.setItem('nusa_auth_token', 'token-uji')
    authApi.logout()
    expect(window.localStorage.getItem('nusa_auth_token')).toBeNull()
  })

  it('logout tanpa draf tidak melempar error', () => {
    expect(() => authApi.logout()).not.toThrow()
  })
})