// @vitest-environment jsdom
import { StrictMode, useState } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImagePicker, type PickedImage } from './ImagePicker'

function png(name: string, size = 100): File {
  const bytes = new Uint8Array(size)
  return new File([bytes], name, { type: 'image/png' })
}

function Harness({ onChangeSpy }: { onChangeSpy?: (imgs: PickedImage[]) => void }) {
  const [images, setImages] = useState<PickedImage[]>([])
  return (
    <ImagePicker
      images={images}
      onChange={(imgs) => {
        setImages(imgs)
        onChangeSpy?.(imgs)
      }}
    />
  )
}

function fileInput(): HTMLInputElement {
  // input file tersembunyi; satu-satunya input file di komponen.
  const el = document.querySelector('input[type="file"]')
  if (!(el instanceof HTMLInputElement)) throw new Error('input file tidak ditemukan')
  return el
}

describe('ImagePicker', () => {
  let created: string[]
  let revoked: string[]

  beforeEach(async () => {
    // Biarkan revoke tertunda (setTimeout 0 saat unmount) dari tes
    // sebelumnya selesai dulu, agar tidak bocor ke hitungan tes ini.
    await new Promise((resolve) => setTimeout(resolve, 10))
    created = []
    revoked = []
    let n = 0
    URL.createObjectURL = vi.fn(() => {
      n += 1
      const url = `blob:mock-${n}`
      created.push(url)
      return url
    }) as typeof URL.createObjectURL
    URL.revokeObjectURL = vi.fn((url: string) => {
      revoked.push(url)
    })
  })

  afterEach(() => {
    // Vitest berjalan tanpa globals:true sehingga auto-cleanup RTL
    // nonaktif; bersihkan DOM manual agar tes tidak saling mengotori.
    cleanup()
    vi.restoreAllMocks()
  })

  it('tambah 3 gambar lalu unmount -> revokeObjectURL terpanggil 3x', async () => {
    const { unmount } = render(<Harness />)
    fireEvent.change(fileInput(), { target: { files: [png('a.png'), png('b.png'), png('c.png')] } })
    expect(screen.getAllByRole('img')).toHaveLength(3)

    unmount()
    await waitFor(() => expect(revoked).toHaveLength(3))
    expect([...revoked].sort()).toEqual([...created].sort())
  })

  it('hapus satu gambar -> hanya URL itu yang di-revoke', () => {
    render(<Harness />)
    fireEvent.change(fileInput(), { target: { files: [png('a.png'), png('b.png')] } })
    expect(created).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Hapus gambar a.png' }))
    expect(revoked).toEqual([created[0]])
    expect(screen.queryByRole('button', { name: 'Hapus gambar a.png' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Hapus gambar b.png' })).toBeInTheDocument()
  })

  it('maksimal 4 gambar, sisanya ditolak dengan pesan Indonesia', () => {
    render(<Harness />)
    fireEvent.change(fileInput(), {
      target: { files: [png('1.png'), png('2.png'), png('3.png'), png('4.png'), png('5.png')] },
    })
    expect(screen.getAllByRole('img')).toHaveLength(4)
    expect(screen.getByText(/Maksimal 4 gambar per permintaan/)).toBeInTheDocument()
  })

  it('tipe dan ukuran tidak valid ditolak dengan pesan Indonesia', () => {
    render(<Harness />)
    const txt = new File(['halo'], 'catatan.txt', { type: 'text/plain' })
    fireEvent.change(fileInput(), { target: { files: [txt] } })
    expect(screen.getByText(/format harus JPEG, PNG, atau WebP/)).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()

    const big = png('besar.png', 10 * 1024 * 1024 + 1)
    fireEvent.change(fileInput(), { target: { files: [big] } })
    expect(screen.getByText(/melebihi 10 MB/)).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('tombol hapus punya aria-label nama file dan bisa dipakai keyboard', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    fireEvent.change(fileInput(), { target: { files: [png('foto.png')] } })

    const del = screen.getByRole('button', { name: 'Hapus gambar foto.png' })
    del.focus()
    await user.keyboard('{Enter}')
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Hapus gambar foto.png' })).toBeNull(),
    )
    expect(revoked).toHaveLength(1)
  })

  it('di bawah StrictMode, URL yang masih tampil tidak ter-revoke', async () => {
    const { unmount } = render(
      <StrictMode>
        <Harness />
      </StrictMode>,
    )
    await act(async () => {
      fireEvent.change(fileInput(), { target: { files: [png('a.png'), png('b.png')] } })
    })
    // Efek mount ganda StrictMode tidak boleh me-revoke URL yang hidup.
    expect(revoked).toHaveLength(0)
    expect(screen.getAllByRole('img')).toHaveLength(2)

    unmount()
    await waitFor(() => expect(revoked).toHaveLength(2))
  })
})
