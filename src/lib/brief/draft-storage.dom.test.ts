// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  BRIEF_DRAFT_KEY,
  saveBriefDraft,
  loadBriefDraft,
  clearBriefDraft,
  saveSelectedTemplate,
  loadSelectedTemplate,
} from '@/lib/brief/draft-storage'
import { createEmptyBrief, type BriefDraft } from '@/lib/brief/types'
import { describeColor } from '@/lib/brief/color-names'

describe('draft-storage (sessionStorage)', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  afterEach(() => {
    window.sessionStorage.clear()
  })

  it('menyimpan dan membaca kembali draf', () => {
    const draft = {
      ...createEmptyBrief(),
      description: 'Kedai kopi di Purwokerto.',
      brandName: 'Kopi Senja',
      sections: ['hero', 'cta'],
    }
    expect(saveBriefDraft(draft)).toBe(true)
    const loaded = loadBriefDraft()
    expect(loaded?.description).toBe('Kedai kopi di Purwokerto.')
    expect(loaded?.brandName).toBe('Kopi Senja')
    expect(loaded?.sections).toEqual(['hero', 'cta'])
  })

  it('MENYIMPAN DI sessionStorage, BUKAN localStorage', () => {
    saveBriefDraft({ ...createEmptyBrief(), brandName: 'Kopi Senja' })
    expect(window.sessionStorage.getItem(BRIEF_DRAFT_KEY)).toBeTruthy()
    expect(window.localStorage.getItem(BRIEF_DRAFT_KEY)).toBeNull()
  })

  it('clearBriefDraft menghapus draf', () => {
    saveBriefDraft(createEmptyBrief())
    expect(window.sessionStorage.getItem(BRIEF_DRAFT_KEY)).not.toBeNull()
    clearBriefDraft()
    expect(window.sessionStorage.getItem(BRIEF_DRAFT_KEY)).toBeNull()
    expect(loadBriefDraft()).toBeNull()
  })

  it('tidak menyimpan gambar / field tak dikenal', () => {
    // Field `images` sengaja ditambahkan: draf harus menjadi whitelist.
    const draft = {
      ...createEmptyBrief(),
      brandName: 'Kopi Senja',
      images: [{ file: 'gambar.jpg' }],
    } as unknown as BriefDraft
    saveBriefDraft(draft)
    const raw = window.sessionStorage.getItem(BRIEF_DRAFT_KEY) ?? ''
    expect(raw).not.toContain('gambar.jpg')
    expect(raw).not.toContain('images')
  })

  it('menormalkan draf saat disimpan & dibaca', () => {
    // @ts-expect-error sengaja menguji data rusak
    saveBriefDraft({ sections: ['hero', 'formulir', 'about'], styles: ['A', 'B', 'C', 'D'], colorMode: 'entah' })
    const loaded = loadBriefDraft()
    expect(loaded?.sections).toEqual(['hero', 'about'])
    expect(loaded?.styles).toEqual(['A', 'B', 'C'])
    expect(loaded?.colorMode).toBe('ai')
  })

  it('hex dinormalkan', () => {
    saveBriefDraft({ ...createEmptyBrief(), primaryColor: '#abc', accentColor: 'd4af37' })
    const loaded = loadBriefDraft()
    expect(loaded?.primaryColor).toBe('#AABBCC')
    expect(loaded?.accentColor).toBe('#D4AF37')
    expect(describeColor(loaded?.accentColor ?? '')?.name).toBe('emas')
  })

  it('kontak yang hilang diisi default, bukan undefined', () => {
    // @ts-expect-error sengaja menguji data rusak
    saveBriefDraft({ brandName: 'Kopi Senja' })
    const loaded = loadBriefDraft()
    expect(loaded?.contact.whatsapp).toBe('')
    expect(loaded?.contact.email).toBe('')
  })

  it('data rusak tidak menjatuhkan form', () => {
    window.sessionStorage.setItem(BRIEF_DRAFT_KEY, '{bukan json')
    expect(loadBriefDraft()).toBeNull()
    window.sessionStorage.setItem(BRIEF_DRAFT_KEY, '"sekadar string"')
    expect(loadBriefDraft()).toBeNull()
    window.sessionStorage.setItem(BRIEF_DRAFT_KEY, 'null')
    expect(loadBriefDraft()).toBeNull()
  })

  it('kode selected template', () => {
    expect(loadSelectedTemplate()).toBe('')
    saveSelectedTemplate('kedai-kopi')
    expect(loadSelectedTemplate()).toBe('kedai-kopi')
    // Id dengan bentuk tak lazim ditolak di lapisan ini.
    saveSelectedTemplate('../jahat')
    expect(loadSelectedTemplate()).toBe('')
    saveSelectedTemplate('')
    expect(loadSelectedTemplate()).toBe('')
  })

  it('tidak melempar error saat sessionStorage diblokir (mode privat)', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'sessionStorage')
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      get() {
        throw new Error('blocked')
      },
    })
    try {
      expect(saveBriefDraft(createEmptyBrief())).toBe(false)
      expect(loadBriefDraft()).toBeNull()
      expect(() => clearBriefDraft()).not.toThrow()
    } finally {
      if (original) Object.defineProperty(window, 'sessionStorage', original)
    }
  })

  it('draf terlalu besar ditolak tanpa melempar error', () => {
    const huge = { ...createEmptyBrief(), extraNotes: 'x'.repeat(300_000) }
    expect(saveBriefDraft(huge)).toBe(false)
  })
})