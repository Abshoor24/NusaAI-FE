# Prompt Reusable: Redesign Halaman dengan Desain Baru + Konversi Tema + Anti-Slop

## Cara pakai (bagian ini bukan bagian prompt)

1. Taruh kode desain baru (hasil Figma Make) di folder `design-baru/` di root proyek. Kalau tidak bisa, tempel kodenya di bagian paling bawah prompt.
2. Isi blok VARIABEL di bagian 0. Contoh di bawah sudah diisi untuk kasus landing page hitam-putih.
3. Salin semuanya dari `=== MULAI PROMPT ===` sampai `=== AKHIR PROMPT ===` ke AI coding agent yang bisa membaca dan mengedit repo (Claude Code, Cursor, Codex, Cline, dll).
4. Untuk halaman lain (pricing, about, dashboard, dsb.) cukup ganti isi VARIABEL. Isi prompt lainnya tidak perlu diubah.
5. Anti-slop (https://github.com/miqdadbadjuber/anti-slop) adalah filter, bukan panduan gaya. Arah visual tetap datang dari desain Figma dan file `DESIGN.md`. Prompt ini sudah menyuruh agent membuat `DESIGN.md` untuk itu.

---

=== MULAI PROMPT ===

# TUGAS: Redesign {{HALAMAN_TARGET}} memakai desain baru, bertema {{TEMA_TARGET}}, bebas AI slop

## 0. VARIABEL

```
HALAMAN_TARGET      : Landing page (halaman utama proyek ini)
SUMBER_DESAIN_BARU  : folder `design-baru/` (kode hasil Figma Make: React + Vite + Tailwind CSS v4)
TEMA_TARGET         : Hitam dan putih (monokrom). Tanpa warna aksen berwarna.
ROUTE_TERKUNCI      : semua tujuan link di navbar dan footer, termasuk yang menuju login dan register
BAHASA_KONTEN       : ikuti bahasa yang dipakai halaman saat ini
DI_LUAR_SCOPE       : halaman login/register, halaman lain, backend/API, konfigurasi auth
```

Kalau ada variabel yang kosong atau tidak cocok dengan isi repo, pakai nilai paling masuk akal dari hasil audit dan catat asumsimu di laporan akhir. Jangan berhenti untuk bertanya kecuali pada kondisi di bagian 10.

## 1. Peran dan tujuan

Kamu adalah front-end engineer sekaligus desainer yang teliti. Saya sudah punya {{HALAMAN_TARGET}} yang berjalan, dan saya juga punya desain baru dalam bentuk kode (dibuat oleh Figma AI). Tujuanmu:

1. Menganalisis komponen dan halaman yang sekarang.
2. Menganalisis kode desain baru.
3. Mengintegrasikan desain baru ke proyek yang ada. Boleh **menambah, menghapus, dan mengedit** komponen/section sebanyak yang diperlukan agar tampilan akhirnya sesuai desain baru.
4. Mengubah tema desain baru menjadi {{TEMA_TARGET}}. Tema warna-warni bawaan Figma tidak dipakai. Selain tema, desain baru (layout, struktur section, tipografi, ritme spasi, interaksi) dipertahankan karena sudah bagus.
5. Memastikan hasil akhir tidak terlihat seperti output AI generik (AI slop), memakai skill anti-slop.

Tidak ada satu pun URL tujuan navigasi yang boleh berubah.

## 2. Aturan keras (tidak boleh dilanggar)

1. **Route terkunci.** Jangan ubah `href`, `to`, `path`, argumen `navigate()`/`router.push()`, atau handler apa pun yang menuju route di ROUTE_TERKUNCI. Yang boleh berubah hanya tampilan: teks label, styling, posisi, markup pembungkus. Kalau desain baru punya tombol/CTA yang tidak punya padanan di proyek, jangan mengarang route baru. Pakai tujuan yang sudah ada untuk fungsi setara, atau anchor (`#section-id`) di halaman yang sama, lalu catat di laporan.
2. **Scope.** Hanya sentuh file yang terkait HALAMAN_TARGET dan dependensinya (komponen, style, aset). Jangan edit apa pun di DI_LUAR_SCOPE.
3. **Nol warna berwarna** pada hasil akhir (lihat bagian 7, langkah D2).
4. **Jangan salin scaffold Figma Make.** `index.html` (yang berisi komentar `figma:*`), `src/main.tsx`, `vite.config.ts`, `package.json`, `tsconfig.json`, dan `.mise.toml` dari desain baru hanyalah kerangka proyek Figma. Jangan timpa file proyek saya dengan itu. Yang diambil hanya `src/App.tsx` dan komponen turunannya, bagian kustom di `src/index.css` (tema, font, animasi), serta aset.
5. **Jangan mengarang konten.** Semua teks Inggris di kode desain baru adalah placeholder dari Figma AI, bukan konten final. Jangan pakai statistik, testimoni, logo klien, rating, atau nama orang palsu.
6. **Fungsionalitas yang ada harus tetap jalan**: form, state, pemanggilan API, status login pada navbar, analytics, SEO meta, i18n, perilaku scroll.
7. **Jangan install dependency baru** kecuali tidak ada cara lain. Kalau terpaksa, sebutkan alasannya di laporan.
8. **Jangan hapus file** sebelum terbukti tidak terpakai (cek impor dan referensi dengan grep).
9. **Git.** Kalau ini repo git, kerjakan di branch baru `redesign/{{nama-halaman}}`. Jangan commit atau push kecuali saya minta.
10. **Jujur.** Jangan menulis "sudah dites/PASS" untuk hal yang tidak benar-benar kamu jalankan. Kalau sesuatu tidak bisa diverifikasi (misalnya tidak bisa membuka browser), katakan terus terang.

## 3. Setup anti-slop (wajib sebelum menyentuh kode)

Sumber: https://github.com/miqdadbadjuber/anti-slop. Isinya 38 aturan wajib (R-01 sampai R-38) dalam tiga tingkat (Hard Gate, Purpose-Gate, Quality Locks), Liveliness Toolkit dengan tiga dial (ENERGY, RHYTHM, MOTION), dan Delivery Gate berupa laporan PASS/FAIL sebelum hasil diserahkan.

1. Cek apakah skill `antislop` sudah tersedia di agent kamu. Kalau belum, pasang dengan salah satu cara:
   - `npx antislop-ai` (pilih skill: antislop, antislop-ui, antislop-copywriting, antislop-human, antislop-layoutmobile, antislop-code; instal untuk project ini)
   - atau `npx skills add miqdadbadjuber/anti-slop`
   - Kalau tidak bisa menjalankan perintah, unduh `https://raw.githubusercontent.com/miqdadbadjuber/anti-slop/main/antislop.md`, baca **seluruhnya**, dan patuhi sebagai aturan kerja.
   - Jangan pernah mengaku memakai anti-slop kalau belum benar-benar memuat atau membaca aturannya.
2. **Mode: `during`.** Jangan tanya mode ke saya. Tulis satu baris di awal responsmu: `antislop active: during`. Setelah implementasi selesai, jalankan juga satu pass audit bergaya mode `after` pada hasilmu sendiri (bagian 8).
3. Muat skill sesuai fase:
   - `antislop` (core): selalu aktif.
   - `antislop-ui`: saat implementasi dan pass anti-slop (layout, warna, komponen, dekorasi, motion).
   - `antislop-copywriting`: setiap kali menulis atau mengubah teks.
   - `antislop-human`: kontras, keyboard, focus, state.
   - `antislop-layoutmobile`: responsif, breakpoint, overflow, tap target.
   - `antislop-code`: pembersihan komentar di akhir.
4. **Anti-slop itu filter, bukan arah desain.** Arah desain datang dari desain baru ditambah tema {{TEMA_TARGET}}. Buat `DESIGN.md` di root proyek (kalau sudah ada, baca dan hormati, hanya tambahkan bagian yang kurang). Isi singkat 15 sampai 25 baris: tema dan token warna, tipografi yang diambil dari desain baru, skala spasi, bentuk (radius/border), karakter motion, dan nada copy. Kalau hasil akhir terasa steril atau datar, penyebabnya arah yang kurang. Perbaiki lewat `DESIGN.md` dan liveliness dial, jangan melonggarkan filter (R-37).

## 4. FASE A: Audit proyek sekarang (read-only, jangan ubah file)

Hasilkan inventaris berikut. Semuanya harus berdasarkan isi repo, bukan tebakan.

1. **Stack**: framework (Next.js/Vite/CRA/Astro/dll), versi React, Tailwind v3 atau v4 atau CSS modules/styled-components, router, library UI, library ikon, font, library animasi.
2. **Pohon komponen** halaman target: entry file dan semua komponen yang menyusunnya.
3. **Tabel route**: untuk setiap link di navbar, footer, hero, dan CTA, catat `label | href/route | file:baris | jenis (internal/eksternal/anchor/auth)`. Simpan snapshot-nya ke `.redesign/route-snapshot.md` (file sementara, jangan di-commit). Ini patokan pembanding di akhir.
4. **Token tema sekarang**: warna hitam/putih/abu yang persis dipakai, font, radius, shadow, dan mekanisme dark/light mode. Ini menjadi sumber kebenaran tema akhir.
5. **Konten nyata**: headline, deskripsi, fitur, harga, FAQ, kontak, sosmed, legal, SEO meta, nama brand, logo.
6. **Fungsionalitas**: form, handler, API call, state auth (mis. navbar berubah saat login), analytics, scroll behavior.
7. **Aset**: gambar, SVG, video, font yang dipakai halaman.
8. **Baseline kualitas**: jalankan typecheck/lint/build yang ada dan catat error yang sudah ada sebelum perubahan.

## 5. FASE B: Analisis desain baru

Baca semua kode di SUMBER_DESAIN_BARU, abaikan scaffold (aturan keras nomor 4), lalu catat:

1. Daftar section berurutan: nama, tujuan, struktur layout (grid/flex, kolom), komponen penyusun, interaksi dan animasi.
2. Sistem desain: skala tipografi, bobot font, spasi antar section, radius, border, shadow, efek (blur, gradient, overlay), ikon, gambar.
3. Spesifik Tailwind v4 yang mungkin perlu diterjemahkan kalau proyek saya memakai v3 (`@import 'tailwindcss'`, `@theme`, `@utility`, `bg-linear-to-*`, `size-*`, sintaks opacity baru, dsb.).
4. **Tabel warna berwarna**: setiap warna non-netral di desain baru, lokasinya, dan perannya (background, teks, aksen, border, gradient, status). Ini bahan untuk konversi tema.
5. Teks placeholder yang harus diganti dengan konten nyata.

## 6. FASE C: Rencana integrasi

Buat tabel mapping lalu tampilkan ringkas di respons, kemudian langsung lanjut ke implementasi (tanpa menunggu persetujuan):

`Section/komponen lama | Padanan di desain baru | Aksi | Alasan | File terdampak`

Aksi yang dipakai: **KEEP** (tetap), **RESTYLE** (logika tetap, tampilan diubah), **REPLACE** (diganti komponen baru), **ADD** (section baru dari desain), **REMOVE** (dihapus), **MERGE** (digabung).

Prinsip:
- Komponen lama yang reusable (Button, Container, logika Navbar, bagian yang sadar-auth) dipertahankan dan di-restyle, bukan ditulis ulang. Ini menjaga konsistensi dan menjaga route tetap aman.
- **ADD**: section baru tanpa konten nyata dibuat sebagai struktur dengan `TODO(konten)`, atau memakai copy jujur dari konten yang sudah ada. Jangan isi dengan angka palsu.
- **REMOVE**: hanya hapus section lama yang benar-benar digantikan. Kalau berisi konten penting (harga, kontak, legal, FAQ), pindahkan ke tempat yang masuk akal di struktur baru dan catat di laporan.

## 7. FASE D: Implementasi

**D1. Struktur kode.** Pecah desain menjadi komponen kecil sesuai konvensi proyek saya (penamaan, folder, gaya export, alias import). Jangan menaruh semuanya dalam satu `App.tsx`. TypeScript tetap strict, tanpa `any`.

**D2. Konversi tema ke {{TEMA_TARGET}}.**
- Definisikan token di tempat tema yang sudah dipakai proyek (CSS variables, `@theme`, atau `tailwind.config`). Pakai nama token yang sudah ada. Nilai hitam, putih, dan abu diambil **persis dari hasil audit** (Fase A nomor 4), bukan dikarang baru. Batasi skala abu seperlunya (sekitar 4 sampai 6 tingkat).
- Petakan setiap warna berwarna di tabel Fase B ke padanan netral berdasarkan **perannya**: background, surface, border, teks utama, teks sekunder, teks redup, blok terbalik (hitam di atas putih atau sebaliknya).
- Hierarki yang tadinya dibawa oleh warna sekarang dibawa oleh: ukuran dan bobot font, kontras hitam-putih, inversi section (section hitam vs putih), hairline border, spasi, dan pola tipis. Jangan cuma "membuang warna" lalu membiarkan halaman jadi datar.
- Gradient berwarna: hapus. Gradient netral hanya boleh kalau punya fungsi (misalnya fade di tepi), bukan dekorasi.
- Glow dan shadow berwarna diganti shadow netral tipis atau border.
- Gambar, ilustrasi, dan ikon berwarna: jadikan grayscale (filter CSS `grayscale`, atau SVG `fill`/`stroke` ke `currentColor`) atau ganti dengan aset netral. Jangan pakai emoji berwarna sebagai ikon.
- Mode terang/gelap: ikuti mekanisme proyek sekarang. Kalau sekarang satu mode, tetap satu mode. Jangan menambah toggle yang tidak ada.
- Warna semantik (error/sukses pada form) kalau ada di halaman: ekspresikan lewat ikon, teks, tebal border, atau pola. Kalau benar-benar butuh warna fungsional, ikuti yang sudah ada di proyek dan catat di laporan.
- Kontras minimal WCAG AA: 4,5:1 untuk teks normal, 3:1 untuk teks besar dan elemen UI.

**D3. Konten.** Ganti semua teks placeholder Inggris dengan konten nyata dari halaman lama/proyek, dalam BAHASA_KONTEN. Untuk section baru yang tidak punya padanan konten, tulis copy yang jujur dan spesifik mengikuti `antislop-copywriting`, atau beri `TODO(konten)`. Tidak boleh ada statistik, testimoni, logo klien, rating, atau klaim "trusted by" karangan.

**D4. Navigasi dan route.** Pertahankan persis tabel route dari Fase A. Navbar baru boleh berubah total secara visual (sticky, menu mobile, dll.), tetapi setiap link tetap memakai komponen router/anchor yang sama dengan perilaku yang sama (`target`, `rel`, state aktif). Bagian navbar yang bergantung pada status login harus tetap berfungsi.

**D5. Fungsionalitas.** Pindahkan form, handler, API call, analytics, dan SEO meta ke struktur baru tanpa mengubah perilakunya.

**D6. Aset dan dependency.** Taruh aset baru di folder aset proyek dan optimalkan. Font dari desain baru dipasang dengan pola yang sama seperti font proyek sekarang. Pakai library ikon yang sudah ada di proyek. Kalau desain baru memakai library lain, cari padanannya. Kalau proyek memakai Tailwind v3, terjemahkan sintaks v4 ke v3 (dan sebaliknya).

**D7. Responsif dan motion.** Hasil harus rapi di 360/390, 768, 1024, dan 1440 px. Animasi harus punya tujuan (menunjukkan urutan, perubahan state, atau perhatian), dan menghormati `prefers-reduced-motion`.

## 8. FASE E: Pass anti-slop

Terapkan semua aturan di skill sebagai acuan utama. Contoh pola slop yang harus dihindari (daftar otoritatifnya ada di skill):

- Logo sparkle atau ikon bintang-AI, pill "Next-Gen / AI 2.0 / Beta" di atas headline.
- Terminal atau dashboard palsu dengan metrik tanpa makna (misalnya "0.0001ms latency").
- Kartu statistik palsu ("10,000% ROI", "5.0 dari 500.000 founder"), testimoni dan logo klien karangan.
- Emoji sebagai bullet atau ikon, headline hype ("Revolutionize", "Supercharge", "Seamless", "Unlock the power of").
- Deretan tiga kartu fitur identik tanpa variasi, gradient text, glassmorphism sembarangan, glow, blob dekoratif, hover scale generik, semua elemen rounded sama besar.
- CTA penutup yang hanya mengulang hero, footer berisi link mati.

Lalu periksa per skill:
1. **antislop-ui**: layout, warna, komponen, dekorasi, motion.
2. **antislop-copywriting**: headline, CTA, tone, tidak ada angka palsu, tidak ada gaya tulis khas AI, markdown rapi.
3. **antislop-human**: kontras, navigasi keyboard, `:focus-visible` yang jelas (outline hitam/putih 2px dengan offset), state hover/active/disabled/focus di semua elemen interaktif, heading berurutan, alt text, label ARIA yang perlu.
4. **antislop-layoutmobile**: tidak ada horizontal overflow, tap target minimal 44px, grid reflow benar, gambar tidak pecah, navbar mobile berfungsi.
5. **antislop-code**: hapus komentar bergaya AI (banner kotak, emoji, komentar yang hanya mengulang kode). Simpan hanya komentar yang menjelaskan alasan.

**Liveliness.** Atur dial ENERGY, RHYTHM, MOTION dan tulis "Design Read" singkat. Dalam hitam-putih, kehidupan visual datang dari skala tipografi yang berani, ritme spasi yang bervariasi, inversi section, hairline border, dan motion yang bertujuan, bukan dari dekorasi.

**Pass `after`.** Setelah semua selesai, audit hasilmu sendiri dengan mata kritis: buat daftar temuan bernomor, perbaiki yang masuk scope, dan laporkan sisanya.

## 9. FASE F: Verifikasi (jalankan sungguhan)

1. Instal dependency bila perlu, lalu jalankan typecheck, lint, dan build. Bandingkan dengan baseline Fase A. Tidak boleh ada error baru.
2. **Diff route**: bandingkan snapshot `.redesign/route-snapshot.md` dengan kondisi sekarang. Tujuan semua link harus identik.
3. **Cek sisa warna.** Jalankan pencarian berikut di folder source dan pastikan semua hasil netral (hex dengan R=G=B, atau hitam/putih/abu) atau dijelaskan alasannya:
   ```
   grep -rniE "#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(|(bg|text|border|ring|from|via|to|fill|stroke|shadow|outline|decoration|accent|divide)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-" src
   ```
4. Jalankan dev server dan lihat halaman di 4 lebar layar (360, 768, 1024, 1440) jika ada kemampuan browser/screenshot. Kalau tidak bisa, katakan jujur.
5. Sebelum menghapus komponen/aset lama, grep dulu bahwa tidak ada lagi yang mengimpornya.
6. Hapus `.redesign/` setelah verifikasi, kecuali saya minta menyimpannya.
7. Jalankan **Delivery Gate** dari anti-slop dan sertakan laporannya apa adanya.

## 10. Kapan boleh bertanya

Hanya berhenti dan bertanya kalau:
- ada keputusan yang tidak bisa dibatalkan (menghapus halaman atau data, bukan sekadar komponen),
- satu CTA punya dua tujuan route yang bersaing dan tidak ada petunjuk di kode,
- desain baru mensyaratkan perubahan di DI_LUAR_SCOPE (backend, auth, route baru).

Selain itu, ambil keputusan paling masuk akal, lanjutkan, dan tulis asumsinya di laporan.

## 11. Format laporan akhir (ringkas, tanpa mengulang langkah kerja)

1. `antislop active: during`, plus cara skill dimuat (terpasang atau dibaca dari file).
2. Tabel mapping final: apa yang ADD, REMOVE, REPLACE, RESTYLE, beserta file.
3. Bukti route tidak berubah: tabel route lama vs baru.
4. Bukti tema: hasil grep warna, sisa warna non-netral (kalau ada) dan alasannya.
5. Laporan Delivery Gate (PASS/FAIL per blok, sesuai format skill).
6. Asumsi yang kamu ambil, daftar `TODO(konten)`, dan hal yang tidak bisa diverifikasi.
7. Cara saya mengecek manual (3 sampai 5 baris).

## 12. KODE DESAIN BARU (isi hanya jika tidak memakai folder `design-baru/`)

```
[tempel kode di sini]
```

=== AKHIR PROMPT ===

---

## Catatan untuk pemakaian ulang

| Halaman baru | Yang diganti di VARIABEL |
| --- | --- |
| Pricing | `HALAMAN_TARGET`, `SUMBER_DESAIN_BARU` |
| About / Contact | `HALAMAN_TARGET`, `SUMBER_DESAIN_BARU` |
| Tema lain (mis. krem + hitam) | `TEMA_TARGET`, lalu sesuaikan langkah D2 |
| Route yang dikunci berbeda | `ROUTE_TERKUNCI` |
