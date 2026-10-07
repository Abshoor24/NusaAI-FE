// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import type { CreateProjectRequest } from '@/types/api'

// delay: null → tanpa jeda antar-keystroke. Menghilangkan sumber utama
// kelambatan (75 karakter × ~15ms default delay).
const user = userEvent.setup({ delay: null })

const { createMock, navigateMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  navigateMock: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => opts,
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
  return { ...mod, projectsApi: { ...mod.projectsApi, create: createMock } }
})

// Impor SETELAH mock didefinisikan.
import { Route } from '@/routes/_app/projects.new'
import { ApiError } from '@/lib/api/client'
import { BRIEF_DRAFT_KEY } from '@/lib/brief/draft-storage'
import { STATIC_SITE_NOTE } from '@/lib/brief/build-payload'

const VALID_DESCRIPTION =
  'Kedai kopi kecil di Purwokerto dengan menu dan tombol pesan lewat WhatsApp.'

/** Tempel teks panjang via clipboard (bukan ketik per-karakter). */
async function pasteInto(element: Element, text: string) {
  await user.click(element)
  await user.clear(element)
  // Tempel sekaligus — jauh lebih cepat daripada type() per karakter.
  await user.paste(text)
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 }, mutations: { retry: false } },
  })
  const Component = (Route as unknown as { component: ComponentType }).component
  return render(
    <QueryClientProvider client={client}>
      <Suspense fallback={<div>Memuat halaman…</div>}>
        <Component />
      </Suspense>
    </QueryClientProvider>,
  )
}

/** Buka kelompok accordion berdasarkan judulnya. */
async function openGroup(name: RegExp) {
  const btn = await screen.findByRole('button', { name }, { timeout: 5000 })
  if (btn.getAttribute('aria-expanded') !== 'true') fireEvent.click(btn)
  await waitFor(() => expect(btn.getAttribute('aria-expanded')).toBe('true'))
  return btn
}

/** Tunggu panel lazy selesai dimuat (isi grup "Tampilan"/"Isi halaman"). */
async function waitForLazy(text: RegExp | string) {
  return screen.findByText(text, {}, { timeout: 5000 })
}

function lastPayload(): CreateProjectRequest {
  expect(createMock).toHaveBeenCalled()
  return createMock.mock.calls[createMock.mock.calls.length - 1][0] as CreateProjectRequest
}

beforeEach(() => {
  vi.clearAllMocks()
  window.sessionStorage.clear()
  createMock.mockResolvedValue({
    id: 'p1',
    title: 'Uji',
    status: 'draft',
    brief: { description: VALID_DESCRIPTION },
    version_count: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  })
})

afterEach(() => {
  cleanup()
})

describe('Form brief baru: template mengisi form', () => {
  it('memilih template mengisi deskripsi, kategori, bagian, dan kontak', async () => {
    renderPage()
    // TemplatePicker dimuat lewat React.lazy; pakai anggaran tunggu 5000 ms
    // yang sama dengan openGroup()/waitForLazy() di berkas ini, karena default
    // 1000 ms tidak cukup saat 28 worker vitest berjalan bersamaan. Assertion
    // tetap sama: tombol template harus benar-benar muncul dan diklik.
    await user.click(
      await screen.findByRole('button', { name: /Kedai kopi/ }, { timeout: 5000 }),
    )

    const textarea = await screen.findByLabelText('Deskripsi Website')
    expect((textarea as HTMLTextAreaElement).value).toContain('Kedai kopi')

    // Kategori & tujuan terisi (radio tercentang).
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /Makanan & minuman/ })).toBeChecked()
      expect(screen.getByRole('radio', { name: /Menerima pesanan/ })).toBeChecked()
    })

    // Bagian default menyala sesuai kategori kuliner.
    await openGroup(/Isi halaman/)
    await waitForLazy(/Bagian pembuka/)
    expect(screen.getByRole('switch', { name: /Bagian pembuka/ })).toBeChecked()
    expect(screen.getByRole('switch', { name: /Jam buka & lokasi/ })).toBeChecked()
    // Kategori kuliner menyalakan 12 dari 13 bagian katalog.
    expect(screen.getByText('12/12 menyala')).toBeInTheDocument()

    // Kontak terisi.
    await openGroup(/Kontak & tombol utama/)
    await waitFor(() => expect(screen.getByLabelText('Nomor WhatsApp')).toHaveValue('081234567890'))
  })

  it('template tidak menimpa deskripsi yang sudah ditulis user', async () => {
    renderPage()
    const textarea = await screen.findByLabelText('Deskripsi Website')
    await user.type(textarea, 'Deskripsi saya sendiri yang panjangnya cukup.')
    await user.click(
      await screen.findByRole('button', { name: /Toko online/ }, { timeout: 5000 }),
    )
    await waitFor(() =>
      expect(screen.getByLabelText('Deskripsi Website')).toHaveValue(
        'Deskripsi saya sendiri yang panjangnya cukup.',
      ),
    )
  })
})

