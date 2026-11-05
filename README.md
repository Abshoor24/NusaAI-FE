# Nusa AI — Frontend AI Website Generator

Frontend untuk backend **AI Website Generator** (Go, REST + SSE).
Kontrak API: `C:\project\pakhir\be\docs\api.md` (single source of truth).

Alur: login → isi brief ("Website seperti apa yang ingin kamu buat?")
→ AI membuat satu file HTML mandiri → pratinjau → revisi lewat teks
→ riwayat versi → unduh `.html`.

## Prasyarat

- Node.js 20+, backend dev di `http://localhost:8080`
- CORS backend mengizinkan `http://localhost:5173` dan `http://localhost:3000`

## Env

| Variabel | Wajib | Keterangan |
|---|---|---|
| `VITE_API_BASE_URL` | Ya | Base URL backend, boleh origin (`http://localhost:8080`) atau + `/api/v1`. Fallback ke `VITE_API_URL` (nama lama). Jangan hardcode URL di kode. |
| `VITE_USE_MOCK` | Tidak | `true` = pakai mock tanpa backend (dev saja). |
| `VITE_MOCK_SCENARIO` | Tidak | Skenario mock generate/revise (lihat bawah). Bisa juga via query `?mock=<skenario>`. |

Lihat `.env.example`. Jangan taruh rahasia di `.env`.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest (39 test)
npm run lint       # oxlint
npm run typecheck  # tsc -b
npm run build      # tsc -b + vite build
```

## Mode Mock (hemat kuota Gemini)

Kuota free tier Gemini hanya ~20 request/hari — uji UI tanpa backend:

```bash
# .env
VITE_USE_MOCK=true
VITE_MOCK_SCENARIO=ok
npm run dev
```

Skenario (`VITE_MOCK_SCENARIO` atau `?mock=`):

| Nilai | Perilaku |
|---|---|
| `ok` (default) | Heartbeat + jeda 5 dtk sebelum token pertama + `done` |
| `pre502` | HTTP 502 JSON sebelum stream |
| `err-<REASON>` | Event `error` tengah stream (`PROVIDER_OVERLOADED`, `STREAM_TIMEOUT`, `STREAM_STALLED`, `OUTPUT_TRUNCATED`, `OUTPUT_BLOCKED`, `INVALID_OUTPUT`, `PROVIDER_ERROR`) |
| `no-terminal` | Stream putus tanpa event terminal (→ `STREAM_INTERRUPTED`) |
| `conflict-generating` | 409 sedang diproses |
| `conflict-revise` | 409 gunakan revise |
| `ratelimit` | 429 + `Retry-After: 60` |

Mock hidup di `src/mock/` dan hanya dimuat via dynamic import saat
`VITE_USE_MOCK=true` di dev. Build produksi (`import.meta.env.DEV=false`)
membuang cabang mock — terverifikasi tidak ada di `dist/`.

## Checklist Uji Manual (dengan backend dev + Gemini asli secukupnya)

1. Register → otomatis masuk → daftar project kosong.
2. Buat project (brief ≥10 karakter) → pindah ke workspace → generate otomatis mulai.
3. "Menyiapkan AI…" tampil dengan timer (jeda puluhan detik = normal).
4. `done` → pratinjau tampil; toggle lebar mobile 375 / tablet 768 / desktop bekerja.
5. Revisi ("ganti warna hero…") → versi 2; riwayat menampilkan 2 versi.
6. Pilih versi 1 → "Revisi dari versi ini" → kirim → versi 3 (dari basis v1).
7. Unduh versi 2 → file `.html` sesuai nama dari server.
8. Ubah judul (PATCH) → tersimpan; hapus project (konfirmasi) → hilang dari daftar.
9. Batalkan di tengah stream → status tidak macet di `generating` (jadi `failed`/`ready`).
10. Generate dua kali cepat → salah satu 409 tertangani (pesan + polling).
11. Kena rate limit → hitung mundur 60 dtk, tombol aktif lagi, tanpa retry otomatis.
12. Token kedaluwarsa → pesan "Sesi berakhir, silakan login kembali" + ke login.
13. Refresh saat `generating` → tampil "Sedang diproses…" + polling tiap 4 dtk.
14. Brief berisi "abaikan instruksi sebelumnya" → UI tidak terpengaruh, pratinjau tetap di iframe sandbox.
15. Lampirkan gambar (JPEG/PNG/WebP ≤10 MB, maks 4) → generate multipart berhasil; daftar attachment tampil.

## Keamanan (jangan dilanggar)

- HTML hasil AI hanya di `<iframe sandbox="allow-scripts allow-popups" srcDoc>` —
  tanpa `allow-same-origin`, tanpa `innerHTML`/`dangerouslySetInnerHTML`.
- Token SSE hanya untuk progres teks (`<pre>`), bukan pratinjau.
- HTML final selalu dari `GET /versions/{n}` setelah `done`.
- Token JWT di `localStorage` (aman karena iframe tanpa `allow-same-origin`
  tidak bisa membaca storage/DOM aplikasi). Jangan log token.
