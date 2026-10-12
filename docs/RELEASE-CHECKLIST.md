# Release Checklist - Pakhir Studio (Frontend)

Sumber: fakta di repo ini (nama berkas dan perilaku yang diuji).
Yang tidak diketahui ditandai UNKNOWN. Tidak ada klaim yang
dikarang. Terakhir diperbarui: Round 5.

## 1. Tes manual (hanya pemilik yang bisa melakukan)

### 1.1 Evaluasi Brief AI sungguhan
Ikuti docs/BRIEF-EVAL.md apa adanya:
- Delapan brief di fixtures/brief-samples.ts: kedai-kopi,
  jasa-foto, toko-online-baju, bimbel, barbershop, katering,
  undangan-pernikahan, portofolio-desainer.
- Langkah: isi brief manual di /projects/new tanpa melihat fixture
  (catat waktu), simpan, generate dengan ?autostart=1, buka hasil
  di tab baru, nilai dengan checklist A (warna) sampai F (tujuan).
- Bandingkan form lama vs form baru di tabel bagian 5, tulis
  kesimpulan di bagian 6.
- Pendahuluan yang bisa dijalankan lokal (tanpa AI, tanpa kuota):
  `npx tsx scripts/brief-contract-check.ts` membuktikan 8 payload
  diterima backend (HTTP 201) lalu menghapus projectnya lagi.
  Perlu backend menyala dan akun probe (lihat BACKEND-TODO.md).

### 1.2 Klik WhatsApp dan Maps di pratinjau hasil generate
- Tombol WhatsApp harus membuka aplikasi/tab chat ke nomor yang
  diisi (cek digitnya sama persis, lihat BRIEF-EVAL C1/C8).
- Tautan Maps harus membuka peta di tab baru; halaman pratinjau
  harus tetap utuh (tidak blank). Perilaku yang diuji otomatis:
  tautan luar tanpa target diberi target=_blank otomatis,
  mailto:/tel: TIDAK boleh membuka tab kosong
  (e2e/preview-links.spec.ts seri H, offline, tanpa CDN).
- Tombol "kembali" browser dari tab baru harus mendarat di
  workspace, bukan halaman rusak.

### 1.3 Cek HP (disarankan 360x640 dan 360x740, Chrome Android)
- Drawer sidebar di atas daftar project TERISI: buka, pilih menu,
  tutup; tidak ada item yang tidak terjangkau.
- Tombol sticky "Simpan & Buatkan Website" tidak menutupi isian
  terakhir saat keyboard HP terbuka maupun tertutup.
- Picu 429 (kirim berulang cepat): hitung mundur tampil dalam
  Bahasa Indonesia dan tombol aktif lagi setelahnya.
- Halaman /login dan /register pada 360x640: semua isian dan
  tombol submit terjangkau tanpa scroll dalam kartu.
- Toolbar workspace (pratinjau HP/tablet/desktop, unduh, salin,
  revisi) membungkus rapi, tidak overflow horizontal.
- Keadaan tekan (tap) terlihat pada tombol utama dan item
  navigasi (umpan balik :active).

### 1.4 Unduh dan buka HTML di HP
- Unduh dari workspace; nama berkas memakai filename* yang
  tersanitasi (diuji di workspace-export.spec.ts).
- Buka berkas di browser HP (via file:// atau bagikan lewat
  hosting statis): layout rapi, gambar/CDN termuat bila online,
  tidak ada pesan error yang terlihat pengguna.

## 2. Tugas backend (pemilik: repo backend)

Detail dan perintah curl ada di docs/BACKEND-TODO.md.
- Expose header Retry-After (TERUKUR HILANG: Round 3 mencatat
  Access-Control-Expose-Headers hanya Content-Disposition dan
  X-Request-ID; DEPLOY.md mewajibkan Retry-After).
- Pesan validasi sections "must be at most 12 characters"
  seharusnya menyebut items (laporan pemilik, belum diverifikasi
  dari repo ini).
- GET /projects?limit=abc&offset=-5 seharusnya 400 (laporan
  pemilik, belum diverifikasi dari repo ini).
- Tambah total atau has_more pada daftar project (laporan
  pemilik, belum diverifikasi dari repo ini).
- Pastikan tidak ada endpoint membocorkan teks error Inggris
  (daftar string Inggris yang pernah terlihat frontend ada di
  BACKEND-TODO.md; frontend sudah memetakan semuanya ke
  Indonesia di src/lib/api/errors.ts).
- Hapus akun probe: probe_20261009_0036@example.com (pola SQL di
  BACKEND-TODO.md; nama tabel/kolom perlu konfirmasi karena
  skema backend tidak ada di repo ini -> UNKNOWN).

## 3. Deployment

Fakta dari DEPLOY.md (bagian "Persyaratan Backend API" dan
"Contoh Nginx"):
- Frontend HTTPS WAJIB memakai API HTTPS (mixed content diblokir
  browser). Origin API produksi: UNKNOWN (belum diputuskan).
- CORS: Allow-Origin = domain frontend (bukan * bila memakai
  kredensial), Allow-Methods GET/POST/PUT/PATCH/DELETE/OPTIONS,
  Allow-Headers Content-Type/Authorization, Expose-Headers
  Retry-After + Content-Disposition.
- Nginx untuk /api/: proxy_buffering off, X-Accel-Buffering no,
  proxy_http_version 1.1, proxy_read_timeout 3600s,
  gzip off untuk text/event-stream.
- Tombol "Salin HTML" butuh secure context (HTTPS atau
  localhost); di HTTP IP polos ia menampilkan pesan Indonesia,
  bukan crash.