describe('Form brief baru: chip gaya maksimal 3', () => {
  it('menampilkan penghitung 2/3 dan menonaktifkan chip lain saat penuh', async () => {
    renderPage()
    await openGroup(/Tampilan/)
    await waitForLazy(/Gaya tampilan/)

    expect(screen.getByText('0/3 dipilih')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Modern' }))
    await user.click(screen.getByRole('checkbox', { name: 'Hangat' }))
    expect(screen.getByText('2/3 dipilih')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Ceria' }))
    expect(screen.getByText('3/3 dipilih')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Elegan' })).toBeDisabled()
    // Yang sudah menyala tetap bisa dimatikan.
    expect(screen.getByRole('checkbox', { name: 'Modern' })).toBeEnabled()

    await user.click(screen.getByRole('checkbox', { name: 'Modern' }))
    expect(screen.getByRole('checkbox', { name: 'Elegan' })).toBeEnabled()
  })
})

describe('Form brief baru: toggle bagian maksimal 12', () => {
  it('penghitung berubah dan toggle lain nonaktif saat mencapai 12', async () => {
    renderPage()
    await openGroup(/Isi halaman/)
    await waitForLazy(/Bagian pembuka/)

    // Nyalakan semua toggle katalog satu per satu.
    const switches = screen.getAllByRole('switch')
    for (const sw of switches) {
      if (sw.getAttribute('aria-checked') === 'false' && !(sw as HTMLButtonElement).disabled) {
        fireEvent.click(sw)
      }
    }
    await waitFor(() => expect(screen.getByText(/12\/12 menyala/)).toBeInTheDocument())
    expect(screen.getByText(/Sudah mencapai batas 12 bagian/)).toBeInTheDocument()
  })

  it('urutan bagian mengikuti katalog, bukan urutan klik', async () => {
    renderPage()
    await pasteInto(await screen.findByLabelText('Deskripsi Website'), VALID_DESCRIPTION)
    await openGroup(/Isi halaman/)
    await waitForLazy(/Bagian pembuka/)
    // Nyalakan "Penutup" (terakhir di katalog) lalu "Bagian pembuka" (pertama).
    await user.click(screen.getByRole('switch', { name: /Penutup/ }))
    await user.click(screen.getByRole('switch', { name: /Bagian pembuka/ }))

    await user.click(screen.getByRole('button', { name: 'Simpan & Buatkan Website' }))
    await waitFor(() => expect(createMock).toHaveBeenCalled())
    // Urutan mengikuti katalog: hero lebih dulu meski diklik belakangan.
    const sections = lastPayload().brief.sections ?? []
    expect(sections).toEqual(['hero', 'footer'])
  })
})

describe('Form brief baru: pilihan bagian manual tidak tertimpa ganti kategori', () => {
  it('toggle manual dipertahankan; ada tombol atur ulang ke saran', async () => {
    renderPage()
    // 1. Pilih kategori THEN ubah toggle manual.
    await user.click(await screen.findByRole('radio', { name: /Makanan & minuman/ }))
    await openGroup(/Isi halaman/)
    await waitForLazy(/Bagian pembuka/)

    // Default "kuliner" menyalakan 12 bagian. Matikan 9 agar tersisa 3 yang
    // JAUH dari default kategori berikutnya.
    for (const name of [
      /Tentang kami/,
      /Galeri foto/,
      /Harga \/ Paket/,
      /Jam buka & lokasi/,
      /Keunggulan/,
      /Ulasan pelanggan/,
      /Bagian pembuka/,
      /Cara pesan/,
      /Penutup/,
    ]) {
      await user.click(screen.getByRole('switch', { name }))
    }
    await waitFor(() => expect(screen.getByText('3/12 menyala')).toBeInTheDocument())

    // 2. Ganti kategori -> pilihan manual TIDAK ditimpa.
    await openGroup(/Tentang usahamu/)
    await user.click(screen.getByRole('radio', { name: /Jasa/ }))
    await openGroup(/Isi halaman/)
    await waitForLazy(/Bagian pembuka/)
    expect(screen.getByText('3/12 menyala')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /Bagian pembuka/ })).not.toBeChecked()
    expect(screen.getByRole('switch', { name: /Cara pesan/ })).not.toBeChecked()
    expect(screen.getByRole('switch', { name: /Ulasan pelanggan/ })).not.toBeChecked()
    // Yang tersisa (default kuliner) tetap menyala; labelnya menyesuaikan
    // kategori baru: menu -> "Daftar layanan".
    expect(screen.getByRole('switch', { name: /Daftar layanan/ })).toBeChecked()
    expect(screen.getByRole('switch', { name: /Tombol ajakan/ })).toBeChecked()
    expect(screen.getByRole('switch', { name: /Kontak/ })).toBeChecked()

    // 3. Tombol atur ulang ke saran mengikuti kategori baru.
    await user.click(screen.getByRole('button', { name: 'Atur ulang ke saran' }))
    await waitFor(() => expect(screen.getByRole('switch', { name: /Cara pesan/ })).toBeChecked())
    expect(screen.getByRole('switch', { name: /Jam buka & lokasi/ })).not.toBeChecked()
    expect(screen.getByRole('switch', { name: /Ulasan pelanggan/ })).toBeChecked()
  })
})

describe('Form brief baru: sinkronisasi color picker <-> hex', () => {
  it('mengetik hex tersinkron ke input color dan nama warna tampil', async () => {
    renderPage()
    await pasteInto(await screen.findByLabelText('Deskripsi Website'), VALID_DESCRIPTION)
    await openGroup(/Tampilan/)
    await waitForLazy(/Biar AI yang memilih/)

    // Mode default = AI, color_palette tidak dikirim.
    await user.click(screen.getByRole('button', { name: 'Simpan & Buatkan Website' }))
    await waitFor(() => expect(createMock).toHaveBeenCalled())
    expect(lastPayload().brief.color_palette).toBeUndefined()

    // Pindah ke mode manual.
    await user.click(screen.getByRole('radio', { name: /Pilih sendiri/ }))
    const hex = screen.getByLabelText('Warna utama') as HTMLInputElement
    const picker = screen.getByLabelText('Warna utama: pemilih warna') as HTMLInputElement

    await user.clear(hex)
    await user.type(hex, '#6F4E37')
    await waitFor(() => expect(picker.value.toUpperCase()).toBe('#6F4E37'))
    expect(screen.getByText(/Terlihat sebagai cokelat tua/)).toBeInTheDocument()

    await user.clear(hex)
    await user.type(hex, 'merah')
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/kode warna/))
  })

  it('palet siap pakai mengisi kedua warna dan menampilkan nama', async () => {
    renderPage()
    await openGroup(/Tampilan/)
    await waitForLazy(/Biar AI yang memilih/)
    await user.click(screen.getByRole('radio', { name: /Pilih sendiri/ }))
    // Palet hanya muncul setelah mode manual aktif.
    await screen.findByText(/Palet siap pakai/)
    await user.click(screen.getByRole('button', { name: 'Elegan' }))
    await waitFor(() => expect(screen.getByLabelText('Warna utama')).toHaveValue('#1E3A8A'))
    expect(screen.getByLabelText('Warna aksen')).toHaveValue('#DDD6FE')
    // Nama warna selalu tampil sebagai TEKS, bukan hanya lewat warna.
    expect(screen.getByText(/Terlihat sebagai biru laut/)).toBeInTheDocument()
    expect(screen.getByText(/Terlihat sebagai ungu muda/)).toBeInTheDocument()
  })
})

