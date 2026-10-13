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
HALAMAN_TARGET      : Akun user di url /settings
TEMA_TARGET         : Hitam dan putih (monokrom). Tanpa warna aksen berwarna.
ROUTE_TERKUNCI      : semua tujuan link di navbar dan footer, logout, termasuk yang menuju login dan register
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
import { useEffect, useRef, useState, type ReactNode } from "react"

type IconName = "chevron-left" | "copy" | "grid" | "log-out" | "menu" | "plus" | "x"

const iconPaths: Record<IconName, ReactNode> = {
  "chevron-left": (
    <>
      <path d="m14 17-5-5 5-5" />
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  "log-out": (
    <>
      <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
      <path d="m15 16 4-4-4-4M19 12H9" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
}

function Icon({ name, size = 20 }: { name: IconName size?: number }) {
  return (
    <svg
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
      {iconPaths[name]}
    </svg>
  )
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="Pakhir Studio">
      <span className="brand-mark">
        <span />
      </span>
      {!compact && <span className="brand-name">Pakhir Studio</span>}
    </div>
  )
}

function Topography() {
  const topPaths = [
    "M650 18C790-44 894 22 997 74s188 32 277-22 184-43 305 21",
    "M624 47C767-18 881 44 987 96s191 38 284-15 189-41 310 24",
    "M612 79C755 13 872 70 980 120s194 43 291-9 193-39 315 28",
    "M618 112C757 45 869 96 978 144s196 49 296-2 197-36 319 31",
    "M640 145C771 78 877 122 984 168s198 54 301 5 201-33 322 35",
    "M677 178C797 112 900 149 1004 192s197 59 303 12 204-29 324 39",
    "M728 212C838 147 936 177 1037 216s195 63 303 19 207-24 326 43",
    "M791 246C891 184 984 207 1081 241s193 66 303 26 209-18 326 47",
  ]
  const bottomPaths = [
    "M-80 722C32 635 145 628 242 694s177 70 270 7 174-48 276 18",
    "M-72 752C36 669 142 660 237 722s179 67 274 7 178-44 281 20",
    "M-64 782C40 703 140 691 233 750s180 64 277 7 182-40 286 22",
    "M-56 812C44 737 138 722 229 778s181 61 280 7 186-36 291 24",
    "M-48 842C48 771 136 753 225 806s182 58 283 7 190-32 296 26",
    "M-40 872C52 805 134 784 221 834s183 55 286 7 194-28 301 28",
    "M-32 902C56 839 132 815 217 862s184 52 289 7 198-24 306 30",
  ]

  return (
    <svg
      className="topography"
      viewBox="0 0 1600 900"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g className="contours contours-top">
        {topPaths.map((path, index) => (
          <path
            key={path}
            className={index === 4 ? "index-contour" : ""}
            d={path}
          />
        ))}
      </g>
      <g className="contours contours-bottom">
        {bottomPaths.map((path, index) => (
          <path
            key={path}
            className={index === 4 ? "index-contour" : ""}
            d={path}
          />
        ))}
      </g>
    </svg>
  )
}

interface SidebarProps {
  collapsed: boolean
  drawerOpen: boolean
  onCollapse: () => void
  onDrawerClose: () => void
}

export function Sidebar({
  collapsed,
  drawerOpen,
  onCollapse,
  onDrawerClose,
}: SidebarProps) {
  return (
    <>
      <button
        className={`drawer-backdrop ${drawerOpen ? "show" : ""}`}
        onClick={onDrawerClose}
        aria-label="Tutup menu"
      />
      <aside
        className={`sidebar ${collapsed ? "collapsed" : ""} ${
          drawerOpen ? "drawer-open" : ""
        }`}
      >
        <div className="sidebar-head">
          {collapsed ? (
            <button
              className="collapsed-logo tooltip"
              data-tooltip="Perluas menu"
              onClick={onCollapse}
              aria-label="Perluas menu"
            >
              <Logo compact />
            </button>
          ) : (
            <Logo />
          )}
          <button
            className="collapse-button tooltip"
            data-tooltip={collapsed ? "Perluas menu" : "Ciutkan menu"}
            onClick={onCollapse}
            aria-label={collapsed ? "Perluas menu" : "Ciutkan menu"}
          >
            <Icon name="chevron-left" size={19} />
          </button>
          <button
            className="drawer-close"
            onClick={onDrawerClose}
            aria-label="Tutup menu"
          >
            <Icon name="x" />
          </button>
        </div>

        <nav className="side-nav" aria-label="Navigasi utama">
          <a
            className="nav-item tooltip"
            data-tooltip="Project Saya"
            href="/project"
          >
            <Icon name="grid" />
            {!collapsed && <span>Project Saya</span>}
          </a>
          <a
            className="nav-item tooltip"
            data-tooltip="Buat Website"
            href="/buat"
          >
            <Icon name="plus" />
            {!collapsed && <span>Buat Website</span>}
          </a>
        </nav>

        <a
          className="account active tooltip"
          data-tooltip="Akun saya"
          href="/akun"
          aria-current="page"
        >
          <span className="side-avatar">S</span>
          {!collapsed && (
            <span className="account-copy">
              <strong title="shorszz24@gmail.com">shorszz24@gmail.com</strong>
              <small>Akun saya</small>
            </span>
          )}
        </a>
      </aside>
    </>
  )
}

function MobileBar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="mobile-bar">
      <Logo />
      <button className="mobile-menu" onClick={onMenu} aria-label="Buka menu">
        <Icon name="menu" />
      </button>
    </header>
  )
}

