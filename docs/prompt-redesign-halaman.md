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
HALAMAN_TARGET      : new projects user di url /projects/new
TEMA_TARGET         : Hitam dan putih (monokrom). Tanpa warna aksen berwarna.
ROUTE_TERKUNCI      : semua tujuan link di sidebar dan footer, logout, termasuk yang menuju login dan register
BAHASA_KONTEN       : ikuti bahasa yang dipakai halaman saat ini
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
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react"

type IconName = "arrow" | "check" | "chevron" | "coffee" | "shop" | "camera" | "mail" | "briefcase" | "book" | "food" | "shirt" | "heart" | "palette" | "bag" | "more" | "phone" | "instagram" | "pin" | "link" | "clock" | "image" | "plus" | "x" | "info" | "alert" | "spinner"

const paths: Record<IconName, ReactNode> = {
  arrow: <path d="m15 18-6-6 6-6M9 12h12" />,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m7 10 5 5 5-5" />,
  coffee: (
    <>
      <path d="M4 8h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z" />
      <path d="M16 10h2a3 3 0 0 1 0 6h-2M7 4v2m4-2v2" />
    </>
  ),
  shop: (
    <>
      <path d="M4 10v10h16V10M3 4h18l-2 6H5L3 4Z" />
      <path d="M9 14h6v6" />
    </>
  ),
  camera: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="3" />
      <circle cx="12" cy="13" r="4" />
      <path d="m8 6 1-2h6l1 2" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V4h8v3m-4 4v4M3 12h18" />
    </>
  ),
  book: (
    <>
      <path d="M4 5a3 3 0 0 1 3-1h5v16H7a3 3 0 0 0-3 1V5Zm16 0a3 3 0 0 0-3-1h-5v16h5a3 3 0 0 1 3 1V5Z" />
    </>
  ),
  food: (
    <>
      <path d="M6 3v8m3-8v8M6 7h3m-1.5 4v10M16 3v18m0-18c4 3 4 8 0 10" />
    </>
  ),
  shirt: <path d="m8 4-5 3 3 5 2-1v10h8V11l2 1 3-5-5-3a4 4 0 0 1-8 0Z" />,
  heart: (
    <path d="M20.8 5.7a5.5 5.5 0 0 0-7.8 0L12 6.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z" />
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18h1.5a1.5 1.5 0 0 0 0-3H12a2 2 0 0 1 0-4h3a6 6 0 0 0 6-6c0-3-4-5-9-5Z" />
      <circle cx="7.5" cy="10" r=".7" />
      <circle cx="9" cy="6.5" r=".7" />
      <circle cx="14" cy="6.5" r=".7" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l1 13H4L5 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  phone: (
    <path d="M7 3h3l1.5 5-2 1.5a15 15 0 0 0 5 5l1.5-2 5 1.5v3c0 2-2 4-4 4A14 14 0 0 1 3 7c0-2 2-4 4-4Z" />
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".8" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8" cy="9" r="1.5" />
      <path d="m3 17 5-5 4 4 2-2 7 6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-10h.01" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6m0 4h.01" />
    </>
  ),
  spinner: <path d="M21 12a9 9 0 1 1-6-8.5" />,
}

