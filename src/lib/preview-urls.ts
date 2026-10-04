/**
 * Registri URL pratinjau (Object URL) milik satu instance komponen.
 *
 * Masalah yang dipecahkan: cleanup `useEffect(..., [])` yang menutup
 * (`closure`) daftar `images` awal akan me-revoke kumpulan yang salah
 * (biasanya kosong) saat unmount — memory leak. Registri ini selalu
 * memegang daftar URL yang masih hidup, jadi `revokeAll()` saat unmount
 * membersihkan tepat URL yang tersisa.
 *
 * - `track(url)`: daftarkan URL yang baru dibuat.
 * - `release(url)`: revoke satu URL yang tidak dipakai lagi (sekali saja;
 *   pemanggilan ganda aman / tidak revoke dua kali).
 * - `revokeAll()`: revoke semua URL yang masih terdaftar (sekali saja).
 */
export type RevokeFn = (url: string) => void

export interface PreviewUrlRegistry {
  track(url: string): void
  release(url: string): void
  revokeAll(): void
  readonly size: number
}

export function createPreviewUrlRegistry(
  revoke: RevokeFn = (url) => URL.revokeObjectURL(url),
): PreviewUrlRegistry {
  const live = new Set<string>()

  return {
    track(url: string): void {
      live.add(url)
    },
    release(url: string): void {
      // `delete` mengembalikan false bila URL sudah tidak terdaftar,
      // sehingga revoke tidak pernah dipanggil dua kali untuk URL sama.
      if (live.delete(url)) {
        revoke(url)
      }
    },
    revokeAll(): void {
      for (const url of live) {
        revoke(url)
      }
      live.clear()
    },
    get size(): number {
      return live.size
    },
  }
}