type AccountState = "default" | "loading" | "logging-out"

interface AccountCardProps {
  state?: AccountState
  onLogout: () => void
}

export function AccountCard({ state = "default", onLogout }: AccountCardProps) {
  const [copied, setCopied] = useState(false)
  const isLoading = state === "loading"
  const isLoggingOut = state === "logging-out"

  const copyEmail = async () => {
    await navigator.clipboard?.writeText("shorszz24@gmail.com")
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <section
      className={`account-card ${isLoading ? "is-loading" : ""}`}
      aria-label="Informasi akun"
      aria-busy={isLoading || isLoggingOut}
    >
      <div className="identity">
        {isLoading ? (
          <>
            <span className="skeleton skeleton-avatar" />
            <span className="identity-copy">
              <span className="skeleton skeleton-name" />
              <span className="skeleton skeleton-email" />
            </span>
          </>
        ) : (
          <>
            <span className="profile-avatar">S</span>
            <span className="identity-copy">
              <strong title="shorszz24">shorszz24</strong>
              <span className="email-line">
                <span className="email" title="shorszz24@gmail.com">
                  shorszz24@gmail.com
                </span>
                <button
                  className="copy-button tooltip"
                  data-tooltip={copied ? "Tersalin" : "Salin email"}
                  onClick={copyEmail}
                  aria-label={copied ? "Email tersalin" : "Salin email"}
                >
                  <Icon name="copy" size={16} />
                </button>
              </span>
            </span>
          </>
        )}
      </div>

      <div className="status-row">
        <span>Status akun</span>
        {isLoading ? (
          <span className="skeleton skeleton-status" />
        ) : (
          <span className="account-status">
            <i />
            Akun aktif
          </span>
        )}
      </div>

      <div className="logout-zone">
        <button
          className="logout-button"
          onClick={onLogout}
          disabled={isLoading || isLoggingOut}
        >
          {isLoggingOut ? (
            <span className="spinner" aria-hidden="true" />
          ) : (
            <Icon name="log-out" size={18} />
          )}
          {isLoggingOut ? "Keluar..." : "Keluar"}
        </button>
      </div>
    </section>
  )
}

interface LogoutDialogProps {
  onCancel: () => void
  onConfirm: () => void
}

