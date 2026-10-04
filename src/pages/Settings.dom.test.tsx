// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import SettingsPage from './Settings'
import { authApi } from '@/lib/api/auth'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@/lib/api/auth', () => ({
  authApi: { getMe: vi.fn(), logout: vi.fn() },
}))

const mockedGetMe = vi.mocked(authApi.getMe)

function user() {
  return { id: 'u1', email: 'budi@example.com', created_at: '2026-01-01T00:00:00Z' }
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('keadaan memuat menampilkan status memuat', () => {
    mockedGetMe.mockReturnValue(new Promise(() => {}))
    render(<SettingsPage />)
    expect(screen.getByText('Memuat profil…')).toBeInTheDocument()
    expect(screen.getByText('Memeriksa…')).toBeInTheDocument()
  })

  it('keadaan berhasil menampilkan profil tanpa teks hardcoded', async () => {
    mockedGetMe.mockResolvedValue(user())
    render(<SettingsPage />)
    await waitFor(() => expect(screen.getByText('budi@example.com')).toBeInTheDocument())
    expect(screen.getByText('budi')).toBeInTheDocument()
    expect(screen.getByText('Akun aktif')).toBeInTheDocument()
    expect(screen.queryByText('Authenticated')).toBeNull()
    expect(screen.queryByText('user@example.com')).toBeNull()
  })

  it('keadaan error menampilkan pesan dan tombol coba lagi yang refetch', async () => {
    mockedGetMe.mockRejectedValueOnce(new Error('Server mati'))
    render(<SettingsPage />)
    await waitFor(() => expect(screen.getByText(/Gagal memuat profil/)).toBeInTheDocument())
    expect(screen.getByText('Tidak diketahui')).toBeInTheDocument()

    mockedGetMe.mockResolvedValueOnce(user())
    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))
    await waitFor(() => expect(screen.getByText('budi@example.com')).toBeInTheDocument())
    expect(mockedGetMe).toHaveBeenCalledTimes(2)
  })
})
