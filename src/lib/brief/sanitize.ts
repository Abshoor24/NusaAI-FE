/**
 * Pembersihan teks bebas dari form brief.
 *
 * Aturan: buang karakter kontrol (C0/C1) dan rapatkan spasi berlebih.
 * Emoji, huruf beraksen, dan huruf Indonesia (a-z) TIDAK dihapus.
 */

/**
 * Mode satu baris: karakter kontrol dibuang, semua baris baru/tab menjadi
 * spasi, spasi berulang dirapatkan, ujung dipangkas.
 */
export function sanitizeText(input: string): string {
  return stripControls(input)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/ +/g, ' ')
    .trim()
}

/**
 * Sama seperti sanitizeText, tetapi mempertahankan pemisah baris (deskripsi
 * dan catatan tambahan boleh multi-baris). Setiap baris dirapikan; baris
 * kosong excess dibuang; maksimal 3 baris kosong berturut-turut.
 */
export function sanitizeMultiline(input: string): string {
  const lines = stripControls(input)
    .split(/\r\n|\r|\n/)
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
  const out: string[] = []
  let blankRun = 0
  for (const line of lines) {
    if (line.length === 0) {
      blankRun += 1
      if (blankRun > 1) continue
    } else {
      blankRun = 0
    }
    out.push(line)
  }
  while (out.length > 0 && out[out.length - 1] === '') out.pop()
  while (out.length > 0 && out[0] === '') out.shift()
  return out.join('\n')
}

function stripControls(input: string): string {
  let out = ''
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 32
    // C0 (0-31), DEL (127), dan C1 (128-159) dibuang; TAB (9) & LF (10) &
    // CR (13) dipertahankan agar struktur baris tidak hilang.
    if (code === 9 || code === 10 || code === 13) {
      out += ch
      continue
    }
    if (code < 32 || code === 127) continue
    if (code >= 128 && code <= 159) continue
    out += ch
  }
  return out
}