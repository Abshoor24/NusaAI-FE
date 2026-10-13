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
HALAMAN_TARGET      : Project user /project
TEMA_TARGET         : Hitam dan putih (monokrom). Tanpa warna aksen berwarna.
ROUTE_TERKUNCI      : semua tujuan link di navbar dan footer, termasuk yang menuju login dan register
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
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

type IconName =
  | "arrow-left"
  | "arrow-right"
  | "chevron-left"
  | "edit"
  | "grid"
  | "layers"
  | "menu"
  | "plus"
  | "trash"
  | "x";

const iconPaths: Record<IconName, ReactNode> = {
  "arrow-left": <><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>,
  "arrow-right": <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  "chevron-left": <><path d="m14 17-5-5 5-5" /><rect x="3" y="3" width="18" height="18" rx="3" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
  grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
  layers: <><path d="m12 3-9 5 9 5 9-5-9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 16 9 5 9-5" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="m7 7 1 13h8l1-13" /><path d="M10 11v5M14 11v5" /></>,
  x: <path d="m6 6 12 12M18 6 6 18" />,
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="Pakhir Studio">
      <span className="brand-mark"><span /></span>
      {!compact && <span className="brand-name">Pakhir Studio</span>}
    </div>
  );
}

function Topography({ miniature = false }: { miniature?: boolean }) {
  const paths = [
    "M-90 120C65 22 183 28 310 104s217 73 333-25S873-15 990 70s228 102 370 2 253-72 380 40",
    "M-82 151C57 59 181 58 299 127s220 67 338-24 228-83 351-5 235 95 372 1 253-61 370 48",
    "M-74 182C49 97 175 89 291 150s221 61 341-20 227-74 354-3 241 88 374 1 249-53 360 54",
    "M-66 213C42 135 170 119 284 173s221 56 343-16 226-65 357 0 245 81 376 4 243-45 350 58",
    "M-58 244C35 173 165 149 278 196s221 50 344-12 225-56 359 3 249 74 378 7 237-36 340 62",
    "M-50 275C29 211 161 179 273 219s220 45 345-8 224-47 361 6 251 68 379 10 231-28 330 66",
    "M-42 306C23 249 157 209 268 242s219 40 345-4 223-39 362 9 254 61 380 13 225-19 320 70",
    "M-34 337C17 287 153 239 263 265s217 35 344 0 222-30 363 12 255 55 380 16 219-11 310 74",
    "M-26 368C11 325 149 269 258 288s215 30 343 4 221-21 363 15 256 49 379 19 213-2 300 78",
    "M-18 399C5 363 145 299 253 311s213 25 341 8 220-12 363 18 257 42 378 22 207 6 290 82",
    "M-10 430C-1 401 141 329 248 334s211 20 339 12 219-3 362 21 257 36 376 25 201 15 280 86",
    "M-2 461C-7 439 137 359 243 357s209 15 337 16 218 6 361 24 257 30 374 28 195 23 270 90",
    "M6 492C-13 477 133 389 238 380s207 10 335 20 217 15 359 27 256 23 372 31 189 32 260 94",
    "M14 523C-19 515 129 419 233 403s205 5 333 24 216 24 357 30 255 17 370 34 183 40 250 98",
    "M22 554C-25 553 125 449 228 426s203 0 331 28 215 33 355 33 254 11 368 37 177 49 240 102",
  ];

  return (
    <svg className={miniature ? "topography topography-mini" : "topography"} viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
      <g className="contours">
        {paths.map((path, index) => <path key={path} className={(index + 1) % 5 === 0 ? "index-contour" : ""} d={path} />)}
        <g transform="translate(1510 890) rotate(180) scale(.78)">
          {paths.slice(0, 11).map((path, index) => <path key={`b-${path}`} className={(index + 1) % 5 === 0 ? "index-contour" : ""} d={path} />)}
        </g>
      </g>
    </svg>
  );
}

interface Project {
  title: string;
  description: string;
  versions: string;
  date: string;
  preview?: boolean;
}