describe('Form brief baru: validasi kontak', () => {
  it('menampilkan pesan Indonesia saat blur pada isian tidak valid', async () => {
    renderPage()
    await openGroup(/Kontak & tombol utama/)

    const wa = await screen.findByLabelText('Nomor WhatsApp')
    await user.type(wa, '0812')
    await user.tab()
    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0))
    expect(screen.getAllByText(/Nomor WhatsApp belum lengkap/)[0]).toBeInTheDocument()

    // Email tidak valid.
    const email = screen.getByLabelText('Email')
    await user.type(email, 'bukan-email')
    await user.tab()
    await waitFor(() =>
      expect(screen.getAllByText(/Format email belum benar/)[0]).toBeInTheDocument(),
    )

    // Tautan Maps tanpa skema.
    const maps = screen.getByLabelText('Tautan Google Maps')
    await user.type(maps, 'maps.google.com')
    await user.tab()
    await waitFor(() =>
      expect(screen.getAllByText(/harus diawali http/)[0]).toBeInTheDocument(),
    )

    // Submit ditahan.
    await user.click(screen.getByRole('button', { name: 'Simpan & Buatkan Website' }))
    expect(createMock).not.toHaveBeenCalled()
  })

  it('input valid tidak menghasilkan error', async () => {
    renderPage()
    await openGroup(/Kontak & tombol utama/)
    const wa = await screen.findByLabelText('Nomor WhatsApp')
    await user.type(wa, '0812 3456 7890')
    await user.tab()
    await waitFor(() => expect(screen.queryByText(/Nomor WhatsApp belum lengkap/)).toBeNull())
  })
})