function Icon({ name, size = 18 }: { name: IconName size?: number }) {
  return (
    <svg
      className={name === "spinner" ? "spin" : ""}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

const businessOptions = [
  ["Makanan & minuman", "Kedai kopi, restoran, katering, jajanan.", "food"],
  ["Pakaian & aksesori", "Konveksi, butik, sepatu, tas.", "shirt"],
  ["Jasa", "Servis, laundry, konsultasi, perbaikan.", "briefcase"],
  ["Pendidikan", "Kursus, les, bimbel, pelatihan.", "book"],
  ["Kesehatan", "Klinik, fisioterapi, apotek, gym.", "heart"],
  ["Kreatif & desain", "Fotografi, desain, event, kerajinan.", "palette"],
  ["Toko online", "Jualan produk secara online.", "bag"],
  ["Lainnya", "Belum yakin? Ini aman.", "more"],
] as const

const purposeOptions = [
  ["Menerima pesanan", "Pengunjung ingin membeli atau memesan."],
  ["Memperkenalkan usaha", "Ingin dikenal orang lebih banyak."],
  ["Mengumpulkan kontak", "Mau menyimpan nomor calon pelanggan."],
  ["Memamerkan karya", "Menampilkan hasil kerja atau portofolio."],
  ["Menerima reservasi", "Pengunjung ingin memblokir jadwal atau daftar."],
] as const

const templates = [
  [
    "Kedai kopi",
    "Menu, jam buka, lokasi, dan tombol pesan lewat WhatsApp.",
    "coffee",
  ],
  [
    "Toko online / UMKM",
    "Katalog produk, harga, dan cara order lewat WhatsApp.",
    "shop",
  ],
  [
    "Jasa foto",
    "Portofolio hasil kerja, paket harga, dan cara booking.",
    "camera",
  ],
  [
    "Undangan acara",
    "Detail acara, lokasi, jam, dan konfirmasi hadir lewat WhatsApp.",
    "mail",
  ],
  [
    "Portofolio",
    "Menampilkan karya dan cara menghubungi untuk pesanan baru.",
    "palette",
  ],
  [
    "Jasa / Les",
    "Program belajar, biaya, jadwal, dan pendaftaran lewat WhatsApp.",
    "book",
  ],
] as const

const sectionGroups = [
  {
    title: "Dasar",
    items: [
      ["Bagian pembuka", "Kalimat pertama yang dilihat pengunjung."],
      ["Tentang kami", "Cerita singkat usaha dan keunggulannya."],
      ["Kontak", "WhatsApp, telepon, email, dan lokasi."],
      ["Penutup", "Kontak, jam buka, dan media sosial."],
    ],
  },
  {
    title: "Isi utama",
    items: [
      ["Menu / Produk / Layanan", "Daftar yang dijual atau bisa dipesan."],
      ["Galeri foto", "Foto hasil kerja, produk, atau suasana."],
      ["Harga / Paket", "Daftar harga atau paket dan nominalnya."],
      ["Cara pesan / Cara kerja", "Alur dari awal sampai selesai."],
      ["Keunggulan", "Alasan pelanggan sebaiknya memilih usaha ini."],
    ],
  },
  {
    title: "Kepercayaan & info",
    items: [
      ["Ulasan pelanggan", "Pendapat dari pelanggan sebelumnya."],
      [
        "Pertanyaan yang sering ditanyakan",
        "Jawaban singkat untuk pertanyaan umum.",
      ],
      ["Jam buka & lokasi", "Jam operasional, hari buka, dan alamat."],
      ["Tombol ajakan", "Tombol pesan, reservasi, atau hubungi kami."],
    ],
  },
] as const

const allSections = sectionGroups.flatMap((group) =>
  group.items.map((item) => item[0]),
)
const suggested = new Set([
  "Bagian pembuka",
  "Tentang kami",
  "Kontak",
  "Penutup",
  "Menu / Produk / Layanan",
  "Galeri foto",
  "Cara pesan / Cara kerja",
  "Keunggulan",
  "Jam buka & lokasi",
  "Tombol ajakan",
])
const styles = [
  "Modern",
  "Minimalis",
  "Hangat",
  "Mewah",
  "Ceria",
  "Elegan",
  "Rustic",
  "Profesional",
]

function Badge({
  required = false,
  children,
}: {
  required?: boolean
  children?: ReactNode
}) {
  return (
    <span className="badge">
      {children ?? (required ? "Wajib" : "Opsional")}
    </span>
  )
}

function FieldLabel({
  children,
  hint,
  meta,
}: {
  children: ReactNode
  hint?: string
  meta?: ReactNode
}) {
  return (
    <div className="label-row">
      <label>
        {children}
        {hint && <small>{hint}</small>}
      </label>
      {meta}
    </div>
  )
}

function SelectCard({
  title,
  description,
  icon,
  selected,
  onSelect,
  name,
}: {
  title: string
  description: string
  icon?: IconName
  selected: boolean
  onSelect: () => void
  name: string
}) {
  return (
    <label className={`select-card ${selected ? "selected" : ""}`}>
      <input type="radio" name={name} checked={selected} onChange={onSelect} />
      {icon && <Icon name={icon} />}
      <span>
        <strong>{title}</strong>
        <small title={description}>{description}</small>
      </span>
      {selected && (
        <span className="selected-check">
          <Icon name="check" size={14} />
        </span>
      )}
    </label>
  )
}

function Accordion({
  number,
  title,
  summary,
  required,
  open,
  state = "empty",
  onToggle,
  children,
}: {
  number: number
  title: string
  summary: string
  required?: boolean
  open: boolean
  state?: "empty" | "progress" | "done" | "error"
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section
      className={`accordion ${open ? "open" : ""}`}
      id={`step-${number}`}
    >
      <button
        className="accordion-head"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className={`step-circle ${state}`}>
          {state === "done" ? (
            <Icon name="check" size={15} />
          ) : state === "error" ? (
            "!"
          ) : state === "progress" ? (
            <i />
          ) : (
            number
          )}
        </span>
        <span className="head-copy">
          <strong>{title}</strong>
          <small>{summary}</small>
        </span>
        <Badge required={required}>
          {number === 5 ? "Opsional · maks 4" : undefined}
        </Badge>
        <span className="chevron">
          <Icon name="chevron" />
        </span>
      </button>
      <div className="accordion-panel">
        {open && <div className="panel-inner">{children}</div>}
      </div>
    </section>
  )
}

function ToggleCard({
  title,
  description,
  on,
  disabled,
  recommended,
  onToggle,
}: {
  title: string
  description: string
  on: boolean
  disabled: boolean
  recommended: boolean
  onToggle: () => void
}) {
  const reason = disabled
    ? "Maksimal 12 bagian. Matikan satu bagian untuk memilih ini."
    : description
  return (
    <button
      className={`toggle-card ${on ? "on" : ""}`}
      role="switch"
      aria-checked={on}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onToggle}
      title={reason}
    >
      <span className="toggle-copy">
        <span>
          <strong>{title}</strong>
          {recommended && <em>Disarankan</em>}
        </span>
        <small>{description}</small>
      </span>
      <span className="switch">
        <i>{on && <Icon name="check" size={10} />}</i>
      </span>
    </button>
  )
}

function TextField({
  label,
  icon,
  prefix,
  placeholder,
  value,
  onChange,
  textarea = false,
  valid = false,
  error,
  onBlur,
}: {
  label: string
  icon?: IconName
  prefix?: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  textarea?: boolean
  valid?: boolean
  error?: string
  onBlur?: () => void
}) {
  const control = textarea ? (
    <textarea
      value={value}
      placeholder={placeholder}
      rows={3}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      aria-invalid={!!error}
    />
  ) : (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      aria-invalid={!!error}
    />
  )
  return (
    <div className={`field ${error ? "field-error" : ""}`}>
      <FieldLabel
        meta={
          valid ? (
            <span className="valid">
              <Icon name="check" size={15} />
            </span>
          ) : undefined
        }
      >
        {label}
      </FieldLabel>
      <div className="input-wrap">
        {icon && <Icon name={icon} />}
        {prefix && <span className="prefix">{prefix}</span>}
        {control}
      </div>
      {error && (
        <p className="error-message">
          <Icon name="alert" size={14} />
          {error}
        </p>
      )}
    </div>
  )
}

function Topography() {
  return (
    <svg
      className="topography"
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g>
        {Array.from({ length: 11 }, (_, i) => (
          <path
            key={`t${i}`}
            className={i % 5 === 0 ? "strong" : ""}
            d={`M${720 + i * 18} ${-35 + i * 17}C990 ${-10 + i * 22} 1050 ${125 + i * 17} 1190 ${95 + i * 19}S1370 ${15 + i * 20} 1510 ${85 + i * 17}`}
          />
        ))}
      </g>
      <g>
        {Array.from({ length: 11 }, (_, i) => (
          <path
            key={`b${i}`}
            className={i % 5 === 0 ? "strong" : ""}
            d={`M${-100 - i * 8} ${650 + i * 20}C80 ${580 + i * 22} 180 ${770 + i * 13} 340 ${700 + i * 18}S540 ${640 + i * 20} 680 ${750 + i * 16}`}
          />
        ))}
      </g>
    </svg>
  )
}

function Dialog({
  title,
  text,
  confirm,
  onCancel,
  onConfirm,
}: {
  title: string
  text: string
  confirm: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="dialog-backdrop" onMouseDown={onCancel}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2>{title}</h2>
        <p>{text}</p>
        <div>
          <button className="secondary" onClick={onCancel}>
            Tetap di sini
          </button>
          <button className="primary" onClick={onConfirm}>
            {confirm}
          </button>
        </div>
      </div>
    </div>
  )
}

interface SummaryProps {
  percent: number
  descriptionValid: boolean
  business: string
  purpose: string
  selectedStyles: string[]
  language: string
  sections: Set<string>
  contactsDone: boolean
  images: File[]
  onJump: (step: number) => void
  onSubmit: () => void
  loading: boolean
}

function Summary({
  percent,
  descriptionValid,
  business,
  purpose,
  selectedStyles,
  language,
  sections,
  contactsDone,
  images,
  onJump,
  onSubmit,
  loading,
}: SummaryProps) {
  const rows = [
    ["Tentang usahamu", true, descriptionValid],
    ["Tampilan", false, selectedStyles.length > 0],
    ["Isi halaman", false, sections.size > 0],
    ["Kontak & tombol", false, contactsDone],
    ["Gambar referensi", false, images.length > 0],
  ] as const
  return (
    <aside className="summary-card">
      <div className="summary-title">
        <h2>Brief kamu</h2>
        <strong>{percent}% lengkap</strong>
      </div>
      <div className="segments">
        {rows.map((row, index) => (
          <i
            key={row[0]}
            className={
              row[2]
                ? "filled"
                : index === 0 && descriptionValid
                  ? "filled"
                  : ""
            }
          />
        ))}
      </div>
      <p className="next-step">
        {descriptionValid
          ? "Kamu bisa melengkapi bagian opsional atau langsung membuat website."
          : "Langkah berikutnya: Tulis deskripsi singkat: apa usahamu dan siapa pelangganmu."}
      </p>
      <div className="checklist">
        {rows.map((row, index) => (
          <button key={row[0]} onClick={() => onJump(index + 1)}>
            <span className={row[2] ? "status done" : "status"}>
              {row[2] && <Icon name="check" size={12} />}
            </span>
            <span>{row[0]}</span>
            <Badge required={row[1]} />
            <Icon name="chevron" size={15} />
          </button>
        ))}
      </div>
      {(business ||
        purpose ||
        selectedStyles.length > 0 ||
        sections.size > 0 ||
        images.length > 0) && (
        <div className="live-summary">
          {business && (
            <div>
              <span>Jenis usaha</span>
              <strong>{business}</strong>
            </div>
          )}
          {purpose && (
            <div>
              <span>Tujuan</span>
              <strong>{purpose}</strong>
            </div>
          )}
          {selectedStyles.length > 0 && (
            <div>
              <span>Gaya</span>
              <span className="mini-chips">
                {selectedStyles.map((style) => (
                  <i key={style}>{style}</i>
                ))}
              </span>
            </div>
          )}
          <div>
            <span>Bahasa</span>
            <strong>{language}</strong>
          </div>
          {sections.size > 0 && (
            <div>
              <span>Bagian halaman</span>
              <strong>{sections.size}/12</strong>
            </div>
          )}
          {images.length > 0 && (
            <div>
              <span>Gambar</span>
              <strong>{images.length}/4</strong>
            </div>
          )}
        </div>
      )}
      <button
        className={`primary submit ${
          !descriptionValid ? "looks-disabled" : ""
        }`}
        onClick={onSubmit}
        aria-disabled={!descriptionValid || loading}
      >
        {loading ? (
          <>
            <Icon name="spinner" />
            Membuat website...
          </>
        ) : (
          "Simpan & Buatkan Website"
        )}
      </button>
      {!descriptionValid && (
        <p className="submit-hint">
          Isi deskripsi usaha dulu (minimal 10 karakter).
        </p>
      )}
      <p className="static-note">
        Website hasilnya berupa halaman statis: tombol WhatsApp, telepon, email,
        dan peta. Tidak ada formulir, login, atau pembayaran online.
      </p>
    </aside>
  )
}

export default function App() {
  const [openSteps, setOpenSteps] = useState(new Set([1]))
  const [businessName, setBusinessName] = useState("")
  const [business, setBusiness] = useState("")
  const [description, setDescription] = useState("")
  const [audience, setAudience] = useState("")
  const [purpose, setPurpose] = useState("")
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [language, setLanguage] = useState("Otomatis")
  const [pageSections, setPageSections] = useState<Set<string>>(new Set())
  const [customSections, setCustomSections] = useState<string[]>([])
  const [customDraft, setCustomDraft] = useState("")
  const [contacts, setContacts] = useState<Record<string, string>>({})
  const [images, setImages] = useState<File[]>([])
  const [template, setTemplate] = useState("")
  const [toast, setToast] = useState("")
  const [confirmTemplate, setConfirmTemplate] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [exitDialog, setExitDialog] = useState(false)
  const [advanced, setAdvanced] = useState(false)
  const [projectTitle, setProjectTitle] = useState("")
  const [extraNotes, setExtraNotes] = useState("")
  const [pageType, setPageType] = useState("")
  const [customOpen, setCustomOpen] = useState(false)
  const [descriptionTouched, setDescriptionTouched] = useState(false)
  const [submitTried, setSubmitTried] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null)

  const descriptionValid = description.trim().length >= 10
  const contactsDone = Object.values(contacts).some(Boolean)
  const dirty = !!(
    businessName ||
    business ||
    description ||
    audience ||
    purpose ||
    selectedStyles.length ||
    pageSections.size ||
    contactsDone ||
    images.length ||
    projectTitle ||
    extraNotes ||
    pageType
  )
  const optionalDone = [
    selectedStyles.length > 0,
    pageSections.size > 0,
    contactsDone,
    images.length > 0,
  ].filter(Boolean).length
  const percent = (descriptionValid ? 20 : 0) + optionalDone * 20

  const summaries = [
    [businessName, business, purpose].filter(Boolean).join(" · ") ||
      "Apa usahamu, siapa pelangganmu, dan tujuannya",
    selectedStyles.length
      ? `${selectedStyles.join(", ")} · Bahasa ${language.toLowerCase()}`
      : "Gaya, warna, dan bahasa",
    `${pageSections.size}/12 bagian menyala`,
    Object.values(contacts).some(Boolean)
      ? Object.keys(contacts)
          .filter((key) => contacts[key])
          .slice(0, 2)
          .join(", ")
      : "Semua opsional",
    images.length ? `${images.length} gambar` : "Opsional, maks 4",
  ]

  const toggleStep = (step: number) =>
    setOpenSteps((current) => {
      const next = new Set(current)
      next.has(step) ? next.delete(step) : next.add(step)
      return next
    })
  const jump = (step: number) => {
    setOpenSteps((current) => new Set(current).add(step))
    setSheetOpen(false)
    requestAnimationFrame(() =>
      document
        .getElementById(`step-${step}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    )
  }
  const nextStep = (step: number) => (
    <button className="secondary next-button" onClick={() => jump(step)}>
      Lanjut ke{" "}
      {
        [
          "",
          "",
          "Tampilan",
          "Isi halaman",
          "Kontak & tombol utama",
          "Gambar referensi",
        ][step]
      }
      <Icon name="arrow" />
    </button>
  )

  const applyTemplate = (name: string) => {
    const old = {
      businessName,
      business,
      description,
      audience,
      purpose,
      pageSections: new Set(pageSections),
    }
    if (name === "Kedai kopi") {
      setBusinessName("Kopi Senja")
      setBusiness("Makanan & minuman")
      setDescription(
        "Kedai kopi lokal yang menyajikan kopi pilihan dan tempat nyaman untuk bertemu.",
      )
      setAudience("Mahasiswa dan pekerja yang butuh tempat tenang")
      setPurpose("Menerima pesanan")
    } else {
      setBusiness(
        name.includes("Toko")
          ? "Toko online"
          : name.includes("Les")
            ? "Pendidikan"
            : "Kreatif & desain",
      )
      setPurpose(
        name.includes("Portofolio") || name.includes("foto")
          ? "Memamerkan karya"
          : "Memperkenalkan usaha",
      )
      setDescription(
        `${name} yang membantu pelanggan menemukan informasi, layanan, dan cara menghubungi usaha.`,
      )
    }
    setPageSections(new Set([...suggested]))
    setTemplate(name)
    setToast(`Template ${name} dipakai. Kamu masih bisa mengubah semuanya.`)
    ;(window as Window & { __undo?: () => void }).__undo = () => {
      setBusinessName(old.businessName)
      setBusiness(old.business)
      setDescription(old.description)
      setAudience(old.audience)
      setPurpose(old.purpose)
      setPageSections(old.pageSections)
      setTemplate("")
      setToast("")
    }
  }
  const chooseTemplate = (name: string) =>
    dirty ? setConfirmTemplate(name) : applyTemplate(name)

  const submit = () => {
    if (!descriptionValid) {
      setSubmitTried(true)
      setDescriptionTouched(true)
      jump(1)
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLTextAreaElement>(".description-area textarea")
          ?.focus(),
      )
      return
    }
    setLoading(true)
    window.setTimeout(() => setLoading(false), 2400)
  }

  const addImages = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return
    setImages((current) =>
      [...current, ...Array.from(event.target.files!)].slice(0, 4),
    )
  }

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const sectionState = (
    step: number,
  ): "empty" | "progress" | "done" | "error" => {
    if (step === 1 && (descriptionTouched || submitTried) && !descriptionValid)
      return "error"
    if (step === 1 && descriptionValid) return "done"
    if (
      [
        selectedStyles.length,
        pageSections.size,
        Object.values(contacts).filter(Boolean).length,
        images.length,
      ][step - 2] > 0
    )
      return "progress"
    return "empty"
  }

  const contactFields = useMemo(
    () =>
      [
        ["Nomor WhatsApp", "phone", "081234567890", "Hubungi"],
        ["Nomor telepon", "phone", "0271-123456", "Hubungi"],
        ["Email", "mail", "halo@contoh.id", "Hubungi"],
        ["Instagram", "instagram", "namatoko", "Online & lokasi"],
        ["Alamat", "pin", "Jl. Melati No. 4, Semarang", "Online & lokasi"],
        [
          "Tautan Google Maps",
          "link",
          "https://maps.google.com/?q=alamat",
          "Online & lokasi",
        ],
        ["Jam buka", "clock", "Setiap hari, 08.00–22.00", "Online & lokasi"],
      ] as const,
    [],
  )

  return (
    <div className={`new-project ${loading ? "read-only" : ""}`}>
      <Topography />
      <header className="topbar">
        <button
          className="back-button"
          onClick={() => (dirty ? setExitDialog(true) : history.back())}
        >
          <Icon name="arrow" />
          <span className="desktop-back">Kembali ke Project Saya</span>
          <span className="mobile-back">Kembali</span>
        </button>
      </header>
      <main className="layout">
        <div className="form-column">
          <header className="hero">
            <h1>Ceritakan usahamu, kami buatkan websitenya</h1>
            <p>
              Tidak perlu istilah teknis. Isi yang kamu tahu saja, kami atur
              bagian, warna, dan tombolnya.
            </p>
          </header>

          <section className="templates">
            <div className="section-heading">
              <div>
                <h2>Mulai cepat</h2>
                <p>Pilih yang paling mirip, lalu ubah seperlunya.</p>
              </div>
              <Badge>Opsional</Badge>
            </div>
            <div className="template-grid">
              {templates.map(([name, description, icon]) => (
                <button
                  key={name}
                  className={`template-card ${
                    template === name ? "selected" : ""
                  }`}
                  onClick={() => chooseTemplate(name)}
                >
                  <Icon name={icon} />
                  <span>
                    <strong>{name}</strong>
                    <small title={description}>{description}</small>
                  </span>
                  {template === name && (
                    <span className="template-check">
                      <Icon name="check" size={13} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <div className="accordions">
            <Accordion
              number={1}
              title="Tentang usahamu"
              summary={summaries[0]}
              required
              open={openSteps.has(1)}
              state={sectionState(1)}
              onToggle={() => toggleStep(1)}
            >
              <div className="field">
                <FieldLabel meta={<Badge>Opsional</Badge>}>
                  Nama usaha atau brand
                </FieldLabel>
                <div className="input-wrap">
                  <input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="cth. Kopi Senja"
                  />
                </div>
              </div>
              <div className="field">
                <FieldLabel meta={<Badge>Opsional</Badge>}>
                  Jenis usaha
                </FieldLabel>
                <div className="select-grid business-grid">
                  {businessOptions.map(([title, desc, icon]) => (
                    <SelectCard
                      key={title}
                      title={title}
                      description={desc}
                      icon={icon}
                      selected={business === title}
                      onSelect={() => setBusiness(title)}
                      name="business"
                    />
                  ))}
                </div>
              </div>
              <div className="field description-area">
                <FieldLabel
                  hint="Apa usahamu? Ceritakan singkat."
                  meta={
                    <span
                      className={`counter ${
                        descriptionValid ? "valid-counter" : ""
                      }`}
                    >
                      {descriptionValid && <Icon name="check" size={14} />}
                      {description.length}/3600
                    </span>
                  }
                >
                  Deskripsi Website <Badge required />
                </FieldLabel>
                <div className="input-wrap">
                  <textarea
                    ref={descriptionRef}
                    rows={6}
                    maxLength={3600}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => setDescriptionTouched(true)}
                    placeholder="cth. Kedai kopi lokal dengan tempat nyaman untuk bekerja dan bertemu."
                    aria-describedby="description-error"
                    aria-invalid={
                      (descriptionTouched || submitTried) && !descriptionValid
                    }
                  />
                </div>
                <div className="starter-chips">
                  {["Usahaku …", "Pelangganku …", "Mereka bisa …"].map(
                    (text) => (
                      <button
                        key={text}
                        onClick={() => {
                          setDescription(
                            (value) =>
                              `${value}${
                                value ? " " : ""
                              }${text.replace("…", "")}`,
                          )
                          descriptionRef.current?.focus()
                        }}
                      >
                        {text}
                      </button>
                    ),
                  )}
                </div>
                {(descriptionTouched || submitTried) && !descriptionValid && (
                  <p id="description-error" className="error-message">
                    <Icon name="alert" size={14} />
                    Ceritakan usahamu minimal 10 karakter.
                  </p>
                )}
              </div>
              <div className="field">
                <FieldLabel
                  hint="Siapa pelangganmu?"
                  meta={<Badge>Opsional</Badge>}
                >
                  Siapa yang akan datang?
                </FieldLabel>
                <div className="input-wrap">
                  <input
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="cth. Mahasiswa dan pekerja yang butuh tempat tenang"
                  />
                </div>
              </div>
              <div className="field">
                <FieldLabel
                  hint="Apa yang ingin mereka lakukan?"
                  meta={<Badge>Opsional</Badge>}
                >
                  Tujuan utama website
                </FieldLabel>
                <div className="select-grid purpose-grid">
                  {purposeOptions.map(([title, desc]) => (
                    <SelectCard
                      key={title}
                      title={title}
                      description={desc}
                      selected={purpose === title}
                      onSelect={() => setPurpose(title)}
                      name="purpose"
                    />
                  ))}
                </div>
              </div>
              <div className="custom-collapse">
                <button
                  onClick={() => setAdvanced(!advanced)}
                  aria-expanded={advanced}
                >
                  <span>Opsi lanjutan</span>
                  <Badge>Opsional</Badge>
                  <Icon name="chevron" />
                </button>
                {advanced && (
                  <div className="advanced-fields">
                    <TextField
                      label="Judul project"
                      placeholder="cth. Website Kopi Senja"
                      value={projectTitle}
                      onChange={setProjectTitle}
                    />
                    <TextField
                      label="Catatan tambahan"
                      placeholder="Hal lain yang perlu kami tahu"
                      value={extraNotes}
                      onChange={setExtraNotes}
                      textarea
                    />
                    <TextField
                      label="Jenis halaman"
                      placeholder="cth. Halaman utama"
                      value={pageType}
                      onChange={setPageType}
                    />
                  </div>
                )}
              </div>
              {nextStep(2)}
            </Accordion>

            <Accordion
              number={2}
              title="Tampilan"
              summary={summaries[1]}
              open={openSteps.has(2)}
              state={sectionState(2)}
              onToggle={() => toggleStep(2)}
            >
              <div className="field">
                <FieldLabel
                  meta={
                    <span className="counter">
                      {selectedStyles.length}/3 dipilih
                    </span>
                  }
                >
                  Gaya tampilan <Badge>Opsional</Badge>
                </FieldLabel>
                <div className="chips">
                  {styles.map((style) => {
                    const selected = selectedStyles.includes(style)
                    const disabled = selectedStyles.length === 3 && !selected
                    return (
                      <button
                        key={style}
                        disabled={disabled}
                        className={selected ? "selected" : ""}
                        onClick={() =>
                          setSelectedStyles((current) =>
                            selected
                              ? current.filter((item) => item !== style)
                              : [...current, style],
                          )
                        }
                      >
                        {selected && <Icon name="check" size={14} />}
                        {style}
                      </button>
                    )
                  })}
                </div>
                <p className="help">
                  Pilih maksimal 3. Setelah penuh, gaya lain dinonaktifkan.
                </p>
              </div>
              <div className="field">
                <FieldLabel meta={<Badge>Opsional</Badge>}>
                  Bahasa tulisan website
                </FieldLabel>
                <div className="segmented">
                  {["Otomatis", "Indonesia", "Inggris"].map((item) => (
                    <button
                      key={item}
                      className={language === item ? "selected" : ""}
                      onClick={() => setLanguage(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              {nextStep(3)}
            </Accordion>

            <Accordion
              number={3}
              title="Isi halaman"
              summary={summaries[2]}
              open={openSteps.has(3)}
              state={sectionState(3)}
              onToggle={() => toggleStep(3)}
            >
              <div className="section-counter">
                <span className={pageSections.size === 12 ? "limit" : ""}>
                  {pageSections.size}/12 menyala
                </span>
                {pageSections.size === 12 && (
                  <small>
                    Maksimal 12 bagian. Matikan satu bagian untuk menyalakan
                    yang lain.
                  </small>
                )}
              </div>
              {sectionGroups.map((group) => (
                <div className="toggle-group" key={group.title}>
                  <h3>{group.title}</h3>
                  <div className="toggle-grid">
                    {group.items.map(([title, desc]) => (
                      <ToggleCard
                        key={title}
                        title={title}
                        description={desc}
                        recommended={suggested.has(title)}
                        on={pageSections.has(title)}
                        disabled={
                          pageSections.size >= 12 && !pageSections.has(title)
                        }
                        onToggle={() =>
                          setPageSections((current) => {
                            const next = new Set(current)
                            next.has(title)
                              ? next.delete(title)
                              : next.add(title)
                            return next
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
              <div className="reset-actions">
                <button
                  className="secondary"
                  disabled={pageSections.size === 0}
                  onClick={() => {
                    setPageSections(new Set([...suggested].slice(0, 12)))
                    setToast(
                      `${Math.min(suggested.size, 12)} bagian disarankan dinyalakan.`,
                    )
                  }}
                >
                  Atur ulang ke saran
                </button>
                <button className="ghost" onClick={() => setConfirmReset(true)}>
                  Mulai dari awal
                </button>
              </div>
              <div className="custom-collapse">
                <button
                  onClick={() => setCustomOpen(!customOpen)}
                  aria-expanded={customOpen}
                >
                  <span>Lanjutan: tambah bagian sendiri</span>
                  <Badge>Opsional</Badge>
                  <Icon name="chevron" />
                </button>
                {customOpen && (
                  <div className="custom-section">
                    <FieldLabel>Tambah bagian lain</FieldLabel>
                    <div>
                      <input
                        value={customDraft}
                        onChange={(e) => setCustomDraft(e.target.value)}
                        placeholder="cth. promo Ramadan"
                      />
                      <button
                        className="secondary"
                        onClick={() => {
                          if (customDraft.trim()) {
                            setCustomSections([
                              ...customSections,
                              customDraft.trim(),
                            ])
                            setCustomDraft("")
                          }
                        }}
                      >
                        Tambah
                      </button>
                    </div>
                    <div className="custom-chips">
                      {customSections.map((item) => (
                        <span key={item}>
                          {item}
                          <i>Tambahan</i>
                          <button
                            aria-label={`Hapus ${item}`}
                            onClick={() =>
                              setCustomSections(
                                customSections.filter(
                                  (entry) => entry !== item,
                                ),
                              )
                            }
                          >
                            <Icon name="x" size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {nextStep(4)}
            </Accordion>

            <Accordion
              number={4}
              title="Kontak & tombol utama"
              summary={summaries[3]}
              open={openSteps.has(4)}
              state={sectionState(4)}
              onToggle={() => toggleStep(4)}
            >
              <p className="section-intro">
                Dipakai untuk tombol WhatsApp, telepon, email, dan tautan
                lokasi. Semua opsional.
              </p>
              {["Hubungi", "Online & lokasi"].map((group) => (
                <div className="contact-group" key={group}>
                  <h3>{group}</h3>
                  <div className="contact-grid">
                    {contactFields
                      .filter((field) => field[3] === group)
                      .map(([label, icon, placeholder]) => (
                        <TextField
                          key={label}
                          label={label}
                          icon={icon}
                          prefix={label === "Instagram" ? "@" : undefined}
                          placeholder={placeholder}
                          value={contacts[label] || ""}
                          onChange={(value) =>
                            setContacts({ ...contacts, [label]: value })
                          }
                          textarea={label === "Alamat"}
                          valid={!!contacts[label]}
                        />
                      ))}
                  </div>
                </div>
              ))}
              {nextStep(5)}
            </Accordion>

            <Accordion
              number={5}
              title="Gambar referensi"
              summary={summaries[4]}
              open={openSteps.has(5)}
              state={sectionState(5)}
              onToggle={() => toggleStep(5)}
            >
              <label className="dropzone">
                <Icon name="image" size={25} />
                <strong>Tarik gambar ke sini atau pilih dari perangkat</strong>
                <span className="secondary">Pilih gambar</span>
                <small>JPEG, PNG, atau WebP. Maks 10 MB per gambar.</small>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={addImages}
                />
              </label>
              <div className="image-slots">
                {Array.from({ length: 4 }, (_, index) => {
                  const file = images[index]
                  return file ? (
                    <div
                      className="image-slot filled"
                      key={`${file.name}-${index}`}
                    >
                      <img src={URL.createObjectURL(file)} alt="" />
                      <button
                        aria-label={`Hapus ${file.name}`}
                        onClick={() =>
                          setImages(
                            images.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        <Icon name="x" size={14} />
                      </button>
                      <span>
                        <strong>{file.name}</strong>
                        <small>{(file.size / 1024 / 1024).toFixed(1)} MB</small>
                      </span>
                    </div>
                  ) : (
                    <label className="image-slot empty" key={index}>
                      <Icon name="plus" />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={addImages}
                      />
                    </label>
                  )
                })}
              </div>
              <div className="info-note">
                <Icon name="info" />
                <p>
                  <strong>Perlu diketahui:</strong> gambar ini hanya dipakai AI
                  sebagai panduan gaya (warna, tata letak, suasana). Gambar
                  tidak ikut muncul di website hasil, dan tidak menjadi logo.
                </p>
              </div>
            </Accordion>
          </div>
        </div>
        <div className="summary-column">
          <Summary
            percent={percent}
            descriptionValid={descriptionValid}
            business={business}
            purpose={purpose}
            selectedStyles={selectedStyles}
            language={language}
            sections={pageSections}
            contactsDone={contactsDone}
            images={images}
            onJump={jump}
            onSubmit={submit}
            loading={loading}
          />
        </div>
      </main>

      <div className="mobile-summary">
        <button className="mobile-progress" onClick={() => setSheetOpen(true)}>
          <strong>Brief {percent}% lengkap</strong>
          <span>
            <i style={{ width: `${percent}%` }} />
          </span>
        </button>
        <button
          className={`primary ${!descriptionValid ? "looks-disabled" : ""}`}
          onClick={submit}
        >
          Simpan &amp; Buatkan Website
        </button>
      </div>
      {sheetOpen && (
        <div className="sheet-backdrop" onMouseDown={() => setSheetOpen(false)}>
          <div
            className="bottom-sheet"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button className="sheet-close" onClick={() => setSheetOpen(false)}>
              <Icon name="x" />
            </button>
            <Summary
              percent={percent}
              descriptionValid={descriptionValid}
              business={business}
              purpose={purpose}
              selectedStyles={selectedStyles}
              language={language}
              sections={pageSections}
              contactsDone={contactsDone}
              images={images}
              onJump={jump}
              onSubmit={submit}
              loading={loading}
            />
          </div>
        </div>
      )}
      {toast && (
        <div className="toast">
          <Icon name="check" />
          <span>{toast}</span>
          {template && (
            <button
              onClick={() =>
                (window as Window & { __undo?: () => void }).__undo?.()
              }
            >
              Batalkan
            </button>
          )}
          <button className="toast-close" onClick={() => setToast("")}>
            <Icon name="x" size={14} />
          </button>
        </div>
      )}
      {confirmTemplate && (
        <div className="popover-overlay">
          <div className="confirm-popover">
            <p>Isian yang sudah kamu tulis akan diganti. Lanjutkan?</p>
            <div>
              <button
                className="ghost"
                onClick={() => setConfirmTemplate(null)}
              >
                Batal
              </button>
              <button
                className="primary"
                onClick={() => {
                  applyTemplate(confirmTemplate)
                  setConfirmTemplate(null)
                }}
              >
                Ganti
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmReset && (
        <div className="popover-overlay">
          <div className="confirm-popover">
            <p>Matikan semua bagian?</p>
            <div>
              <button className="ghost" onClick={() => setConfirmReset(false)}>
                Batal
              </button>
              <button
                className="primary"
                onClick={() => {
                  setPageSections(new Set())
                  setConfirmReset(false)
                }}
              >
                Matikan
              </button>
            </div>
          </div>
        </div>
      )}
      {exitDialog && (
        <Dialog
          title="Keluar tanpa menyimpan?"
          text="Isianmu belum disimpan."
          confirm="Keluar"
          onCancel={() => setExitDialog(false)}
          onConfirm={() => history.back()}
        />
      )}
    </div>
  )
}
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
@import "tailwindcss";

:root {
  --page: #07070a;
  --card: #101016;
  --raised: #16161d;
  --input: #0c0c11;
  --text: #fff;
  --secondary: #a1a1aa;
  --muted: #71717a;
  --placeholder: #52525b;
  --border: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(255, 255, 255, 0.18);
  --focus: rgba(255, 255, 255, 0.55);
  --green: #4ade80;
  --red: #f87171;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; background: var(--page); }
body { margin: 0; background: var(--page); color: var(--text); font-family: "Inter", sans-serif; font-size: 14px; -webkit-font-smoothing: antialiased; }
button, input, textarea { color: inherit; font: inherit; }
button { cursor: pointer; }
button:focus-visible, input:focus-visible, textarea:focus-visible, label:has(input:focus-visible) { outline: 2px solid white; outline-offset: 2px; }
button:disabled { cursor: not-allowed; }
input::placeholder, textarea::placeholder { color: var(--placeholder); opacity: 1; }
.new-project { min-height: 100vh; background: var(--page); }
.topography { position: fixed; z-index: 0; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.topography path { fill: none; stroke: white; stroke-width: 1; opacity: .04; }
.topography path.strong { opacity: .08; }
.topbar { position: sticky; z-index: 40; top: 0; height: 64px; border-bottom: 1px solid var(--border); background: rgba(7,7,10,.88); backdrop-filter: blur(14px); }
.topbar > button { margin-left: max(24px, calc((100vw - 1120px) / 2)); }
.back-button { height: 64px; padding: 0; display: flex; align-items: center; gap: 8px; border: 0; background: transparent; color: var(--secondary); font-size: 13px; }
.back-button:hover { color: white; }
.mobile-back { display: none; }
.layout { position: relative; z-index: 1; width: min(1120px, calc(100% - 48px)); margin: 0 auto; padding: 48px 0 96px; display: grid; grid-template-columns: minmax(0, 720px) 340px; gap: 40px; align-items: start; }
.hero { margin-bottom: 40px; }
.hero h1 { max-width: 660px; margin: 0 0 12px; font-size: 36px; line-height: 1.12; letter-spacing: -.03em; }
.hero p { max-width: 620px; margin: 0; color: var(--secondary); font-size: 15px; line-height: 1.6; }
h2, h3, p { margin-top: 0; }
.section-heading { margin-bottom: 16px; display: flex; align-items: flex-start; justify-content: space-between; }
.section-heading h2 { margin: 0 0 5px; font-size: 18px; }
.section-heading p { margin: 0; color: var(--secondary); font-size: 13px; }
.badge { min-height: 22px; padding: 3px 8px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--border-hover); border-radius: 999px; color: var(--secondary); font-size: 10px; font-weight: 600; white-space: nowrap; }
.template-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.template-card { position: relative; height: 72px; padding: 12px; display: flex; align-items: center; gap: 10px; min-width: 0; border: 1px solid var(--border); border-radius: 12px; background: rgba(16,16,22,.92); text-align: left; transition: background .16s, border-color .16s; }
.template-card:hover { background: var(--raised); border-color: var(--border-hover); }
.template-card.selected { border-color: white; }
.template-card > svg { flex: none; color: var(--secondary); }
.template-card > span { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.template-card strong { font-size: 13px; }
.template-card small { overflow: hidden; color: var(--muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.template-check { position: absolute; top: 6px; right: 6px; width: 18px; height: 18px; display: grid!important; place-items: center; border-radius: 50%; background: white; color: black; }
.accordions { margin-top: 32px; display: flex; flex-direction: column; gap: 12px; }
.accordion { scroll-margin-top: 80px; overflow: clip; border: 1px solid var(--border); border-radius: 20px; background: rgba(16,16,22,.92); backdrop-filter: blur(12px); }
.accordion-head { position: relative; z-index: 2; width: 100%; min-height: 72px; padding: 14px 16px; display: grid; grid-template-columns: 28px 1fr auto 22px; gap: 12px; align-items: center; border: 0; background: var(--card); text-align: left; }
.accordion.open .accordion-head { position: sticky; top: 64px; border-bottom: 1px solid var(--border); }
.step-circle { width: 28px; height: 28px; display: grid; place-items: center; border: 1px solid var(--border-hover); border-radius: 50%; color: var(--secondary); font-size: 12px; font-weight: 600; }
.step-circle.progress { border-color: white; }
.step-circle.progress i { width: 6px; height: 6px; border-radius: 50%; background: white; }
.step-circle.done { border-color: var(--green); color: var(--green); }
.step-circle.error { border-color: var(--red); color: var(--red); }
.head-copy { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.head-copy strong { font-size: 15px; }
.head-copy small { overflow: hidden; color: var(--muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.chevron { color: var(--muted); transition: transform .2s; }
.accordion.open .chevron { transform: rotate(180deg); }
.panel-inner { padding: 28px 24px 24px; }
.field { margin-bottom: 28px; }
.label-row { min-height: 24px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.label-row label { display: flex; align-items: baseline; gap: 8px; font-size: 14px; font-weight: 600; }
.label-row label small { color: var(--muted); font-size: 12px; font-weight: 400; }
.input-wrap { position: relative; display: flex; align-items: flex-start; border: 1px solid var(--border-hover); border-radius: 12px; background: var(--input); }
.input-wrap:focus-within { border-color: var(--focus); }
.input-wrap > svg { margin: 15px 0 0 14px; flex: none; color: var(--muted); }
.input-wrap input, .input-wrap textarea { width: 100%; min-width: 0; min-height: 48px; padding: 13px 14px; border: 0; outline: 0; background: transparent; resize: vertical; }
.input-wrap textarea { line-height: 1.55; }
.input-wrap > svg + input, .input-wrap > svg + textarea { padding-left: 10px; }
.prefix { padding: 14px 0 0 4px; color: var(--secondary); }
.description-area textarea { min-height: 160px; resize: none; }
.counter { display: flex; align-items: center; gap: 5px; color: var(--muted); font-size: 12px; font-weight: 500; }
.valid-counter, .valid { color: var(--green); }
.error-message { margin: 8px 0 0; display: flex; align-items: center; gap: 6px; color: var(--red); font-size: 12px; }
.starter-chips, .chips { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px; }
.starter-chips button, .chips button { min-height: 40px; padding: 0 14px; border: 1px solid var(--border); border-radius: 999px; background: transparent; color: var(--secondary); }
.starter-chips button:hover, .chips button:hover { border-color: var(--border-hover); color: white; }
.chips button { display: flex; align-items: center; gap: 6px; color: white; }
.chips button.selected { border-color: white; background: white; color: black; }
.chips button:disabled { opacity: .4; }
.help { margin: 10px 0 0; color: var(--muted); font-size: 12px; }
.select-grid { display: grid; gap: 8px; }
.business-grid { grid-template-columns: repeat(4, 1fr); }
.purpose-grid { grid-template-columns: repeat(3, 1fr); }
.select-card { position: relative; height: 72px; padding: 11px; display: flex; align-items: center; gap: 8px; overflow: hidden; border: 1px solid var(--border); border-radius: 12px; background: var(--input); cursor: pointer; }
.select-card:hover { border-color: var(--border-hover); background: var(--raised); }
.select-card input { position: absolute; opacity: 0; pointer-events: none; }
.select-card > svg { flex: none; color: var(--muted); }
.select-card > span:not(.selected-check) { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.select-card strong { overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.select-card small { overflow: hidden; color: var(--muted); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.select-card.selected { border-color: white; background: white; color: black; }
.select-card.selected small, .select-card.selected > svg { color: #52525b; }
.selected-check { position: absolute; top: 5px; right: 5px; color: black; }
.segmented { padding: 3px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; border: 1px solid var(--border); border-radius: 12px; background: var(--input); }
.segmented button { height: 40px; border: 0; border-radius: 9px; background: transparent; color: var(--secondary); }
.segmented button.selected { background: white; color: black; font-weight: 600; }
.custom-collapse { margin-top: 8px; border: 1px solid var(--border); border-radius: 12px; background: var(--input); }
.custom-collapse > button { width: 100%; min-height: 52px; padding: 0 14px; display: flex; align-items: center; gap: 10px; border: 0; background: transparent; text-align: left; font-weight: 600; }
.custom-collapse > button .badge { margin-left: auto; }
.custom-collapse > button[aria-expanded=true] > svg { transform: rotate(180deg); }
.advanced-fields, .custom-section { padding: 16px; border-top: 1px solid var(--border); }
.next-button { margin-top: 24px; margin-left: auto; display: flex!important; align-items: center; gap: 8px; }
.next-button svg { transform: rotate(180deg); }
.secondary, .primary, .ghost { min-height: 44px; padding: 0 16px; border-radius: 12px; font-weight: 600; }
.secondary { display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--border-hover); background: transparent; }
.secondary:hover { background: var(--raised); }
.secondary:disabled { opacity: .4; }
.primary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid white; background: white; color: black; }
.primary:hover { background: #e4e4e7; }
.ghost { border: 0; background: transparent; color: var(--secondary); }
.ghost:hover { color: white; }
.section-counter { min-height: 45px; margin-bottom: 16px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; color: var(--muted); font-size: 12px; }
.section-counter .limit { color: white; }
.toggle-group { margin-bottom: 22px; }
.toggle-group h3, .contact-group h3 { margin: 0 0 10px; color: var(--secondary); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
.toggle-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.toggle-card { height: 64px; padding: 10px 12px; display: flex; align-items: center; gap: 10px; border: 1px solid var(--border); border-radius: 12px; background: var(--input); text-align: left; }
.toggle-card:hover { border-color: var(--border-hover); }
.toggle-card:disabled { opacity: .4; }
.toggle-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 4px; }
.toggle-copy > span { display: flex; align-items: center; gap: 6px; }
.toggle-copy strong, .toggle-copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.toggle-copy strong { font-size: 12px; }
.toggle-copy small { color: var(--muted); font-size: 10px; }
.toggle-copy em { padding: 2px 5px; border: 1px solid var(--border-hover); border-radius: 99px; color: var(--muted); font-size: 8px; font-style: normal; }
.switch { width: 38px; height: 22px; padding: 2px; flex: none; border: 1px solid var(--border-hover); border-radius: 999px; background: #26262e; }
.switch i { width: 16px; height: 16px; display: grid; place-items: center; border-radius: 50%; background: var(--muted); transition: transform .16s; }
.toggle-card.on .switch { border-color: white; background: white; }
.toggle-card.on .switch i { background: black; color: white; transform: translateX(16px); }
.reset-actions { display: flex; align-items: center; gap: 10px; margin: 8px 0 22px; }
.custom-section > div:not(.label-row):first-of-type { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
.custom-section input { min-height: 44px; padding: 0 12px; border: 1px solid var(--border-hover); border-radius: 10px; background: var(--input); outline: 0; }
.custom-chips { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px; }
.custom-chips > span { min-height: 34px; padding: 0 5px 0 10px; display: flex; align-items: center; gap: 7px; border: 1px solid var(--border); border-radius: 999px; }
.custom-chips i { color: var(--muted); font-size: 9px; font-style: normal; }
.custom-chips button { width: 28px; height: 28px; display: grid; place-items: center; border: 0; border-radius: 50%; background: transparent; }
.section-intro { margin-bottom: 24px; color: var(--secondary); line-height: 1.5; }
.contact-group { margin-bottom: 24px; }
.contact-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0 14px; }
.contact-grid .field { margin-bottom: 16px; }
.dropzone { min-height: 176px; padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; border: 1px dashed var(--border-hover); border-radius: 16px; background: var(--input); text-align: center; cursor: pointer; }
.dropzone > svg { color: var(--secondary); }
.dropzone strong { font-size: 13px; }
.dropzone small { color: var(--muted); font-size: 11px; }
.dropzone input, .image-slot input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.image-slots { margin-top: 14px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.image-slot { position: relative; aspect-ratio: 1; overflow: hidden; border: 1px dashed var(--border-hover); border-radius: 12px; background: var(--input); }
.image-slot.empty { display: grid; place-items: center; color: var(--muted); cursor: pointer; }
.image-slot img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1); }
.image-slot.filled > button { position: absolute; top: 6px; right: 6px; width: 28px; height: 28px; display: grid; place-items: center; border: 1px solid var(--border-hover); border-radius: 50%; background: rgba(7,7,10,.84); }
.image-slot.filled > span { position: absolute; inset: auto 0 0; padding: 8px; display: flex; flex-direction: column; background: rgba(0,0,0,.86); }
.image-slot.filled strong { overflow: hidden; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.image-slot.filled small { color: var(--secondary); font-size: 8px; }
.info-note { margin-top: 16px; padding: 12px; display: flex; gap: 10px; border: 1px solid var(--border); border-radius: 12px; background: var(--input); color: var(--secondary); }
.info-note svg { flex: none; }
.info-note p { margin: 0; font-size: 11px; line-height: 1.5; }
.info-note strong { color: white; }
.summary-column { position: sticky; top: 88px; }
.summary-card { padding: 24px; border: 1px solid var(--border); border-radius: 20px; background: rgba(16,16,22,.94); backdrop-filter: blur(12px); }
.summary-title { display: flex; align-items: center; justify-content: space-between; }
.summary-title h2 { margin: 0; font-size: 18px; }
.summary-title strong { font-size: 12px; }
.segments { margin: 14px 0; display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
.segments i { height: 3px; border-radius: 99px; background: #303038; }
.segments i.filled { background: white; }
.next-step { margin: 0; color: var(--secondary); font-size: 12px; line-height: 1.5; }
.checklist { margin: 18px -8px; padding: 12px 0; border-block: 1px solid var(--border); }
.checklist button { width: 100%; min-height: 40px; padding: 0 8px; display: grid; grid-template-columns: 18px 1fr auto 16px; align-items: center; gap: 8px; border: 0; border-radius: 8px; background: transparent; color: var(--secondary); text-align: left; font-size: 12px; }
.checklist button:hover { background: var(--raised); color: white; }
.status { width: 16px; height: 16px; display: grid; place-items: center; border: 1px solid var(--border-hover); border-radius: 50%; }
.status.done { border-color: var(--green); color: var(--green); }
.live-summary { margin-bottom: 18px; display: flex; flex-direction: column; gap: 10px; }
.live-summary > div { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; font-size: 11px; }
.live-summary > div > span:first-child { color: var(--muted); }
.live-summary strong { text-align: right; font-weight: 500; }
.mini-chips { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px; }
.mini-chips i { padding: 3px 6px; border: 1px solid var(--border); border-radius: 99px; font-style: normal; }
.submit { width: 100%; min-height: 48px; }
.looks-disabled { opacity: .48; }
.submit-hint { margin: 8px 0 0; color: var(--secondary); font-size: 11px; text-align: center; }
.static-note { margin: 16px 0 0; color: var(--muted); font-size: 11px; line-height: 1.5; }
.mobile-summary, .sheet-backdrop { display: none; }
.toast { position: fixed; z-index: 80; left: 50%; bottom: 24px; min-height: 48px; max-width: calc(100% - 32px); padding: 10px 10px 10px 14px; display: flex; align-items: center; gap: 9px; border: 1px solid var(--border-hover); border-radius: 12px; background: #222229; box-shadow: 0 14px 50px rgba(0,0,0,.5); transform: translateX(-50%); font-size: 12px; }
.toast > svg { color: var(--green); }
.toast button { min-height: 32px; border: 0; background: transparent; color: white; font-weight: 600; }
.toast-close { width: 32px; display: grid; place-items: center; color: var(--muted)!important; }
.popover-overlay, .dialog-backdrop { position: fixed; z-index: 100; inset: 0; display: grid; place-items: center; padding: 16px; background: rgba(0,0,0,.7); backdrop-filter: blur(4px); }
.confirm-popover, .dialog { width: min(390px, 100%); padding: 22px; border: 1px solid var(--border-hover); border-radius: 16px; background: var(--card); box-shadow: 0 24px 80px rgba(0,0,0,.65); }
.confirm-popover p { line-height: 1.5; }
.confirm-popover > div, .dialog > div { display: flex; justify-content: flex-end; gap: 8px; }
.dialog h2 { margin-bottom: 8px; font-size: 20px; }
.dialog p { color: var(--secondary); }
.spin { animation: spin .8s linear infinite; }
.read-only main { pointer-events: none; opacity: .72; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1100px) {
  .layout { width: min(960px, calc(100% - 32px)); grid-template-columns: minmax(0, 1fr) 300px; gap: 24px; }
  .business-grid { grid-template-columns: repeat(2, 1fr); }
  .template-grid { grid-template-columns: repeat(2, 1fr); }
  .purpose-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 780px) {
  .layout { width: min(720px, calc(100% - 32px)); padding-top: 32px; display: block; }
  .summary-column { display: none; }
  .hero h1 { font-size: 32px; }
  .mobile-summary { position: fixed; z-index: 60; inset: auto 0 0; height: 72px; padding: 10px 16px; display: grid; grid-template-columns: minmax(110px, 1fr) minmax(190px, auto); gap: 12px; align-items: center; border-top: 1px solid var(--border-hover); background: rgba(16,16,22,.96); backdrop-filter: blur(14px); }
  .mobile-summary .primary { min-height: 48px; padding-inline: 14px; font-size: 12px; }
  .mobile-progress { height: 48px; padding: 5px 0; display: flex; flex-direction: column; justify-content: center; gap: 7px; border: 0; background: transparent; text-align: left; }
  .mobile-progress strong { font-size: 12px; }
  .mobile-progress > span { width: 100%; height: 3px; overflow: hidden; border-radius: 99px; background: #303038; }
  .mobile-progress i { display: block; height: 100%; background: white; }
  .sheet-backdrop { position: fixed; z-index: 90; inset: 0; display: flex; align-items: flex-end; background: rgba(0,0,0,.72); }
  .bottom-sheet { position: relative; width: 100%; max-height: 86vh; overflow: auto; border-radius: 20px 20px 0 0; background: var(--card); }
  .bottom-sheet .summary-card { border: 0; border-radius: 0; }
  .sheet-close { position: absolute; z-index: 2; top: 14px; right: 14px; width: 36px; height: 36px; display: grid; place-items: center; border: 0; border-radius: 50%; background: var(--raised); }
  .bottom-sheet .summary-title { padding-right: 40px; }
  .new-project { padding-bottom: 88px; }
  .toast { bottom: 86px; }
}

@media (max-width: 520px) {
  .topbar { height: 56px; }
  .topbar > button { height: 56px; margin-left: 16px; }
  .desktop-back { display: none; }
  .mobile-back { display: inline; }
  .layout { width: calc(100% - 24px); padding-top: 24px; }
  .hero { margin-bottom: 28px; }
  .hero h1 { font-size: 28px; line-height: 1.15; }
  .hero p { font-size: 13px; }
  .templates { overflow: hidden; margin-inline: -12px; padding-inline: 12px; }
  .template-grid { margin-inline: -12px; padding: 0 12px 8px; display: flex; overflow-x: auto; scroll-snap-type: x mandatory; }
  .template-card { width: 190px; flex: 0 0 190px; scroll-snap-align: start; }
  .accordions { margin-top: 24px; }
  .accordion { border-radius: 16px; }
  .accordion-head { min-height: 68px; padding: 12px; grid-template-columns: 28px minmax(0,1fr) auto 18px; gap: 8px; }
  .accordion.open .accordion-head { top: 56px; }
  .accordion-head .badge { max-width: 70px; overflow: hidden; }
  .panel-inner { padding: 22px 14px 16px; }
  .business-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .purpose-grid, .toggle-grid, .contact-grid { grid-template-columns: 1fr; }
  .select-card { height: 72px; }
  .purpose-grid .select-card { height: 64px; }
  .input-wrap input, .input-wrap textarea { font-size: 16px; }
  .label-row { align-items: flex-start; }
  .label-row label { flex-wrap: wrap; }
  .label-row label small { width: 100%; }
  .image-slots { grid-template-columns: repeat(2, 1fr); }
  .segmented button { padding-inline: 7px; font-size: 12px; }
  .mobile-summary { grid-template-columns: minmax(92px, .7fr) minmax(188px, 1.3fr); padding-inline: 12px; gap: 8px; }
  .mobile-summary .primary { white-space: nowrap; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto!important; animation-duration: .01ms!important; animation-iteration-count: 1!important; transition-duration: .01ms!important; }
}
{
  "name": "figma-make-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "format": "oxfmt"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "oxfmt": "^0.2.0",
    "typescript": "^5.7.0",
    "vite": "^8.0.5"
  }
}
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["node"],
    "strict": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "vite.config.ts"]
}
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["node"],
    "strict": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "vite.config.ts"]
}
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

import siteConfiguration from './.figma/make/site.json'


// Vite config — https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // .figma/make/deploy-preview passes `--mode development` for cached-preview builds.
  const emitSourcemaps = mode === 'development'

  return {
    base: process.env.FIGMA_PUBLIC_URL ? `${process.env.FIGMA_PUBLIC_URL}/` : '/',
    build: {
      sourcemap: emitSourcemaps ? 'inline' : false,
      minify: !emitSourcemaps,
    },
    plugins: [
react(),
      tailwindcss(),
      figmaSiteConfiguration(siteConfiguration),
      figmaErrorOverlayReplay(),
      figmaReactRefreshBoundaryFallback(),
      figmaMakeKitPlugin({ storiesGlob: '/src/**/*.stories.{ts,tsx,js,jsx}' }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: process.env.FIGMA_DEV_SERVER_HOST || '0.0.0.0',
      port: parseInt(process.env.PORT || '8443'),
      strictPort: true,
      watch: {
        ignored: [
          '**/.figma/**',
],
      },
    },
    preview: {
      host: process.env.FIGMA_DEV_SERVER_HOST || '0.0.0.0',
      port: parseInt(process.env.PORT || '8443'),
    },
  }
})

type FigmaSiteConfiguration = {
  title?: string
  description?: string
  language?: string
  robots?: {
    index?: boolean
  }
  icons?: {
    icon?: string
  }
  openGraph?: {
    image?: string
  }
  analytics?: {
    googleAnalyticsId?: string
  }
  customScripts?: {
    headStart?: string
    headEnd?: string
    bodyStart?: string
    bodyEnd?: string
  }
  accessibility?: {
    addBypassLinks?: boolean
  }
}

/** Applies /.figma/make/site.json to the generated document shell. */
function figmaSiteConfiguration(config: FigmaSiteConfiguration): Plugin {
  function sanitizeHtmlValue(value: string | undefined): string {
    return value?.replace(/[^a-zA-Z0-9_-]/g, '') || ''
  }
  function escapeHtmlText(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
  function replaceHtmlCommentSlot(html: string, slotName: string, content: string): string {
    return html.replace(`<!-- ${slotName} -->`, content)
  }

  const title = config.title ?? "Figma Make App"
  const description = config.description ?? ''
  // Imported HTML keeps its own favicon; new Makes default to the Make product icon.
  const favicon = config.icons?.icon ?? '/favicon.svg'
  const socialImage = config.openGraph?.image ?? ''
  const language = sanitizeHtmlValue(config.language) || 'en'
  const googleAnalyticsId = sanitizeHtmlValue(config.analytics?.googleAnalyticsId)
  const headStart = config.customScripts?.headStart ?? ''
  const headEnd = config.customScripts?.headEnd ?? ''
  const bodyStart = config.customScripts?.bodyStart ?? ''
  const bodyEnd = config.customScripts?.bodyEnd ?? ''
  const robotsTxt = config.robots?.index === false ? 'User-agent: *\nDisallow: /\n' : ''

  return {
    name: 'figma-site-configuration',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!robotsTxt || req.url?.split('?')[0] !== '/robots.txt') return next()

        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(robotsTxt)
      })
    },
    generateBundle() {
      if (!robotsTxt) return

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: robotsTxt,
      })
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        let result = html
        result = replaceHtmlCommentSlot(result, 'figma:lang', language)
        result = replaceHtmlCommentSlot(result, 'figma:title', escapeHtmlText(title))
        result = replaceHtmlCommentSlot(result, 'figma:head-start', headStart)
        result = replaceHtmlCommentSlot(result, 'figma:head-end', headEnd)
        result = replaceHtmlCommentSlot(result, 'figma:body-start', bodyStart)
        result = replaceHtmlCommentSlot(result, 'figma:body-end', bodyEnd)

        const tags: HtmlTagDescriptor[] = []
        if (description) {
          tags.push({ tag: 'meta', attrs: { name: 'description', content: description }, injectTo: 'head' })
        }
        if (config.robots?.index === false) {
          tags.push({ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' }, injectTo: 'head' })
        }
        if (favicon) {
          tags.push({ tag: 'link', attrs: { rel: 'icon', href: favicon }, injectTo: 'head' })
        }
        if (title) {
          tags.push({ tag: 'meta', attrs: { property: 'og:title', content: title }, injectTo: 'head' })
        }
        if (description) {
          tags.push({ tag: 'meta', attrs: { property: 'og:description', content: description }, injectTo: 'head' })
        }
        if (socialImage) {
          tags.push(
            { tag: 'meta', attrs: { property: 'og:image', content: socialImage }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'twitter:image', content: socialImage }, injectTo: 'head' },
          )
        }

        if (googleAnalyticsId) {
          tags.push(
            {
              tag: 'script',
              attrs: {
                async: true,
                src: `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`,
              },
              injectTo: 'head',
            },
            {
              tag: 'script',
              children: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', ${JSON.stringify(googleAnalyticsId)});
`,
              injectTo: 'head',
            },
          )
        }

        if (config.accessibility?.addBypassLinks) {
          tags.push(
            {
              tag: 'style',
              children: `
  .figma-bypass-link {
    position: fixed;
    top: 8px;
    left: 8px;
    z-index: 2147483647;
    transform: translateY(-150%);
    border-radius: 6px;
    background: #111827;
    color: #fff;
    padding: 8px 12px;
    font: 600 14px/1.2 system-ui, sans-serif;
    text-decoration: none;
  }
  .figma-bypass-link:focus {
    transform: translateY(0);
  }
`,
              injectTo: 'head',
            },
            {
              tag: 'a',
              attrs: { class: 'figma-bypass-link', href: '#root' },
              children: 'Skip to content',
              injectTo: 'body-prepend',
            },
          )
        }

        return {
          html: result,
          tags,
        }
      },
    },
  }
}

