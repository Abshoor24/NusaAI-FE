// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import type { ProjectSummary } from '@/types/api'

const { listPageMock } = vi.hoisted(() => ({ listPageMock: vi.fn() }))

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

vi.mock('@/lib/api/projects', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/api/projects')>()
  return { ...mod, projectsApi: { ...mod.projectsApi, listPage: listPageMock } }
})

// Impor SETELAH mock didefinisikan.
import { Route } from '@/routes/_app/projects.index'

function makeProjects(n: number, prefix: string): ProjectSummary[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${prefix}-${i}`,
    title: `${prefix} ${i}`,
    status: 'draft' as const,
    brief: { description: 'Deskripsi cukup panjang untuk sebuah project.' },
    version_count: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }))
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
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

describe('Halaman Project Saya (pagination)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('tepat 20 item tanpa item ke-21 -> Berikutnya nonaktif', async () => {
    listPageMock.mockResolvedValue({ items: makeProjects(20, 'P'), hasMore: false })
    renderPage()

    await waitFor(() => expect(screen.getByText('P 0')).toBeInTheDocument(), { timeout: 5000 })
    expect(screen.getByText('P 19')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Berikutnya/ })).toBeDisabled()
  })

  it('ada item ke-21 -> Berikutnya aktif dan hanya 20 yang tampil', async () => {
    listPageMock.mockResolvedValue({ items: makeProjects(20, 'P'), hasMore: true })
    renderPage()

    await waitFor(() => expect(screen.getByText('P 0')).toBeInTheDocument(), { timeout: 5000 })
    expect(screen.getByRole('button', { name: /Berikutnya/ })).toBeEnabled()
    expect(screen.queryByText('P 20')).toBeNull()
  })

  it('halaman >1 yang kosong otomatis kembali ke halaman sebelumnya', async () => {
    listPageMock.mockImplementation((_limit: number, offset: number) => {
      if (offset === 0) return Promise.resolve({ items: makeProjects(20, 'P'), hasMore: true })
      return Promise.resolve({ items: [], hasMore: false })
    })
    renderPage()

    await waitFor(() => expect(screen.getByText('P 0')).toBeInTheDocument(), { timeout: 5000 })
    fireEvent.click(screen.getByRole('button', { name: /Berikutnya/ }))

    // Kembali ke halaman 1: item pertama tampil lagi.
    await waitFor(() => expect(screen.getByText('P 0')).toBeInTheDocument(), { timeout: 5000 })
    expect(screen.getByRole('button', { name: /Sebelumnya/ })).toBeDisabled()
  })
})
