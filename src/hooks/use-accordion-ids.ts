import { useCallback, useState } from 'react'

/**
 * State buka/tutup untuk daftar accordion.
 *
 * Setter menerima daftar id yang harus terbuka, sehingga halaman bisa membuka
 * kelompok yang memuat error server tanpa menghapus kelompok lain.
 */
export function useAccordionIds(
  initial: string[],
): [string[], (id: string) => void, (ids: string[]) => void] {
  const [openIds, setOpenIdsState] = useState<string[]>(initial)
  const setOpenIds = useCallback((ids: string[]) => {
    setOpenIdsState((current) => (ids.every((id) => current.includes(id)) ? current : [...new Set([...current, ...ids])]))
  }, [])
  const toggle = useCallback(
    (id: string) =>
      setOpenIdsState((current) =>
        current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
      ),
    [],
  )
  return [openIds, toggle, setOpenIds]
}