/**
 * Replay the most recent build error to clients that connect after
 * it was first broadcast. Vite buffers an error payload only while
 * no clients are connected and clears the buffer on the first
 * reconnect (see `bufferedMessage` in `createWebSocketServer`), so
 * if the preview iframe reloads after Vite already delivered an
 * error to a live socket, the new socket misses the payload and
 * the overlay stays hidden even though the build is still broken.
 * We intercept `ws.send` to remember the latest error and replay
 * it on every new connection; the cache clears on a successful
 * `update` or `full-reload` so a stale overlay can't survive a
 * fixed build.
 */
function figmaErrorOverlayReplay(): Plugin {
  return {
    name: 'figma-error-overlay-replay',
    apply: 'serve',
    configureServer(server) {
      let lastError: object | null = null

      const origSend = server.ws.send.bind(server.ws) as (...args: any[]) => void
      server.ws.send = ((...args: any[]) => {
        const payload = args[0]
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          const type = (payload as { type?: string }).type
          if (type === 'error') {
            lastError = payload as object
          } else if (type === 'update' || type === 'full-reload') {
            lastError = null
          }
        }
        return origSend(...args)
      }) as typeof server.ws.send

      server.ws.on('connection', (socket) => {
        if (lastError !== null) {
          socket.send(JSON.stringify(lastError))
        }
      })
    },
  }
}