export function LogoutDialog({ onCancel, onConfirm }: LogoutDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", close)
    return () => window.removeEventListener("keydown", close)
  }, [onCancel])

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="dialog-title">Keluar dari akun?</h2>
        <p id="dialog-description">
          Kamu perlu masuk lagi untuk membuka project-mu.
        </p>
        <div className="dialog-actions">
          <button ref={cancelRef} className="cancel-button" onClick={onCancel}>
            Batal
          </button>
          <button className="confirm-button" onClick={onConfirm}>
            Keluar
          </button>
        </div>
      </section>
    </div>
  )
}

export default function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [accountState, setAccountState] = useState<AccountState>("default")

  const confirmLogout = () => {
    setDialogOpen(false)
    setAccountState("logging-out")
    window.setTimeout(() => setAccountState("default"), 1800)
  }

  return (
    <div className={`app ${collapsed ? "rail" : ""}`}>
      <MobileBar onMenu={() => setDrawerOpen(true)} />
      <Sidebar
        collapsed={collapsed}
        drawerOpen={drawerOpen}
        onCollapse={() => setCollapsed((value) => !value)}
        onDrawerClose={() => setDrawerOpen(false)}
      />
      <main className="main">
        <Topography />
        <div className="content">
          <header className="page-header">
            <h1>Akun Saya</h1>
            <p>Informasi akun yang sedang kamu pakai.</p>
          </header>
          <div className="account-stage">
            <AccountCard
              state={accountState}
              onLogout={() => setDialogOpen(true)}
            />
          </div>
        </div>
      </main>
      {dialogOpen && (
        <LogoutDialog
          onCancel={() => setDialogOpen(false)}
          onConfirm={confirmLogout}
        />
      )}
    </div>
  )
}
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
@import "tailwindcss";

:root {
  --page: #07070a;
  --sidebar: #0b0b10;
  --card: #101016;
  --raised: #16161d;
  --text: #ffffff;
  --secondary: #a1a1aa;
  --muted: #71717a;
  --border: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(255, 255, 255, 0.18);
  --green: #4ade80;
  --red: #f87171;
  --sidebar-width: 280px;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

html {
  background: var(--page);
}

body {
  margin: 0;
  background: var(--page);
  color: var(--text);
  font-family: "Inter", sans-serif;
  -webkit-font-smoothing: antialiased;
}

button {
  color: inherit;
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

a {
  color: inherit;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}

button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--text);
  outline-offset: 2px;
}

.app {
  --current-sidebar: var(--sidebar-width);
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  background: var(--page);
}

.app.rail {
  --current-sidebar: 72px;
}

.sidebar {
  position: fixed;
  z-index: 40;
  inset: 0 auto 0 0;
  width: var(--current-sidebar);
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid var(--border);
  background: var(--sidebar);
  transition: width 220ms ease, transform 220ms ease;
}

.sidebar-head {
  height: 88px;
  padding: 0 24px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 11px;
  white-space: nowrap;
}

.brand-mark {
  width: 31px;
  height: 31px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: var(--text);
}

.brand-mark span {
  width: 13px;
  height: 13px;
  border: 2px solid var(--page);
  border-radius: 4px;
}

.brand-name {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.collapse-button,
.drawer-close,
.mobile-menu {
  width: 36px;
  height: 36px;
  flex: none;
  display: grid;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--muted);
  transition: color 160ms, background 160ms, border-color 160ms;
}

.collapse-button:hover,
.drawer-close:hover,
.mobile-menu:hover {
  border-color: var(--border);
  background: var(--raised);
  color: var(--text);
}

.collapsed-logo {
  padding: 0;
  border: 0;
  border-radius: 9px;
  background: transparent;
}

.side-nav {
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  height: 44px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 13px;
  border: 1px solid transparent;
  border-radius: 12px;
  color: var(--secondary);
  font-size: 14px;
  font-weight: 500;
  transition: background 160ms, border-color 160ms, color 160ms;
}

