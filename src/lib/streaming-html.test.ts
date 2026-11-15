// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { sanitizeStreamingHtml, hasStreamingBody, buildProgressiveHtml } from '@/lib/streaming-html'

describe('sanitizeStreamingHtml', () => {
  it('membuang fence markdown di awal', () => {
    const out = sanitizeStreamingHtml('```html\n<h1>Halo</h1>\n```')
    expect(out).not.toContain('```')
    expect(out).toContain('<h1>Halo</h1>')
  })

  it('membuang fence ``` tanpa bahasa', () => {
    const out = sanitizeStreamingHtml('```\n<h1>Halo</h1>')
    expect(out).not.toContain('```')
  })

  it('pertahankan skrip Tailwind CDN', () => {
    const html = '<head><script src="https://cdn.tailwindcss.com"></script></head><body><h1>Halo</h1></body>'
    const out = sanitizeStreamingHtml(html)
    expect(out).toContain('cdn.tailwindcss.com')
  })

  it('pertahankan skrip tailwind.config inline', () => {
    const html = '<head><script>tailwind.config = { theme: { extend: {} } }</script></head><body><h1>Halo</h1></body>'
    const out = sanitizeStreamingHtml(html)
    expect(out).toContain('tailwind.config')
  })

  it('buang skrip inline lain (termasuk class js)', () => {
    const html =
      '<head><script src="https://cdn.tailwindcss.com"></script>' +
      '<script>document.documentElement.classList.add("js")</script>' +
      '</head><body><h1>Halo</h1></body>'
    const out = sanitizeStreamingHtml(html)
    expect(out).not.toContain('classList.add("js")')
    expect(out).not.toMatch(/<script>document\.documentElement/)
  })

  it('potong sampai ">" lengkap terakhir', () => {
    const out = sanitizeStreamingHtml('<h1>Halo<h2>')
    // Tidak ada ">" yang valid di akhir, jadi potong sampai ">" terakhir
    expect(out).toBe('<h1>Halo<h2>')
  })

  it('kembalikan kosong bila tidak ada ">" sama sekali', () => {
    expect(sanitizeStreamingHtml('<h1 Halo')).toBe('')
  })

  it('tahan sampai <body> terbuka (waitForBody)', () => {
    const out = sanitizeStreamingHtml('<head><title>X</title></head>', true)
    expect(out).toBe('')
  })

  it('teruskan bila <body> sudah terbuka (waitForBody)', () => {
    const out = sanitizeStreamingHtml('<head><title>X</title></head><body>', true)
    expect(out).toContain('<body>')
  })

  it('sisipkan penekan animasi/transisi di dalam </head>', () => {
    const html = '<head></head><body><h1>Halo</h1></body>'
    const out = sanitizeStreamingHtml(html)
    expect(out).toContain('data-pakhir-progressive')
    expect(out).toContain('animation:none!important')
    expect(out).toContain('transition:none!important')
  })

  it('sisipkan penekan animasi di akhir bila tidak ada </head>', () => {
    const html = '<body><h1>Halo</h1></body>'
    const out = sanitizeStreamingHtml(html)
    expect(out).toContain('data-pakhir-progressive')
  })
})

describe('hasStreamingBody', () => {
  it('mengembalikan true bila <body> terbuka', () => {
    expect(hasStreamingBody('<body>')).toBe(true)
    expect(hasStreamingBody('<body class="x">')).toBe(true)
  })

  it('mengembalikan false bila <body> belum terbuka', () => {
    expect(hasStreamingBody('<head></head>')).toBe(false)
    expect(hasStreamingBody('')).toBe(false)
  })
})

describe('buildProgressiveHtml', () => {
  it('mengembalikan kosong bila <body> belum terbuka', () => {
    expect(buildProgressiveHtml('<head></head>', { y: 0, atBottom: false })).toBe('')
  })

  it('sisipkan skrip scroll milik kita', () => {
    const out = buildProgressiveHtml('<head></head><body><h1>Halo</h1></body>', { y: 100, atBottom: false })
    expect(out).toContain('data-pakhir-stream-scroll')
    expect(out).toContain('pakhir-scroll')
  })

  it('membuang skrip inline "js" tapi tetap tailwind.config', () => {
    const html =
      '<head><script src="https://cdn.tailwindcss.com"></script>' +
      '<script>tailwind.config = { theme: {} }</script>' +
      '<script>document.documentElement.classList.add("js")</script>' +
      '</head><body><h1>Halo</h1></body>'
    const out = buildProgressiveHtml(html, { y: 0, atBottom: false })
    expect(out).toContain('cdn.tailwindcss.com')
    expect(out).toContain('tailwind.config')
    expect(out).not.toContain('classList.add("js")')
  })
})
