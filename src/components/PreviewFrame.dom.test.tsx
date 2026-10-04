// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { PreviewFrame } from './PreviewFrame'

describe('PreviewFrame', () => {
  afterEach(() => {
    cleanup()
  })

  it('sandbox sama persis "allow-scripts allow-popups"', () => {
    render(<PreviewFrame html="<h1>Halo</h1>" versionNumber={1} />)
    const frame = document.querySelector('iframe')
    if (!(frame instanceof HTMLIFrameElement)) throw new Error('iframe tidak ditemukan')
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts allow-popups')
    expect(frame.getAttribute('srcdoc')).toContain('<h1>Halo</h1>')
  })

  it('tidak mengandung allow-same-origin', () => {
    render(<PreviewFrame html="<p>x</p>" versionNumber={null} />)
    const frame = document.querySelector('iframe')
    expect(frame?.getAttribute('sandbox')).not.toContain('allow-same-origin')
  })

  it('tombol lebar tablet mengubah lebar pratinjau', () => {
    render(<PreviewFrame html="<p>x</p>" versionNumber={2} />)
    expect(screen.getByText('Pratinjau versi 2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Pratinjau Tablet' }))
    const frame = document.querySelector('iframe') as HTMLIFrameElement
    expect(frame.style.width).toBe('768px')
    fireEvent.click(screen.getByRole('button', { name: 'Pratinjau Mobile' }))
    expect((document.querySelector('iframe') as HTMLIFrameElement).style.width).toBe('375px')
  })
})
