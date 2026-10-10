// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withPreviewAnchorFix } from './preview-anchors'
import { projectsApi } from './api/projects'

/** Syarat Fase 4 & F2: render-only, sandbox & HTML tersimpan/unduhan tak tersentuh. */
describe('withPreviewAnchorFix - Unit HTML Injection', () => {
  const TUBUH = `<html><head><title>t</title></head><body><h1>Halo</h1><a href="#produk">Lihat</a><section id="produk">P</section><a href="https://example.com" target="_blank">Luar</a><a href="mailto:halo@contoh.id">Email</a><a href="tel:+62812">Tel</a></body></html>`

  it('menyisipkan skrip tepat sebelum </body> tanpa mengubah isi lain', () => {
    const out = withPreviewAnchorFix(TUBUH)
    expect(out).toContain('data-pakhir-anchor-fix')
    expect(out.indexOf('data-pakhir-anchor-fix')).toBeLessThan(out.lastIndexOf('</body>'))
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

  it('disisipkan sebelum </body> TERAKHIR walau ada </body> di dalam script', () => {
    const htmlWithBodyInScript = `<html><body><script>var s = "</body>";</script><h1>Content</h1></body></html>`
    const out = withPreviewAnchorFix(htmlWithBodyInScript)
    const scriptIndex = out.indexOf('data-pakhir-anchor-fix')
    const firstBodyIndex = out.indexOf('</body>')
    const lastBodyIndex = out.lastIndexOf('</body>')
    expect(firstBodyIndex).toBeLessThan(lastBodyIndex)
    expect(scriptIndex).toBeGreaterThan(firstBodyIndex)
    expect(scriptIndex).toBeLessThan(lastBodyIndex)
  })

  it('tak peka huruf penutup body; menempel di akhir bila tanpa body', () => {
    expect(withPreviewAnchorFix('<DIV></BODY>')).toContain('data-pakhir-anchor-fix')
    const tanpaBody = withPreviewAnchorFix('<h1>fragmen</h1>')
    expect(tanpaBody).toContain('data-pakhir-anchor-fix')
    expect(tanpaBody.endsWith('<\/script>')).toBe(true)
  })

  it('idempoten dan aman untuk string kosong', () => {
    const sekali = withPreviewAnchorFix(TUBUH)
    expect(withPreviewAnchorFix(sekali)).toBe(sekali)
    expect(withPreviewAnchorFix('')).toBe('')
  })

  it('skrip memuat selector delegasi a[href]', () => {
    const sekali = withPreviewAnchorFix(TUBUH)
    expect(sekali).toContain('a[href]')
    expect(sekali).toContain('scrollIntoView')
  })
})

describe('withPreviewAnchorFix - DOM behavior', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  function evalScriptFromHtml(html: string) {
    const match = html.match(/<script data-pakhir-anchor-fix>([\s\S]*?)<\/script>/)
    if (match && match[1]) {
      const fn = new Function(match[1])
      fn()
    }
  }

  // ── H2: Koreksi mailto:, tel:, javascript:, data:, blob: ────────────────
  it('H2: mailto:, tel:, javascript:, data:, blob: TIDAK disentuh (tanpa target/rel)', () => {
    const html = withPreviewAnchorFix(`
      <body>
        <a id="mail-link" href="mailto:halo@contoh.id">Email</a>
        <a id="tel-link" href="tel:+628123456">Telepon</a>
        <a id="js-link" href="javascript:void(0)">JS</a>
        <a id="js-upper" href="JAVASCRIPT:alert(1)">JS Upper</a>
        <a id="data-link" href="data:text/plain;base64,SGVsbG8=">Data</a>
        <a id="data-upper" href="DATA:text/plain,halo">Data Upper</a>
        <a id="blob-link" href="blob:http://localhost/123">Blob</a>
        <a id="blob-upper" href="BLOB:http://localhost/456">Blob Upper</a>
        <a id="http-upper" href="HTTP://EXAMPLE.COM/TEST">HTTP Upper</a>
        <a id="https-upper" href="HTTPS://EXAMPLE.COM/TEST">HTTPS Upper</a>
      </body>
    `)
    document.body.innerHTML = html
    evalScriptFromHtml(html)

    for (const id of [
      'mail-link',
      'tel-link',
      'js-link',
      'js-upper',
      'data-link',
      'data-upper',
      'blob-link',
      'blob-upper',
    ]) {
      const el = document.getElementById(id)!
      const evt = new MouseEvent('click', { bubbles: true, cancelable: true })
      const preventDefaultSpy = vi.spyOn(evt, 'preventDefault')
      el.dispatchEvent(evt)

      expect(preventDefaultSpy).not.toHaveBeenCalled()
      expect(el.getAttribute('target')).toBeNull()
      expect(el.getAttribute('rel')).toBeNull()
    }

    // http/https case-insensitive tetap mendapat target="_blank"
    for (const id of ['http-upper', 'https-upper']) {
      const el = document.getElementById(id)!
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      expect(el.getAttribute('target')).toBe('_blank')
      expect(el.getAttribute('rel')).toBe('noopener noreferrer')
    }
  })

  // ── H3: Enter activation tanpa penanganan ganda ────────────────────────
  it('H3: skrip pratinjau tidak memakai keydown/keyCode (click saja cukup)', () => {
    const out = withPreviewAnchorFix('<body><a href="#x">x</a></body>')
    expect(out).not.toContain('keydown')
    expect(out).not.toContain('keypress')
    expect(out).not.toContain('keyup')
    expect(out).not.toContain('keyCode')
    expect(out).not.toContain('which')
    expect(out).toContain(`addEventListener('click'`)
  })

  it('H3: aktivasi Enter pada tautan # dan https hanya memicu penanganan sekali (tanpa double-execution)', () => {
    const scrollIntoViewMock = vi.fn()
    const html = withPreviewAnchorFix(`
      <body>
        <a id="anchor-link" href="#sec1">Anchor</a>
        <a id="https-link" href="https://example.com/item">HTTPS</a>
        <div id="sec1">Sec 1</div>
      </body>
    `)
    document.body.innerHTML = html
    evalScriptFromHtml(html)

    const sec1 = document.getElementById('sec1')!
    sec1.scrollIntoView = scrollIntoViewMock

    const anchorLink = document.getElementById('anchor-link')!
    // Browser memicu 'click' saat Enter ditekan pada <a> fokus.
    // Keydown Enter sendiri TIDAK boleh memicu penanganan (tidak ada listener keydown).
    anchorLink.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    )
    expect(scrollIntoViewMock).not.toHaveBeenCalled()

    // Simulasi klik yang dihasilkan browser saat tombol Enter ditekan pada elemen <a>
    const clickEvt = new MouseEvent('click', { bubbles: true, cancelable: true })
    anchorLink.dispatchEvent(clickEvt)

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1)

    const httpsLink = document.getElementById('https-link')!
    httpsLink.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    )
    // Keydown tidak menyentuh target/rel.
    expect(httpsLink.getAttribute('target')).toBeNull()
    const clickEvt2 = new MouseEvent('click', { bubbles: true, cancelable: true })
    httpsLink.dispatchEvent(clickEvt2)
    expect(httpsLink.getAttribute('target')).toBe('_blank')
    // Klik kedua tetap idempoten (tidak ganda dalam satu aktivasi).
    const clickEvt3 = new MouseEvent('click', { bubbles: true, cancelable: true })
    httpsLink.dispatchEvent(clickEvt3)
    expect(httpsLink.getAttribute('target')).toBe('_blank')
  })

  // ── H4: Ketahanan (Robustness) ──────────────────────────────────────────
  it('H4.1: menangani tautan yang ditambahkan dinamis setelah load', () => {
    const html = withPreviewAnchorFix(`<body><div id="container"></div></body>`)
    document.body.innerHTML = html
    evalScriptFromHtml(html)

    const container = document.getElementById('container')!
    container.innerHTML = '<a id="dyn-link" href="https://dynamic.org">Dinamis</a>'

    const dyn = document.getElementById('dyn-link')!
    dyn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    expect(dyn.getAttribute('target')).toBe('_blank')
    expect(dyn.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('H4.2: menangani klik pada elemen anak di dalam <a> (span/icon/svg/path)', () => {
    const scrollIntoViewMock = vi.fn()
    const html = withPreviewAnchorFix(`
      <body>
        <a id="parent-link" href="#target-sec">
          <svg id="svg-el"><path id="path-el" d="M0 0h10v10H0z"/></svg>
        </a>
        <div id="target-sec">Target</div>
      </body>
    `)
    document.body.innerHTML = html
    evalScriptFromHtml(html)

    const targetSec = document.getElementById('target-sec')!
    targetSec.scrollIntoView = scrollIntoViewMock

    const pathEl = document.getElementById('path-el')!
    pathEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1)
  })

  it('H4.3: menjaga atribut target=_top, target=_parent, dan target=_blank yang sudah ada', () => {
    const html = withPreviewAnchorFix(`
      <body>
        <a id="link-top" href="https://example.com/top" target="_top">Top</a>
        <a id="link-parent" href="https://example.com/parent" target="_parent">Parent</a>
        <a id="link-blank" href="https://example.com/blank" target="_blank">Blank</a>
        <a id="link-self" href="https://example.com/self" target="_self">Self</a>
        <a id="link-notarget" href="https://example.com/no-target">NoTarget</a>
      </body>
    `)
    document.body.innerHTML = html
    evalScriptFromHtml(html)

    const topEl = document.getElementById('link-top')!
    topEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(topEl.getAttribute('target')).toBe('_top')

    const parentEl = document.getElementById('link-parent')!
    parentEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(parentEl.getAttribute('target')).toBe('_parent')

    const blankEl = document.getElementById('link-blank')!
    blankEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(blankEl.getAttribute('target')).toBe('_blank')

    // _self diubah ke _blank agar pratinjau tidak dinavigasi (seperlunya).
    const selfEl = document.getElementById('link-self')!
    selfEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(selfEl.getAttribute('target')).toBe('_blank')
    expect(selfEl.getAttribute('rel')).toBe('noopener noreferrer')

    const noTargetEl = document.getElementById('link-notarget')!
    noTargetEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(noTargetEl.getAttribute('target')).toBe('_blank')
  })

  it('H4.3b: tautan # dengan target _blank/_top dibiarkan (tidak preventDefault)', () => {
    const scrollSpy = vi.fn()
    const html = withPreviewAnchorFix(`
      <body>
        <a id="frag-blank" href="#sec1" target="_blank">Frag Blank</a>
        <a id="frag-self" href="#sec1" target="_self">Frag Self</a>
        <div id="sec1">S1</div>
      </body>
    `)
    document.body.innerHTML = html
    evalScriptFromHtml(html)
    document.getElementById('sec1')!.scrollIntoView = scrollSpy

    const fragBlank = document.getElementById('frag-blank')!
    const evtBlank = new MouseEvent('click', { bubbles: true, cancelable: true })
    const spyBlank = vi.spyOn(evtBlank, 'preventDefault')
    fragBlank.dispatchEvent(evtBlank)
    expect(spyBlank).not.toHaveBeenCalled()

    const fragSelf = document.getElementById('frag-self')!
    fragSelf.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(scrollSpy).toHaveBeenCalledTimes(1)
  })

  it('H4.4: bekerja harmonis dengan event handler penulis yang memanggil preventDefault', () => {
    const html = withPreviewAnchorFix(`
      <body>
        <a id="custom-link" href="https://example.com/custom">Custom</a>
      </body>
    `)
    document.body.innerHTML = html
    evalScriptFromHtml(html)

    const customLink = document.getElementById('custom-link')!
    customLink.addEventListener('click', (e) => {
      e.preventDefault()
    })

    const evt = new MouseEvent('click', { bubbles: true, cancelable: true })
    customLink.dispatchEvent(evt)

    expect(evt.defaultPrevented).toBe(true)
    expect(customLink.getAttribute('target')).toBe('_blank')
  })

  it('H4.5: menangani tautan https tanpa target di dalam <form>', () => {
    const html = withPreviewAnchorFix(`
      <body>
        <form id="my-form">
          <a id="form-link" href="https://example.com/in-form">Tautan Form</a>
        </form>
      </body>
    `)
    document.body.innerHTML = html
    evalScriptFromHtml(html)

    const form = document.getElementById('my-form') as HTMLFormElement
    const submitSpy = vi.fn((e: Event) => e.preventDefault())
    form.addEventListener('submit', submitSpy)

    const formLink = document.getElementById('form-link')!
    const evt = new MouseEvent('click', { bubbles: true, cancelable: true })
    formLink.dispatchEvent(evt)

    expect(formLink.getAttribute('target')).toBe('_blank')
    expect(formLink.getAttribute('rel')).toBe('noopener noreferrer')
    // Klik <a> di dalam <form> tidak memicu submit form.
    expect(submitSpy).not.toHaveBeenCalled()
  })
})