.nav-item svg {
  flex: none;
}

.nav-item:hover {
  border-color: var(--border);
  background: rgba(255, 255, 255, 0.035);
  color: var(--text);
}

.account {
  min-width: 0;
  min-height: 72px;
  margin: auto 12px 16px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid transparent;
  border-radius: 12px;
  transition: background 160ms, border-color 160ms;
}

.account.active {
  border-color: var(--border);
  background: var(--raised);
}

.account:hover {
  border-color: var(--border-hover);
  background: var(--raised);
}

.side-avatar {
  width: 38px;
  height: 38px;
  flex: none;
  display: grid;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: #222229;
  font-size: 13px;
  font-weight: 600;
}

.account-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.account-copy strong {
  overflow: hidden;
  color: #e4e4e7;
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-copy small {
  color: var(--muted);
  font-size: 11px;
}

.sidebar.collapsed .sidebar-head {
  padding: 0 20px;
}

.sidebar.collapsed .collapse-button {
  display: none;
}

.sidebar.collapsed .side-nav {
  padding-inline: 13px;
}

.sidebar.collapsed .nav-item {
  width: 46px;
  padding: 0;
  justify-content: center;
}

.sidebar.collapsed .account {
  min-height: 62px;
  margin-inline: 8px;
  padding: 11px 8px;
  justify-content: center;
}

.sidebar.collapsed .side-avatar {
  width: 36px;
  height: 36px;
}

.tooltip {
  position: relative;
}

.tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  z-index: 90;
  left: 50%;
  bottom: calc(100% + 9px);
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: #24242b;
  color: var(--text);
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 4px);
  transition: opacity 140ms, transform 140ms;
}

.tooltip:hover::after,
.tooltip:focus-visible::after {
  opacity: 1;
  transform: translate(-50%, 0);
}

.sidebar.collapsed .tooltip::after {
  left: calc(100% + 10px);
  bottom: 50%;
  transform: translate(4px, 50%);
}

.sidebar.collapsed .tooltip:hover::after,
.sidebar.collapsed .tooltip:focus-visible::after {
  transform: translate(0, 50%);
}

.mobile-bar,
.drawer-close,
.drawer-backdrop {
  display: none;
}

.main {
  height: 100dvh;
  margin-left: var(--current-sidebar);
  position: relative;
  overflow: hidden;
  transition: margin-left 220ms ease;
}

