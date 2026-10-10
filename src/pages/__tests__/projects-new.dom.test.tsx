// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => opts,
  // Teruskan lazy loading asli agar komponen route hasil code-split
  // tetap bisa dirender dalam tes (dibungkus Suspense di bawah).
  lazyRouteComponent: (importer: () => Promise<Record<string, unknown>>) =>
    lazy(() =>
      importer().then((m) => ({ default: (m.component ?? m.default) as ComponentType })),
    ),
  Link: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  useNavigate: () => vi.fn(),
}))

import { Route } from '@/routes/_app/projects.new'

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 }, mutations: { retry: false } },
  })
  // Route hasil code-split tidak mengekspos `.component` pada tipenya;
  // baca via cast (runtime: objek opts dari mock createFileRoute).
  const Component = (Route as unknown as { component: ComponentType }).component
  return render(
    <QueryClientProvider client={client}>
      <Suspense fallback={<div>Memuat halaman…</div>}>
        <Component />
      </Suspense>
    </QueryClientProvider>,
  )
}

describe('Form project baru (sections)', () => {
  afterEach(() => {
    cleanup()
  })

  it('section duplikat beda huruf/spasi memunculkan pesan dan tidak menambah item', async () => {
    renderPage()
    // Selector diperbarui (UI baru): kelompok "Isi halaman" kini di dalam
    // accordion (default tertutup) dan input bagian kustom di dalam <details>.
    // Assertion tetap sama.
    // findBy (bukan getBy) + timeout long: route hasil code-split dimuat lewat
    // Suspense, jadi panel "Isi halaman" (berisi komponen lazy) muncul
    // sedikit terlambat saat banyak worker berjalan bersamaan.
    fireEvent.click(
      await screen.findByRole('button', { name: /Isi halaman/ }, { timeout: 10000 }),
    )
    const input = await screen.findByPlaceholderText(/tekan Tambah/, undefined, {
      timeout: 5000,
    })
    fireEvent.click(await screen.findByText(/Lanjutan: tambah bagian sendiri/))
    const tambah = await screen.findByRole('button', { name: 'Tambah' })

    fireEvent.change(input, { target: { value: 'Hero' } })
    fireEvent.click(tambah)
    expect(screen.getByText('Hero')).toBeInTheDocument()

    fireEvent.change(input, { target: { value: '  HERO  ' } })
    fireEvent.click(tambah)

    expect(screen.getByText('Bagian "HERO" sudah ada.')).toBeInTheDocument()
    // Hanya satu chip Hero.
    expect(screen.getAllByText('Hero')).toHaveLength(1)
  })
})