describe('Form brief baru: penunjuk kelengkapan', () => {
  it('berubah sesuai isi dan memberi saran langkah berikutnya', async () => {
    renderPage()
    expect(screen.getByText('Brief 0% lengkap')).toBeInTheDocument()
    expect(screen.getByText(/Tulis deskripsi singkat/)).toBeInTheDocument()

    const textarea = await screen.findByLabelText('Deskripsi Website')
    await pasteInto(textarea, VALID_DESCRIPTION)
    await waitFor(() => expect(screen.getByText('Brief 40% lengkap')).toBeInTheDocument())
    expect(screen.getByText(/Pilih jenis usaha/)).toBeInTheDocument()

    // Memilih jenis usaha juga menyalakan bagian default kategori, jadi bobot
    // naik 20 (jenis usaha 10 + bagian halaman 10).
    await user.click(screen.getByRole('radio', { name: /Makanan & minuman/ }))
    await waitFor(() => expect(screen.getByText('Brief 60% lengkap')).toBeInTheDocument())
    expect(screen.getByText(/Pilih tujuan utama website/)).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /Menerima pesanan/ }))
    await waitFor(() => expect(screen.getByText('Brief 70% lengkap')).toBeInTheDocument())
    expect(screen.getByText(/Isi nomor WhatsApp/)).toBeInTheDocument()
  })

  it('tidak memblokir submit meski belum 100%', async () => {
    renderPage()
    await pasteInto(await screen.findByLabelText('Deskripsi Website'), VALID_DESCRIPTION)
    await user.click(screen.getByRole('button', { name: 'Simpan & Buatkan Website' }))
    await waitFor(() => expect(createMock).toHaveBeenCalled())
  })
})

describe('Form brief baru: error server dipetakan ke field', () => {
  it('VALIDATION_ERROR pada title memunculkan pesan di kelompok yang memuatnya', async () => {
    // ApiError asli dipakai agar `instanceof` pada handler mutation benar.
    createMock.mockRejectedValueOnce(
      new ApiError(400, 'Invalid request', 'VALIDATION_ERROR', {
        fields: { title: 'must be at most 200 characters' },
      }),
    )
    renderPage()
    await pasteInto(await screen.findByLabelText('Deskripsi Website'), VALID_DESCRIPTION)
    // Buka "Lanjutan" agar field title ada di DOM (accordion 1 terbuka).
    await user.click(screen.getByText(/Lanjutan: judul project/))
    await user.click(screen.getByRole('button', { name: 'Simpan & Buatkan Website' }))

    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0))
    expect(screen.getAllByText(/Server menolak: must be at most 200 characters/)[0]).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('field server yang tak dipetakan tetap ditampilkan apa adanya', async () => {
    createMock.mockRejectedValueOnce(
      new ApiError(400, 'Invalid request', 'VALIDATION_ERROR', {
        fields: { language: 'must be one of: id, en' },
      }),
    )
    renderPage()
    await pasteInto(await screen.findByLabelText('Deskripsi Website'), VALID_DESCRIPTION)
    await user.click(screen.getByRole('button', { name: 'Simpan & Buatkan Website' }))

    await waitFor(() =>
      expect(screen.getByText(/language: must be one of: id, en/)).toBeInTheDocument(),
    )
    expect(navigateMock).not.toHaveBeenCalled()
  })
})

