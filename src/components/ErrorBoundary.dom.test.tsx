// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { reportError } from '@/lib/error-report'

vi.mock('@/lib/error-report', () => ({
  reportError: vi.fn(),
}))

function Meledak(): null {
  throw new Error('Gagal render rute')
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('menampilkan fallback berbahasa Indonesia dan melapor sekali', () => {
    const bising = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      render(
        <ErrorBoundary>
          <Meledak />
        </ErrorBoundary>,
      )
    } finally {
      bising.mockRestore()
    }
    expect(screen.getByRole('heading', { name: 'Terjadi kesalahan' })).toBeInTheDocument()
    expect(screen.getByText(/terjadi kesalahan tak terduga/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Muat Ulang' })).toBeInTheDocument()
    expect(vi.mocked(reportError)).toHaveBeenCalledTimes(1)
  })

  it('ter-reset saat key berubah (simulasi pindah route)', () => {
    const bising = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const { rerender } = render(
        <ErrorBoundary key="/projects/baru">
          <Meledak />
        </ErrorBoundary>,
      )
      expect(screen.getByRole('heading', { name: 'Terjadi kesalahan' })).toBeInTheDocument()
      rerender(
        <ErrorBoundary key="/projects">
          <p>Daftar project pulih</p>
        </ErrorBoundary>,
      )
    } finally {
      bising.mockRestore()
    }
    expect(screen.getByText('Daftar project pulih')).toBeInTheDocument()
  })
})
