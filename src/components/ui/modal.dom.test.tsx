// @vitest-environment jsdom
import { useState } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { Modal } from './modal'

function Wrap({ onCloseSpy }: { onCloseSpy?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Buka dialog</button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false)
          onCloseSpy?.()
        }}
        title="Uji Modal"
        description="Deskripsi dialog"
      >
        <button>Tombol A</button>
        <button>Tombol B</button>
      </Modal>
    </>
  )
}

describe('Modal', () => {
  afterEach(() => {
    cleanup()
  })

  it('punya atribut dialog yang benar', () => {
    render(<Wrap />)
    fireEvent.click(screen.getByRole('button', { name: 'Buka dialog' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby')
    const labelledBy = dialog.getAttribute('aria-labelledby') ?? ''
    expect(document.getElementById(labelledBy)).toHaveTextContent('Uji Modal')
    expect(dialog).toHaveAttribute('aria-describedby')
  })

  it('Escape menutup dialog dan fokus kembali ke pemicu', async () => {
    const onClose = vi.fn()
    render(<Wrap onCloseSpy={onClose} />)
    const trigger = screen.getByRole('button', { name: 'Buka dialog' })
    // fireEvent.click tidak memindahkan fokus (tidak seperti klik nyata);
    // fokuskan eksplisit agar pengembalian fokus bisa diverifikasi.
    trigger.focus()
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(trigger).toHaveFocus()
  })

  it('focus trap: Tab dari elemen terakhir kembali ke pertama', async () => {
    render(<Wrap />)
    fireEvent.click(screen.getByRole('button', { name: 'Buka dialog' }))

    // Fokus awal jatuh ke elemen focusable pertama (tombol tutup).
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tutup dialog' })).toHaveFocus())

    const tombolB = screen.getByRole('button', { name: 'Tombol B' })
    tombolB.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'Tutup dialog' })).toHaveFocus()

    // Shift+Tab dari pertama kembali ke terakhir.
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(tombolB).toHaveFocus()
  })

  it('klik backdrop menutup dialog', async () => {
    render(<Wrap />)
    fireEvent.click(screen.getByRole('button', { name: 'Buka dialog' }))
    const backdrop = screen.getByRole('dialog').previousElementSibling
    if (!(backdrop instanceof HTMLElement)) throw new Error('backdrop tidak ditemukan')
    fireEvent.click(backdrop)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