describe('Form brief baru: alur minimum hanya deskripsi', () => {
  it('hanya deskripsi tetap terkirim danbernavigasi ke workspace ?autostart=1', async () => {
    renderPage()
    await pasteInto(await screen.findByLabelText('Deskripsi Website'), VALID_DESCRIPTION)
    await user.click(screen.getByRole('button', { name: 'Simpan & Buatkan Website' }))

    await waitFor(() => expect(createMock).toHaveBeenCalled())
    const payload = lastPayload()
    // Deskripsi yang dikirim = kalimat user + kalimat tetap website statis.
    expect(payload.brief.description).toBe(`${VALID_DESCRIPTION}\n\n${STATIC_SITE_NOTE}`)
    expect(payload.brief.description.length).toBeLessThanOrEqual(4000)
    expect(payload.title).toBeUndefined()
    expect(payload.brief.business_name).toBeUndefined()
    expect(payload.brief.style).toBeUndefined()
    expect(payload.brief.color_palette).toBeUndefined()
    expect(payload.brief.sections).toBeUndefined()
    expect(payload.brief.language).toBeUndefined()
    expect(payload.brief.website_type).toBeUndefined()

    await waitFor(() => expect(navigateMock).toHaveBeenCalled())
    expect(navigateMock.mock.calls[0][0]).toMatchObject({
      to: '/projects/$projectId',
      params: { projectId: 'p1' },
      search: { autostart: '1' },
    })
  })
})

describe('Form brief baru: draf sessionStorage', () => {
  it('draf pulih setelah dimuat ulang dan terhapus saat submit berhasil', async () => {
    renderPage()
    await pasteInto(await screen.findByLabelText('Deskripsi Website'), VALID_DESCRIPTION)
    await waitFor(() =>
      expect(JSON.parse(window.sessionStorage.getItem(BRIEF_DRAFT_KEY) ?? '{}').description).toBe(
        VALID_DESCRIPTION,
      ),
    )

    // Halaman dimuat ulang: isian kembali.
    cleanup()
    renderPage()
    await waitFor(() => expect(screen.getByLabelText('Deskripsi Website')).toHaveValue(VALID_DESCRIPTION))

    // Submit berhasil -> draf dihapus.
    await user.click(screen.getByRole('button', { name: 'Simpan & Buatkan Website' }))
    await waitFor(() => expect(window.sessionStorage.getItem(BRIEF_DRAFT_KEY)).toBeNull())
  })

  it('tombol "Mulai dari awal" mengosongkan form', async () => {
    renderPage()
    await user.click(await screen.findByRole('button', { name: /Kedai kopi/ }))
    await waitFor(() =>
      expect(screen.getByLabelText('Deskripsi Website')).not.toHaveValue(''),
    )
    // Tombol muncul setelah template dipilih.
    await user.click(screen.getByRole('button', { name: /Mulai dari awal/ }))
    await waitFor(() => expect(screen.getByLabelText('Deskripsi Website')).toHaveValue(''))
  })

  it('gambar tidak pernah ikut tersimpan di draf', async () => {
    renderPage()
    await pasteInto(await screen.findByLabelText('Deskripsi Website'), VALID_DESCRIPTION)
    await waitFor(() => expect(window.sessionStorage.getItem(BRIEF_DRAFT_KEY)).not.toBeNull())
    expect(window.sessionStorage.getItem(BRIEF_DRAFT_KEY)).not.toContain('images')
  })
})