describe('H6: Kepastian Unduhan & Penyimpanan HTML', () => {
  it('H6: HTML tersimpan dan blob exportHtml TIDAK memuat data-pakhir-anchor-fix maupun target/rel buatan', () => {
    const rawStoredHtml = `<html><body><a href="https://wa.me/6281234">WhatsApp</a><a href="#kontak">Kontak</a></body></html>`

    // HTML tersimpan di backend / state proyek:
    expect(rawStoredHtml).not.toContain('data-pakhir-anchor-fix')
    expect(rawStoredHtml).not.toContain('target="_blank"')

    // withPreviewAnchorFix HANYA dipanggil saat membuat srcDoc untuk PreviewFrame.
    const previewSrcDoc = withPreviewAnchorFix(rawStoredHtml)
    expect(previewSrcDoc).toContain('data-pakhir-anchor-fix')

    // String asli tetap utuh untuk diunduh / diekspor oleh user:
    expect(rawStoredHtml).not.toContain('data-pakhir-anchor-fix')
  })

  it('H6b: blob projectsApi.exportHtml (mock fetch, tanpa DB sungguhan) bersih dari marker/target-rel', async () => {
    const serverHtml = `<html><body><a href="https://wa.me/6281234">WhatsApp</a><a href="#kontak">Kontak</a><a href="mailto:a@b.id">Mail</a></body></html>`
    const mockFetch = vi.fn(async () => {
      return new Response(serverHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': 'attachment; filename="website-v1.html"',
        },
      })
    }) as unknown as typeof fetch

    const { blob, filename } = await projectsApi.exportHtml('p1', 1, mockFetch)
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(filename).toContain('.html')
    const text = await blob.text()
    // Isi persis dari server: tanpa skrip pratinjau, tanpa target/rel tambahan.
    expect(text).toBe(serverHtml)
    expect(text).not.toContain('data-pakhir-anchor-fix')
    expect(text).not.toContain('target="_blank"')
    expect(text).not.toContain('noopener noreferrer')
  })
})
