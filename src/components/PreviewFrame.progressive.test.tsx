// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import { PreviewFrame } from './PreviewFrame'

const DOC =
  '<!DOCTYPE html><html><head>' +
  '<script src="https://cdn.tailwindcss.com"></script>' +
  '<script>document.documentElement.classList.add("js")</script>' +
  '</head><body><h1>Halo</h1><div class="reveal">Konten</div></body></html>'

function frames(): HTMLIFrameElement[] {
  return Array.from(document.querySelectorAll('iframe')) as HTMLIFrameElement[]
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('PreviewFrame progresif', () => {
  it('non-streaming tetap satu iframe tanpa script progresif', () => {
    render(<PreviewFrame html={DOC} versionNumber={3} />)
    const list = frames()
    expect(list).toHaveLength(1)
    expect(list[0].getAttribute('sandbox')).toBe('allow-scripts allow-popups')
    const srcdoc = list[0].getAttribute('srcdoc') ?? ''
    expect(srcdoc).toContain('<h1>Halo</h1>')
    expect(srcdoc).not.toContain('data-pakhir-progressive')
    expect(srcdoc).not.toContain('data-pakhir-stream-scroll')
  })

  it('streaming memakai dua buffer, menahan tampilan sampai event load', () => {
    vi.useFakeTimers()
    render(<PreviewFrame html={DOC} versionNumber={null} streaming />)

    const list = frames()
    expect(list).toHaveLength(2)
    for (const frame of list) {
      expect(frame.getAttribute('sandbox')).toBe('allow-scripts allow-popups')
      expect(frame.getAttribute('srcdoc')).toBeNull()
    }
    expect(screen.getByText('Menyiapkan pratinjau…')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    const target = list.find((frame) => (frame.getAttribute('srcdoc') ?? '').includes('Halo'))
    expect(target).toBeDefined()
    const srcdoc = target!.getAttribute('srcdoc') ?? ''
    expect(srcdoc).toContain('data-pakhir-progressive')
    expect(srcdoc).toContain('data-pakhir-stream-scroll')
    expect(srcdoc).not.toContain('classList.add("js")')
    expect(target!.style.display).toBe('none')

    act(() => {
      target!.dispatchEvent(new Event('load'))
    })

    expect(target!.style.display).toBe('block')
    expect(screen.queryByText('Menyiapkan pratinjau…')).toBeNull()
    const inactive = list.find((frame) => frame !== target)!
    expect(inactive.style.display).toBe('none')
  })

  it('loading menampilkan placeholder, bukan HTML lama', () => {
    render(<PreviewFrame html="" versionNumber={null} streaming loading />)
    expect(screen.getByText('Menyiapkan pratinjau…')).toBeInTheDocument()
    expect(screen.queryByText('Belum selesai')).toBeNull()
    expect(frames()).toHaveLength(2)
  })

  it('incomplete menampilkan label dan banner setengah jadi', () => {
    vi.useFakeTimers()
    const { rerender } = render(<PreviewFrame html={DOC} versionNumber={null} streaming />)
    act(() => {
      vi.advanceTimersByTime(500)
    })
    const target = frames().find((frame) => (frame.getAttribute('srcdoc') ?? '').includes('Halo'))!
    act(() => {
      target.dispatchEvent(new Event('load'))
    })

    rerender(<PreviewFrame html={DOC} versionNumber={null} incomplete />)

    expect(screen.getByText(/Belum selesai/)).toBeInTheDocument()
    expect(screen.getByText(/Pratinjau setengah jadi/)).toBeInTheDocument()
    expect(target.style.display).toBe('block')
    expect(screen.queryByText('Menyiapkan pratinjau…')).toBeNull()
  })

  it('membersihkan timer throttle saat streaming berhenti', () => {
    vi.useFakeTimers()
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')
    const { rerender } = render(<PreviewFrame html={DOC} versionNumber={null} streaming />)
    rerender(<PreviewFrame html={DOC} versionNumber={1} />)
    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })
})
