# Backend TODO (satu halaman)

Tugas milik repo backend. Perintah curl bisa dijalankan dari
terminal mana pun; tanpa secret (pakai akun probe manual bila
perlu login). Basis: http://127.0.0.1:8080 (ganti host produksi
bila menguji di sana).

## 1. Expose header Retry-After [TERUKUR, frontend Round 3]

Keadaan: `curl -i -H "Origin: http://localhost:5173"
http://127.0.0.1:8080/health` menjawab
`Access-Control-Expose-Headers: Content-Disposition, X-Request-ID`
(tanpa Retry-After). DEPLOY.md mewajibkan
`Retry-After, Content-Disposition`. Akibat: browser menyembunyikan
Retry-After lintas origin sehingga hitung mundur 429 frontend
jatuh ke default 60 detik.
Perintah cek ulang setelah diperbaiki:
`curl -i -H "Origin: FE_ORIGIN" BE_ORIGIN/health | grep -i expose`
Harap: memuat `Retry-After`.

## 2. Pesan validasi sections [laporan pemilik, belum diverifikasi]

Kirim project dengan 13 section (batas 12) lalu baca
error.fields. Pesan sekarang "must be at most 12 characters"
(membingungkan: sections bukan characters). Harap: menyebut
items/sections, mis. "must have at most 12 items".
Contoh payload: bangun dari fixtures/brief-samples.ts via
buildProjectPayload lalu tambah satu section ekstra:
`npx tsx scripts/brief-contract-check.ts` memakai alur yang sama
(register/login/POST/DELETE otomatis; butuh backend menyala).

## 3. Validasi limit/offset [laporan pemilik, belum diverifikasi]

`curl "BE_ORIGIN/api/v1/projects?limit=abc&offset=-5" -H
"Authorization: Bearer TOKEN"` seharusnya 400 (parameter tak
valid), bukan 200 dengan data diam-diam atau 500.

## 4. total/has_more pada daftar [laporan pemilik, belum diverifikasi]

`curl "BE_ORIGIN/api/v1/projects" -H "Authorization: Bearer
TOKEN"` : minta field `total` atau `has_more` agar frontend bisa
menampilkan paginasi jujur. Bentuk envelope sekarang
`{ success, data: [...] }` tanpa info jumlah.

## 5. Jangan bocorkan teks Inggris [aturan main]

String Inggris yang pernah terlihat frontend (semuanya sudah
dipetakan ke Indonesia di src/lib/api/errors.ts, jadi ini
pertahanan berlapis, bukan bug frontend):
"Internal Server Error", "Service Unavailable",
"Too many requests", "Validation failed",
"Email already exists", "Authentication token has expired",
"Invalid email or password", "Gateway Timeout".
 grep sumber backend untuk string di atas pada path error, lalu
 ganti dengan kode stabil + pesan Indonesia, atau pastikan
 frontend tidak pernah menampilkannya mentah.

## 6. Bersihkan akun probe [aksi pemilik DB]

Akun: probe_20261009_0036@example.com (dipakai Round 3 untuk
uji kontrak 8 payload; semua 8 project sudah dihapus via API).
Pola (nama tabel/kolom UNKNOWN, sesuaikan skema; JANGAN
menjalankan buta):
`DELETE FROM users WHERE email =
'probe_20261009_0036@example.com';` lalu pastikan tidak ada
project yatim milik user id tersebut.