.topography {
  position: absolute;
  z-index: 0;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.contours {
  fill: none;
  stroke: rgba(255, 255, 255, 0.045);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.contours .index-contour {
  stroke: rgba(255, 255, 255, 0.08);
}

.contours-top {
  mask-image: radial-gradient(ellipse at 78% 8%, #000 8%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at 78% 8%, #000 8%, transparent 70%);
}

.contours-bottom {
  mask-image: radial-gradient(ellipse at 5% 94%, #000 8%, transparent 72%);
  -webkit-mask-image: radial-gradient(ellipse at 5% 94%, #000 8%, transparent 72%);
}

.content {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  padding: 56px clamp(40px, 5vw, 80px) 40px;
  display: grid;
  grid-template-rows: auto 1fr;
}

.page-header {
  width: min(100%, 1240px);
  margin: 0 auto;
}

.page-header h1 {
  margin: 0 0 10px;
  font-size: 32px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.page-header p {
  margin: 0;
  color: var(--secondary);
  font-size: 14px;
  line-height: 1.5;
}

.account-stage {
  min-height: 0;
  display: grid;
  place-items: center;
  padding-bottom: 6vh;
}

.account-card {
  width: min(560px, 100%);
  height: 320px;
  padding: 32px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: rgba(16, 16, 22, 0.94);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025), 0 24px 70px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.identity {
  height: 104px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-avatar,
.skeleton-avatar {
  width: 72px;
  height: 72px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: var(--text);
  color: var(--page);
  font-size: 28px;
  font-weight: 700;
}

.identity-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.identity-copy > strong {
  overflow: hidden;
  font-size: 22px;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.email-line {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.email {
  min-width: 0;
  overflow: hidden;
  color: var(--secondary);
  font-size: 14px;
  line-height: 32px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-button {
  width: 32px;
  height: 32px;
  flex: none;
  display: grid;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  transition: color 160ms, background 160ms, border-color 160ms;
}

.copy-button:hover {
  border-color: var(--border);
  background: var(--raised);
  color: var(--text);
}

.status-row {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  color: var(--secondary);
  font-size: 14px;
}

.account-status {
  height: 26px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 999px;
  background: rgba(74, 222, 128, 0.12);
  color: var(--green);
  font-size: 12px;
  font-weight: 600;
}

.account-status i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.logout-zone {
  height: 88px;
  display: flex;
  align-items: flex-end;
}

.logout-button {
  width: 100%;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1px solid rgba(248, 113, 113, 0.25);
  border-radius: 12px;
  background: transparent;
  color: var(--red);
  font-size: 14px;
  font-weight: 600;
  transition: background 160ms, border-color 160ms, opacity 160ms;
}

.logout-button:hover:not(:disabled) {
  border-color: rgba(248, 113, 113, 0.45);
  background: rgba(248, 113, 113, 0.1);
}

.logout-button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.22);
  border-top-color: var(--secondary);
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}

.skeleton {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 8px;
  background: #1b1b22;
}

.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.045), transparent);
  animation: shimmer 1.8s infinite;
}

.skeleton-avatar {
  border-radius: 20px;
  background: #1b1b22;
}

.skeleton-name {
  width: 145px;
  height: 22px;
}

.skeleton-email {
  width: 210px;
  height: 14px;
}

.skeleton-status {
  width: 84px;
  height: 26px;
  border-radius: 999px;
}

.dialog-backdrop {
  position: fixed;
  z-index: 100;
  inset: 0;
  padding: 20px;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: fade-in 160ms ease-out;
}

.dialog {
  width: min(400px, 100%);
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 20px;
  background: #121218;
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  animation: dialog-in 180ms ease-out;
}

.dialog h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.25;
  letter-spacing: -0.03em;
}

.dialog p {
  margin: 10px 0 0;
  color: var(--secondary);
  font-size: 14px;
  line-height: 1.55;
}

.dialog-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-button,
.confirm-button {
  min-width: 82px;
  height: 40px;
  padding: 0 15px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  transition: background 160ms, border-color 160ms;
}

.cancel-button {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
}

.cancel-button:hover {
  border-color: var(--border-hover);
  background: var(--raised);
}

.confirm-button {
  border: 1px solid rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.1);
  color: var(--red);
}

.confirm-button:hover {
  border-color: rgba(248, 113, 113, 0.5);
  background: rgba(248, 113, 113, 0.16);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  to {
    transform: translateX(100%);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@keyframes dialog-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
}

@media (max-width: 900px) {
  .app {
    --current-sidebar: 72px;
  }

  .sidebar {
    width: 72px;
  }

  .sidebar .sidebar-head {
    padding: 0 20px;
  }

  .sidebar .brand-name,
  .sidebar .collapse-button,
  .sidebar .nav-item span,
  .sidebar .account-copy {
    display: none;
  }

  .sidebar .side-nav {
    padding-inline: 13px;
  }

  .sidebar .nav-item {
    width: 46px;
    padding: 0;
    justify-content: center;
  }

  .sidebar .account {
    min-height: 62px;
    margin-inline: 8px;
    padding: 11px 8px;
    justify-content: center;
  }

  .sidebar .tooltip::after {
    left: calc(100% + 10px);
    bottom: 50%;
    transform: translate(4px, 50%);
  }

  .sidebar .tooltip:hover::after,
  .sidebar .tooltip:focus-visible::after {
    transform: translate(0, 50%);
  }

  .content {
    padding: 48px 40px 32px;
  }
}

@media (max-height: 820px) and (min-width: 621px) {
  .content {
    padding-top: 40px;
    padding-bottom: 24px;
  }

  .account-stage {
    padding-bottom: 2vh;
  }

  .account-card {
    height: 304px;
    padding: 24px 32px;
  }

  .identity {
    height: 96px;
  }

  .status-row {
    height: 64px;
  }

  .logout-zone {
    height: 96px;
  }
}

@media (max-width: 620px) {
  .app {
    --current-sidebar: 0px;
    padding-top: 64px;
  }

  .mobile-bar {
    position: fixed;
    z-index: 50;
    inset: 0 0 auto;
    height: 64px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
    background: rgba(11, 11, 16, 0.96);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }

  .mobile-bar .brand-mark {
    width: 29px;
    height: 29px;
  }

  .mobile-menu {
    display: grid;
    color: var(--secondary);
  }

  .sidebar,
  .sidebar.collapsed {
    z-index: 70;
    width: 280px;
    transform: translateX(-100%);
    box-shadow: 24px 0 70px rgba(0, 0, 0, 0.45);
  }

  .sidebar.drawer-open {
    transform: translateX(0);
  }

  .sidebar .sidebar-head,
  .sidebar.collapsed .sidebar-head {
    padding: 0 20px 0 24px;
  }

  .sidebar .brand-name,
  .sidebar.collapsed .brand-name,
  .sidebar .nav-item span,
  .sidebar.collapsed .nav-item span,
  .sidebar .account-copy,
  .sidebar.collapsed .account-copy {
    display: flex;
  }

  .sidebar .collapsed-logo .brand-name {
    display: none;
  }

  .sidebar .collapse-button {
    display: none;
  }

  .sidebar .drawer-close {
    display: grid;
  }

  .sidebar .side-nav,
  .sidebar.collapsed .side-nav {
    padding: 16px 12px;
  }

  .sidebar .nav-item,
  .sidebar.collapsed .nav-item {
    width: auto;
    padding: 0 14px;
    justify-content: flex-start;
  }

  .sidebar .account,
  .sidebar.collapsed .account {
    min-height: 72px;
    margin: auto 12px 16px;
    padding: 12px;
    justify-content: flex-start;
  }

  .drawer-backdrop.show {
    position: fixed;
    z-index: 60;
    inset: 0;
    display: block;
    border: 0;
    background: rgba(0, 0, 0, 0.64);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  .main {
    height: calc(100dvh - 64px);
    margin-left: 0;
  }

  .topography .contours path:nth-child(even) {
    display: none;
  }

  .content {
    padding: 28px 16px 16px;
    display: block;
  }

  .page-header h1 {
    margin-bottom: 8px;
    font-size: 28px;
  }

  .page-header p {
    font-size: 13px;
  }

  .account-stage {
    display: block;
    padding: 24px 0 0;
  }

  .account-card {
    width: 100%;
    height: 292px;
    padding: 24px;
    border-radius: 20px;
  }

  .identity {
    height: 88px;
    gap: 16px;
  }

  .profile-avatar,
  .skeleton-avatar {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    font-size: 22px;
  }

  .identity-copy {
    gap: 5px;
  }

  .identity-copy > strong {
    font-size: 19px;
  }

  .status-row {
    height: 60px;
  }

  .logout-zone {
    height: 96px;
  }

  .skeleton-name {
    width: min(145px, 80%);
    height: 19px;
  }

  .skeleton-email {
    width: min(190px, 95%);
  }

  .dialog {
    padding: 22px;
    border-radius: 18px;
  }
}

@media (max-width: 360px), (max-height: 700px) {
  .content {
    padding-top: 20px;
  }

  .account-stage {
    padding-top: 18px;
  }

  .account-card {
    height: 272px;
    padding: 18px 20px;
  }

  .identity {
    height: 82px;
  }

  .status-row {
    height: 58px;
  }

  .logout-zone {
    height: 94px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
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