const projects: Project[] = [
  {
    title: "Kedai kopi kecil di Purwokerto yang sangrai kopinya sendiri.",
    description: "Kedai kopi kecil di Purwokerto yang sangrai kopinya sendiri. Buka jam 08.00 sampai 22.00, ada tempat duduk nyaman untuk bekerja, dan kami...",
    versions: "1 versi",
    date: "6 Okt 2026, 23.42",
    preview: true,
  },
  {
    title: "NakedClothes",
    description: "Toko online rumahan yang menjual pakaian wanita ukuran S sampai XL dan dikirim ke seluruh Indonesia. Pelanggan bisa pesan lewat WhatsApp,...",
    versions: "1 versi",
    date: "6 Okt 2026, 08.34",
  },
  {
    title: "Atvia",
    description: "buatkan saya website company profile tentang produk pembuatan sabun",
    versions: "2 versi",
    date: "5 Okt 2026, 18.32",
  },
];

function Sidebar({ collapsed, drawerOpen, onCollapse, onDrawerClose }: {
  collapsed: boolean;
  drawerOpen: boolean;
  onCollapse: () => void;
  onDrawerClose: () => void;
}) {
  const compact = collapsed;
  return (
    <>
      <button className={`drawer-backdrop ${drawerOpen ? "show" : ""}`} onClick={onDrawerClose} aria-label="Tutup menu" />
      <aside className={`sidebar ${compact ? "collapsed" : ""} ${drawerOpen ? "drawer-open" : ""}`}>
        <div className="sidebar-head">
          {compact ? (
            <button className="collapsed-logo tooltip" data-tooltip="Perluas menu" onClick={onCollapse} aria-label="Perluas menu">
              <Logo compact />
            </button>
          ) : <Logo />}
          <button className="collapse-button tooltip" data-tooltip={compact ? "Perluas menu" : "Ciutkan menu"} onClick={onCollapse} aria-label={compact ? "Perluas menu" : "Ciutkan menu"}>
            <Icon name="chevron-left" size={19} />
          </button>
          <button className="drawer-close" onClick={onDrawerClose} aria-label="Tutup menu"><Icon name="x" /></button>
        </div>
        <nav className="side-nav" aria-label="Navigasi utama">
          <a className="nav-item active tooltip" data-tooltip="Project Saya" href="/project">
            <Icon name="grid" />
            {!compact && <span>Project Saya</span>}
          </a>
          <a className="nav-item tooltip" data-tooltip="Buat Website" href="#buat">
            <Icon name="plus" />
            {!compact && <span>Buat Website</span>}
          </a>
        </nav>
        <div className="account tooltip" data-tooltip="Akun saya">
          <span className="avatar">S</span>
          {!compact && <span className="account-copy"><strong>shorszz24@gmail.com</strong><small>Akun saya</small></span>}
        </div>
      </aside>
    </>
  );
}

function MobileBar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="mobile-bar">
      <Logo />
      <button className="mobile-menu" onClick={onMenu} aria-label="Buka menu"><Icon name="menu" /></button>
    </header>
  );
}

function LivePreview() {
  return (
    <div className="live-preview">
      <div className="browser-bar"><i /><i /><i /><span>ruangseduh.id</span></div>
      <div className="preview-site">
        <div className="preview-nav"><b>Ruang Seduh</b><span>Menu&nbsp;&nbsp;&nbsp; Cerita&nbsp;&nbsp;&nbsp; Kontak</span></div>
        <div className="preview-copy">
          <small>KOPI LOKAL · PURWOKERTO</small>
          <strong>Kopi yang dirawat<br />dari awal.</strong>
          <span>Biji pilihan, disangrai sendiri setiap minggu.</span>
        </div>
        <div className="preview-blocks"><i /><i /><i /></div>
      </div>
    </div>
  );
}

function Placeholder({ letter }: { letter: string }) {
  return (
    <div className="placeholder">
      <Topography miniature />
      <span>{letter}</span>
    </div>
  );
}

