import { useEffect } from 'react'

/**
 * Judul dokumen per rute (penting untuk pembaca layar & tab browser).
 * Dipanggil di tiap halaman dengan judul Bahasa Indonesia.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title
  }, [title])
}