- Pelaporan error opsional via VITE_ERROR_ENDPOINT (nama
  variabel saja; nilainya rahasia deploy, tidak ada di repo).
- Belum diputuskan (UNKNOWN sampai pemilik memilih): platform
  hosting, domain + DNS/TLS, strategi backup database,
  pembatasan kuota/rate-limit API Gemini.

## 4. Keputusan produk terbuka (dari docs/visual-proposal.md)

Tanpa rekomendasi; pilih dan tugaskan per nomor:
- Area 1 hero gradient: hapus semburat (A) atau pita identitas (B).
- Area 2 ikon langkah: glyph lebih spesifik (A) atau set motif (B).
- Area 3 panah CTA: catat tujuan dan pertahankan (A) atau cabut (B).
- Area 4 kartu langkah: kartu unggulan langkah 3 (A) atau daftar
  baris bernomor (B). Keduanya menggeser tinggi landing.
- Area 5 ritme section/footer: variasikan satu section (A) atau
  gabung Cara Kerja+Tentang (B, butuh kata transisi).
- Area 6 identitas: kunci lockup rapi (A) atau DESIGN.md +
  logo/aksen/motif (B).
- Palet aksen: tetap monokrom, V1 TELAGA, atau V2 SENJA.
- Token --border-control untuk item NON-form (chip, kartu-radio,
  baris toggle, kartu project, tombol berbingkai, batas kartu,
  batas galat, tint aktif sidebar): screenshot
  before/after ada di e2e/screenshots/phase-a11y/ (gitignored).
- Tema bawaan: tetap gelap, ikuti sistem, atau terang dulu.
- SELESAI Round 4: kontak footer terverifikasi (D3),
  T17/T24 + border kontrol (D1/D2), mock tidak terkirim (4.3).

## 5. First Actions run (workflow BELUM pernah jalan di GitHub)

Status: workflow .github/workflows/ci.yml + playwright.config.ts CI
belum pernah dieksekusi di GitHub Actions sampai Round 5 ini.
Verifikasi lokal di bawah memakai urutan langkah yang sama.

Yang dicek pada run pertama di Actions:
- Job check hijau dalam timeout 20 menit; job external-cdn
  non-blocking (continue-on-error) dalam 15 menit.
- Setup-node memakai Node dari .nvmrc (node-version-file), cache npm
  hit (cache: npm).
- npm ci bersih, npm run check hijau (tsc + oxlint + vitest 28/327
  + vite build).
- Playwright install chromium --with-deps sukses.
- Required set 155/155 lulus tanpa retry (retries: 1 hanya bila gagal
  pertama; flake hunt lokal 4x155 + 180x error-messages = 0 gagal).
- webServer CI: vite preview port 5173, timeout 180000 ms cukup untuk
  tsc -b + vite build + preview start di runner lambat,
  reuseExistingServer false, stdout/stderr pipe untuk diagnosis.
- Bila gagal: artifact playwright-report + test-results terunggah
  dengan retention 7 hari; unduh dan buka trace.
- Concurrency cancel-in-progress bekerja (push baru membatalkan run
  lama pada ref yang sama); permissions contents: read.
- Tidak ada action di luar actions/checkout@v4,
  actions/setup-node@v4, actions/upload-artifact@v4.

## 6. Evaluasi brief legacy vs new (Round 5, manual pemilik)

Alat: scripts/brief-eval.ts via `npm run eval:brief` (docs/BRIEF-EVAL.md
bagian 0). Agen tidak menjalankannya terhadap AI sungguhan.

- Prasyarat: backend menyala, kuota AI tersedia, RUN_REAL_AI=1 dan --yes.
- Mulai kecil: `$env:RUN_REAL_AI="1"; npm run eval:brief -- --yes --only kedai-kopi`
  (2 generasi, 2-4 menit), lalu `--repeat 2` untuk noise, baru 8 sampel penuh.
- Hasil di eval-output/yyyymmdd-hhmmss/: HTML per varian, payload JSON,
  meta, results.json, report.md (heuristik objektif), scoring.md (isi manual
  1-5 A-F + sinyal S1-S3), index.html (galeri sandbox allow-scripts saja).
- SELESAI Round 5: alat + 12 tes mock (29 berkas / 339 tes unit),
  .gitignore eval-output/, docs BRIEF-EVAL bagian 0.

## 7. Status Round 5

- SELESAI: footer 3 kolom terverifikasi render 1280/768/360 tanpa slot
  kosong, kontak pemilik (gmail + Purwokerto), tanpa perubahan layout
  (Round 5 Phase 1, tmp spec, docs visual-proposal F-15).
- SELESAI: audit T17 7 berkas + status workspace; tombol Sidebar/Settings
  pengecualian disetujui (terang 4.83 ke 6.47, gelap tetap), status emerald
  D1/T24; PERTAHANKAN, tanpa warna lain berubah (visual-proposal F-13/F-14).
- SELESAI: flake hunt 3x workers=2 + 1x workers=1 (0 gagal pertama) +
  error-messages repeat-20 180/180; tanpa perbaikan (tidak ada flake).
- SELESAI: CI hardening (webServer 180s, reuse false, pipe; workflow
  permissions/concurrency/timeout/nvmrc/retensi 7 hari); YAML tanpa parser
  di node_modules (tidak install); langkah lokal hijau dari dist/ dihapus.
- SELESAI: engines Node dari irisan terpasang
  (`^22.12.0 || ^24.0.0 || >=26.0.0`, pembatas vitest), .nvmrc 24,
  workflow node-version-file; package.json hanya engines + eval:brief.
- BELUM JALAN: workflow GitHub (lihat bagian 5); evaluasi AI sungguhan
  (pemilik, backend menyala).