function ProjectCard({ project, onRename, onDelete }: {
  project: Project;
  onRename: () => void;
  onDelete: () => void;
}) {
  const stop = (event: MouseEvent, callback: () => void) => {
    event.stopPropagation();
    callback();
  };
  const openProject = () => {
    window.location.hash = "buka-project";
  };
  return (
    <article className="project-card" tabIndex={0} aria-label={`Buka project ${project.title}`} onClick={openProject} onKeyDown={(event) => event.key === "Enter" && openProject()}>
      <div className="thumbnail">{project.preview ? <LivePreview /> : <Placeholder letter={project.title.charAt(0)} />}</div>
      <div className="card-title-row">
        <h2>{project.title}</h2>
        <span className="status"><i />Siap</span>
      </div>
      <p className="description">{project.description}</p>
      <div className="meta">
        <span><Icon name="layers" size={14} />{project.versions}</span>
        <time>{project.date}</time>
      </div>
      <div className="card-actions">
        <button className="open-button" onClick={(event) => stop(event, openProject)}>Buka <Icon name="arrow-right" size={16} /></button>
        <div>
          <button className="square-button tooltip" data-tooltip="Ubah judul" aria-label="Ubah judul" onClick={(event) => stop(event, onRename)}><Icon name="edit" size={17} /></button>
          <button className="square-button danger tooltip" data-tooltip="Hapus" aria-label="Hapus" onClick={(event) => stop(event, onDelete)}><Icon name="trash" size={17} /></button>
        </div>
      </div>
    </article>
  );
}

function AddCard() {
  return (
    <button className="add-card" id="buat">
      <span><Icon name="plus" size={23} /></span>
      <strong>Buat Website Baru</strong>
    </button>
  );
}

function Dialog({ type, project, onClose }: { type: "rename" | "delete"; project: Project; onClose: () => void }) {
  const isDelete = type === "delete";
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-head">
          <div>
            <h2 id="dialog-title">{isDelete ? "Hapus project?" : "Ubah Judul"}</h2>
            {isDelete && <p>Tindakan ini tidak bisa dibatalkan.</p>}
          </div>
          <button className="dialog-close" onClick={onClose} aria-label="Tutup dialog"><Icon name="x" size={18} /></button>
        </div>
        {isDelete ? (
          <div className="delete-name">{project.title}</div>
        ) : (
          <label className="field">
            <span>Judul project</span>
            <input autoFocus defaultValue={project.title} />
          </label>
        )}
        <div className="dialog-actions">
          <button className="cancel-button" onClick={onClose}>Batal</button>
          <button className={isDelete ? "delete-button" : "save-button"} onClick={onClose}>{isDelete ? "Hapus" : "Simpan"}</button>
        </div>
      </section>
    </div>
  );
}

export function LoadingState() {
  return <div className="project-grid">{[0, 1, 2].map((item) => <div className="skeleton-card" key={item}><i /><b /><span /><span /><em /></div>)}</div>;
}

export function EmptyState() {
  return (
    <section className="empty-state">
      <div className="empty-illustration"><Topography miniature /><span>P</span></div>
      <h2>Belum ada project</h2>
      <p>Mulai dengan menjelaskan website yang kamu inginkan.</p>
      <button className="primary-button">Buat Website Pertama</button>
    </section>
  );
}

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialog, setDialog] = useState<{ type: "rename" | "delete"; project: Project } | null>(null);

  return (
    <div className={`app ${collapsed ? "rail" : ""}`}>
      <MobileBar onMenu={() => setDrawerOpen(true)} />
      <Sidebar collapsed={collapsed} drawerOpen={drawerOpen} onCollapse={() => setCollapsed((value) => !value)} onDrawerClose={() => setDrawerOpen(false)} />
      <main className="main">
        <Topography />
        <div className="content">
          <header className="page-header">
            <div>
              <h1>Project Saya</h1>
              <p>Kelola website yang kamu buat dengan AI</p>
            </div>
            <button className="primary-button"><Icon name="plus" size={18} />Buat Website</button>
          </header>
          <section className="project-grid" aria-label="Daftar project">
            {projects.map((project) => (
              <ProjectCard
                key={project.title}
                project={project}
                onRename={() => setDialog({ type: "rename", project })}
                onDelete={() => setDialog({ type: "delete", project })}
              />
            ))}
            <AddCard />
          </section>
          <nav className="pagination" aria-label="Halaman project">
            <button disabled><Icon name="arrow-left" size={15} />Sebelumnya</button>
            <span>Menampilkan 1-3 dari 3 project</span>
            <button disabled>Berikutnya<Icon name="arrow-right" size={15} /></button>
          </nav>
        </div>
      </main>
      {dialog && <Dialog type={dialog.type} project={dialog.project} onClose={() => setDialog(null)} />}
    </div>
  );
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
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
