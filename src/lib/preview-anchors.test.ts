import { describe, it, expect } from 'vitest'
import { withPreviewAnchorFix } from './preview-anchors'

/** Syarat Fase 4: render-only, sandbox & HTML tersimpan/unduhan tak tersentuh. */
describe('withPreviewAnchorFix', () => {
  const TUBUH = `<html><head><title>t</title></head><body><h1>Halo</h1><a href="#produk">Lihat</a><section id="produk">P</section><a href="https://example.com" target="_blank">Luar</a><a href="mailto:halo@contoh.id">Email</a><a href="tel:+62812">Tel</a></body></html>`

  it('menyisipkan skrip tepat sebelum </body> tanpa mengubah isi lain', () => {
    const out = withPreviewAnchorFix(TUBUH)
    expect(out).toContain('data-pakhir-anchor-fix')
    expect(out.indexOf('data-pakhir-anchor-fix')).toBeLessThan(out.search(/<\/body\s*>/i))
    // Semua tautan asli utuh (perilakunya tidak diubah di level sumber).
    for (const asli of [
      '<a href="#produk">Lihat</a>',
      '<a href="https://example.com" target="_blank">Luar</a>',
      '<a href="mailto:halo@contoh.id">Email</a>',
      '<a href="tel:+62812">Tel</a>',
    ]) {
      expect(out).toContain(asli)
    }
  })

  it('tak peka huruf penutup body; menempel di akhir bila tanpa body', () => {
    expect(withPreviewAnchorFix('<DIV></BODY>')).toContain('data-pakhir-anchor-fix')
    const tanpaBody = withPreviewAnchorFix('<h1>fragmen</h1>')
    expect(tanpaBody).toContain('data-pakhir-anchor-fix')
    expect(tanpaBody.endsWith('</script>')).toBe(true)
  })

  it('idempoten dan aman untuk string kosong', () => {
    const sekali = withPreviewAnchorFix(TUBUH)
    expect(withPreviewAnchorFix(sekali)).toBe(sekali)
    expect(withPreviewAnchorFix('')).toBe('')
  })

  it('skrip hanya mencegat fragmen dokumen-sama', () => {
    const sekali = withPreviewAnchorFix(TUBUH)
    expect(sekali).toContain('a[href^="#"')
    // target selain _self dibiarkan (perilaku _blank dkk tidak berubah).
    expect(sekali).toContain(`t!=='_self'`)
    expect(sekali).toContain('scrollIntoView')
  })
})