/**
 * Reload when a module that previously defined a React Refresh boundary stops
 * defining one. This happens when an agent moves a component into a new file
 * and replaces the old module with a re-export:
 *
 *   export { default } from './app/App'
 *
 * Vite otherwise accepts the update using the previous module's HMR boundary,
 * but the re-export-only transform no longer registers a replacement for the
 * mounted component family. React reports a successful refresh while leaving
 * the old tree mounted until the page is reloaded.
 */
function figmaReactRefreshBoundaryFallback(): Plugin {
  type ModuleNode = import('vite').ModuleNode
  const hadRefreshBoundary = new Map<string, boolean>()
  const lostRefreshBoundaries = new Set<string>()
  let sendFullReload: (() => void) | null = null

  return {
    name: 'figma-react-refresh-boundary-fallback',
    apply: 'serve',
    enforce: 'post',
    configureServer(server) {
      sendFullReload = () => server.ws.send({ type: 'full-reload', path: '*' })
    },
    handleHotUpdate({ modules, server, timestamp }) {
      if (lostRefreshBoundaries.size === 0) return

      const visited = new Set<ModuleNode>()
      const pending = [...modules]
      while (pending.length > 0) {
        const current = pending.pop()
        if (!current || visited.has(current)) continue
        visited.add(current)

        const moduleId = current.id?.split('?')[0]
        if (moduleId && lostRefreshBoundaries.has(moduleId)) {
          const invalidated = new Set<ModuleNode>()
          for (const updatedModule of modules) {
            server.moduleGraph.invalidateModule(updatedModule, invalidated, timestamp, true)
          }
          sendFullReload?.()
          return []
        }

        pending.push(...current.importers)
      }
    },
    transform(code, id) {
      if (!/\.[jt]sx?(?:\?|$)/.test(id) || id.includes('/node_modules/')) return null

      const moduleId = id.split('?')[0] ?? id
      const hasRefreshBoundary = code.includes('registerExportsForReactRefresh')
      const previousHadRefreshBoundary = hadRefreshBoundary.get(moduleId)
      hadRefreshBoundary.set(moduleId, hasRefreshBoundary)

      if (hasRefreshBoundary) lostRefreshBoundaries.delete(moduleId)
      if (previousHadRefreshBoundary && !hasRefreshBoundary) {
        lostRefreshBoundaries.add(moduleId)
        queueMicrotask(() => sendFullReload?.())
      }

      return null
    },
  }
}

