// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const user = userEvent.setup({ delay: null })

const { getMock, exportMock, createMock, listVersionsMock, navigateMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  exportMock: vi.fn(),
  createMock: vi.fn(),
  listVersionsMock: vi.fn(),
  navigateMock: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => {
  const routeObj = (opts: unknown) =>
    Object.assign(typeof opts === 'function' ? opts : (props: unknown) => props, opts, {
      useParams: () => ({ projectId: 'p1' }),
      useSearch: () => ({}),
    })
  return {
    createFileRoute: () => routeObj,
    lazyRouteComponent: (importer: () => Promise<Record<string, unknown>>) =>
      lazy(() => importer().then((m) => ({ default: (m.component ?? m.default) as ComponentType }))),
    Link: ({ children, to }: { children?: ReactNode; to?: string }) => <a href={to}>{children}</a>,
    useNavigate: () => navigateMock,
  }
})

vi.mock('@/lib/api/projects', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/api/projects')>()
  return {
    ...mod,
    projectsApi: {
      ...mod.projectsApi,
      get: getMock,
      exportHtml: exportMock,
      create: createMock,
      listVersions: listVersionsMock,
      listPage: vi.fn().mockResolvedValue({ items: [], hasMore: false }),
    },
  }
})

import { Route as WorkspaceRoute } from '@/routes/_app/projects.$projectId'
import { Route as ProjectsListRoute } from '@/routes/_app/projects.index'

function renderWorkspace() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 }, mutations: { retry: false } },
  })
  const Component = (WorkspaceRoute as unknown as { component: ComponentType }).component
  return render(
    <QueryClientProvider client={client}>
      <Suspense fallback={<div>Memuat workspace…</div>}>
        <Component />
      </Suspense>
    </QueryClientProvider>,
  )
}

function renderProjectsList() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 }, mutations: { retry: false } },
  })
  const Component = (ProjectsListRoute as unknown as { component: ComponentType }).component
  return render(
    <QueryClientProvider client={client}>
      <Suspense fallback={<div>Memuat daftar project…</div>}>
        <Component />
      </Suspense>
    </QueryClientProvider>,
  )
}

describe('Fase 4.1: Salin HTML di Workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMock.mockResolvedValue({
      id: 'p1',
      title: 'Uji Salin',
      status: 'ready',
      latest_version: { version_number: 1, html: '<h1>Halo Dunia</h1>', kind: 'generate', prompt: 'brief' },
      version_count: 1,
    })
    listVersionsMock.mockResolvedValue([
      { id: 'v1', version_number: 1, kind: 'generate', prompt: 'brief', created_at: '2026-01-01' },
    ])
  })

  afterEach(() => {
    cleanup()
  })

  it('menyalin HTML ke clipboard dan menampilkan umpan balik Tersalin (aria-live)', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    })

    renderWorkspace()
    // Route workspace dimuat lewat lazyRouteComponent; anggaran tunggu 5000 ms
    // dipakai karena default 1000 ms tidak cukup saat 28 worker vitest
    // berjalan bersamaan. Assertion tidak berubah.
    const copyBtn = await screen.findByRole('button', { name: /Salin HTML/ }, { timeout: 5000 })
    await user.click(copyBtn)

    expect(writeTextMock).toHaveBeenCalledWith('<h1>Halo Dunia</h1>')
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('HTML berhasil disalin ke clipboard.')
    })
  })

  it('menangani kegagalan clipboard dengan pesan Indonesia', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'))
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    })

    renderWorkspace()
    // Lihat catatan timeout di test pertama pada berkas ini.
    const copyBtn = await screen.findByRole('button', { name: /Salin HTML/ }, { timeout: 5000 })
    await user.click(copyBtn)

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/Gagal menyalin HTML ke clipboard/)
    })
  })
})

describe('Fase 4.2: Tombol Coba lagi pada error stream/generate', () => {
  afterEach(() => {
    cleanup()
  })

  it('menampilkan tombol Coba lagi pada error server yang bisa diulang', async () => {
    getMock.mockResolvedValue({
      id: 'p1',
      title: 'Uji Error',
      status: 'failed',
      version_count: 0,
    })
    listVersionsMock.mockResolvedValue([])

    renderWorkspace()
    await screen.findByText('Uji Error')
    expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeEnabled()
  })
})

describe('Fase 4.3: Onboarding Empty State di Project Saya', () => {
  afterEach(() => {
    cleanup()
  })

  it('menampilkan penjelasan, tombol Buat Website Pertama, dan 3 template pintasan', async () => {
    renderProjectsList()
    await screen.findByText('Belum ada website')
    expect(
      screen.getByText(/Nusa AI membantu kamu membuat website profesional/),
    ).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Buat Website Pertama' })).toBeInTheDocument()
    expect(screen.getByText('Atau Mulai dari Template Pintasan')).toBeInTheDocument()

    const templateBtns = screen.getAllByRole('button', { name: /Gunakan Template/ })
    expect(templateBtns).toHaveLength(3)

    await user.click(templateBtns[0])
    expect(navigateMock).toHaveBeenCalledWith({
      to: '/projects/new',
      search: { template: 'kedai-kopi' },
    })
  })
})

describe('Fase 4.4: OG tags dan favicon di index.html', () => {
  it('index.html memuat og tags, favicon svg, dan theme-color', () => {
    const htmlPath = resolve(__dirname, '../../../index.html')
    const htmlContent = readFileSync(htmlPath, 'utf-8')

    expect(htmlContent).toContain('og:title')
    expect(htmlContent).toContain('og:description')
    expect(htmlContent).toContain('og:type')
    expect(htmlContent).toContain('og:locale')
    expect(htmlContent).toContain('twitter:card')
    expect(htmlContent).toContain('href="/brand/favicon.ico"')
    expect(htmlContent).toContain('name="theme-color"')
  })
})
