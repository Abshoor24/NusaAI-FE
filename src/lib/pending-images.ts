/**
 * Gambar referensi menunggu generate.
 * Gambar dikirim BERSAMA request generate (bukan saat POST /projects), jadi
 * disimpan di memori sampai workspace memulai generate. Tidak bertahan
 * bila halaman dimuat ulang — workspace memberi tahu user bila ini terjadi.
 */
const store = new Map<string, File[]>()

export function setPendingImages(key: string, files: File[]): void {
  store.set(key, files)
}

export function takePendingImages(key: string): File[] | null {
  const files = store.get(key) ?? null
  store.delete(key)
  return files
}

export function peekPendingImages(key: string): boolean {
  return store.has(key)
}
