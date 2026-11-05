// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import type { ProjectSummary } from '@/types/api'

const { listPageMock, searchMock, navigateMock } = vi.hoisted(() => ({
  listPageMock: vi.fn(),
  searchMock: { page: undefined as number | undefined },
  navigateMock: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => ({
    ...opts,
    useSearch: () => searchMock,
  }),
  // Teruskan lazy loading asli agar komponen route hasil code-split
  // tetap bisa dirender dalam tes (dibungkus Suspense di bawah).
  lazyRouteComponent: (importer: () => Promise<Record<string, unknown>>) =>
    lazy(() =>
      importer().then((m) => ({ default: (m.component ?? m.default) as ComponentType })),
    ),
  Link: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  useNavigate: () => navigateMock,
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
    searchMock.page = undefined
  })

  afterEach(() => {
    cleanup()
  })

  it('tepat 6 item tanpa item ke-7 -> hasMore false dan pager tidak tampil di halaman 1', async () => {
    searchMock.page = undefined
    listPageMock.mockResolvedValue({ items: makeProjects(6, 'P'), hasMore: false })
    renderPage()

    await waitFor(() => expect(screen.getByText('P 0')).toBeInTheDocument(), { timeout: 5000 })
    expect(screen.getByText('P 5')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Navigasi halaman project' })).toBeNull()
  })

  it('ada item ke-7 (hasMore true) -> pager tampil dan Berikutnya aktif', async () => {
    searchMock.page = undefined
    listPageMock.mockResolvedValue({ items: makeProjects(6, 'P'), hasMore: true })
    renderPage()

    await waitFor(() => expect(screen.getByText('P 0')).toBeInTheDocument(), { timeout: 5000 })
    expect(screen.getByRole('button', { name: /Berikutnya/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Sebelumnya/ })).toBeDisabled()
  })

  it('halaman >1 yang kosong otomatis kembali ke halaman 1 via replace', async () => {
    searchMock.page = 2
    listPageMock.mockResolvedValue({ items: [], hasMore: false })
    renderPage()

    await waitFor(
      () => {
        expect(navigateMock).toHaveBeenCalledWith({
          to: '/projects',
          search: {},
          replace: true,
        })
      },
      { timeout: 5000 },
    )
  })
})