/**
 * Serves a blank render-target page at /.figma/make/kit.html that
 * the Figma preview script drives directly. The page exposes a
 * registry of every file matching `storiesGlob` on
 * window.__FIGMA__.stories so the design surface can dynamically
 * import + mount each entry into its own grid view.
 *
 * Dev-only: `apply: 'serve'` gates the plugin to `vite dev`. Prod
 * builds (`vite build`) skip it entirely so the route doesn't leak
 * into shipped bundles.
 */
function figmaMakeKitPlugin(options: { storiesGlob: string | string[] }): Plugin {
  const storiesGlob = Array.isArray(options.storiesGlob) ? options.storiesGlob : [options.storiesGlob]
  const ROUTE = '/.figma/make/kit.html'
  const VIRTUAL_ID = 'virtual:figma-stories'
  const RESOLVED_ID = '\0' + VIRTUAL_ID
  const STORIES_MODULE = `export const stories = import.meta.glob(${JSON.stringify(storiesGlob)})`
  const HTML_BOOTSTRAP = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
<div id="figma-make-kit-root"></div>
<script type="module">
  import { stories } from 'virtual:figma-stories'
  window.__FIGMA__ = Object.assign(window.__FIGMA__ ?? {}, { stories })
  window.dispatchEvent(new CustomEvent('figma.ready'))
</script>
</body>
</html>`

  return {
    name: 'figma-make-kit',
    apply: 'serve',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
      return null
    },
    load(id) {
      if (id !== RESOLVED_ID) return null
      return STORIES_MODULE
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        if (url.split('?')[0] !== ROUTE) return next()

        try {
          res.setHeader('Content-Type', 'text/html')
          res.end(await server.transformIndexHtml(url, HTML_BOOTSTRAP))
        } catch (err) {
          next(err as Error)
        }
      })
    },
  }
}



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
