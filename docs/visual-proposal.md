# Proposal Visual Pakhir Studio (Audit Saja, Fase 5)

Status: AUDIT ONLY. Tidak ada perubahan src/, index.html, atau styles pada fase ini.
Mode antislop: after (audit). Peran antislop-ui di sini hanya lensa audit.

Tanggal: 2026-10-09.
Lingkup: landing (/), login, register, daftar project, brief baru,
workspace, settings, 404, dalam tema gelap (bawaan) dan terang.

## 0. Cara membaca dokumen ini

- Bagian 1 sampai 6: tiap area yang disorot lensa antislop, berisi bukti
  (file:line + screenshot), alasan disorot, Opsi A (minimal), Opsi B
  (lebih berani), apa yang berubah (warna, radius, bayangan, salinan,
  tes yang diperbarui), dan risiko terhadap invarian layout.
- Bagian 7: daftar temuan bernomor F-01 sampai F-18. Tiap temuan berisi
  nomor, id aturan antislop, bukti, prioritas (P1 tinggi, P2 sedang,
  P3 rendah), dan satu tag status:
  - [LOCKED]: perbaikan menyentuh warna, tema, radius, bayangan, font,
    salinan, atau logika. Butuh keputusan eksplisit sebelum dikerjakan.
  - [NEEDS MY APPROVAL]: perbaikan mengubah tampilan tetapi tidak
    menyentuh item terkunci. Butuh persetujuan sebelum dikerjakan.
  - [FREE TO FIX]: tidak menyentuh item terkunci maupun tampilan.
- Tidak ada temuan yang lolos sebagai FREE TO FIX; alasannya ada di
  bagian 7 akhir.
- Bagian 8: perbandingan tema bawaan (bukti saja, tanpa spekulasi).
- Bagian 9: kerja kontras lengkap dengan angka yang bisa diverifikasi.
- Semua tangkapan layar ada di e2e/screenshots/phase5/ (gitignored,
  tidak di-commit, hanya dirujuk sebagai bukti).

Catatan arah desain (R-37): repo ini tidak memiliki DESIGN.md dan tidak
ada arahan merek tertulis. Audit ini tidak menciptakan arah baru. Opsi
yang butuh identitas (logo, motif, palet aksen) ditandai butuh arahan
atau keputusan, bukan langsung diusulkan bentuk finalnya.

## 1. Area R-01: semburat gradien hero

Bukti:
- src/routes/index.tsx:48
  `Section className="bg-gradient-to-b from-primary/5 via-background to-background border-b border-border/40"`
- Screenshot: e2e/screenshots/phase5/landing-dark-desktop.png,
  e2e/screenshots/phase5/landing-light-desktop.png

Alasan disorot: gradien adalah perawatan warna bawaan paling umum pada
halaman generik (pola "Generic Blue-Purple Gradient" dan keluarganya).
Di sini dosisnya kecil (tint primer 5% yang memudar ke latar), jadi
bukan pelanggaran berat, tetapi tujuannya tidak tertulis di mana pun.

Opsi A (minimal): hapus semburat, hero memakai bg-background polos
seperti section lain. Yang berubah: warna latar hero (semburat primer
5% hilang). Radius, bayangan, salinan tidak berubah. Tes yang
diperbarui: jalankan color-invariants untuk memastikan 0 perbedaan
gaya (baseline TIDAK ditulis ulang); text-sweep dan axe diulang.
Risiko invarian: tidak ada risiko tinggi (padding section tetap dari
token py-section-landing, src/components/sections/section.tsx:5-8).

Opsi B (lebih berani): ganti semburat dengan satu pita identitas
(misalnya garis aksen atau blok tint dua warna khas produk) sebagai
motif yang diulang di semua section. Yang berubah: warna (butuh
keputusan palet), mungkin radius pita. Tes: color-invariants,
spacious (tinggi landing bisa bergeser), axe dua tema. Risiko
invarian: tinggi halaman landing berubah sehingga baseline tinggi
(fixtures/heights-baseline.json) perlu direkam ulang atas persetujuan;
tanpa arahan merek, motif berisiko terlihat tempelan (R-37).

## 2. Area R-04: ikon generik

Bukti:
- src/routes/index.tsx:9
  `import { Globe, PenLine, Eye, Download, ArrowRight, CheckCircle2 } from 'lucide-react'`
- Empat ikon langkah: src/routes/index.tsx:21,26,31,37
  (PenLine, Globe, Eye, Download) di dalam ubin
  src/routes/index.tsx:87 (`bg-primary/10 p-stack rounded-xl`).
- Ikon lain yang relevan: CheckCircle2 pada daftar tentang
  (src/routes/index.tsx:115,119,123), ikon per template dengan fallback
  Coffee (src/components/brief/template-picker.tsx:25,43).
- Logo: src/components/ui/icons.tsx:104-110 (LogoIcon = kotak
  rounded polos), dipakai src/components/Navbar.tsx:25-27 dan
  src/components/layout/footer.tsx:25.
- Screenshot: e2e/screenshots/phase5/landing-dark-desktop.png,
  e2e/screenshots/phase5/brief-dark-desktop.png.

Alasan disorot: keempat ikon langkah berasal dari satu pustaka
thin-stroke yang sama dan maknanya umum (tulis, globe, mata, unduh).
Relevansinya masih bisa dibela (mengisi, web, pratinjau, unduh), tetapi
tampilannya adalah set bawaan. Titik terang: ikon template-picker
dipilih per template (relevan), dan ikon status (Check, Alert) selalu
didampingi teks sehingga dekoratif.

Opsi A (minimal): ganti empat ikon langkah dengan glyph yang lebih
spesifik (misalnya ClipboardList, FileCode2, MonitorSmartphone,
FileDown) dan tulis relevansinya satu baris per ikon. Yang berubah:
hanya glyph, tanpa warna, radius, bayangan, salinan. Tes yang
diperbarui: tidak ada tes yang meng-assert ikon; ulangi text-sweep
(a11y name tidak berubah) dan axe. Risiko invarian: nol (ukuran ikon
w-5 h-5 tetap).

Opsi B (lebih berani): satu set motif SVG milik produk (misalnya ubin
ikon dengan sudut potong khas atau pasangan ikon-garis yang
digambar untuk langkah produk ini). Butuh arahan merek. Yang berubah:
tampilan ubin ikon, mungkin radius ubin. Tes: axe, text-sweep,
spacious. Risiko invarian: rendah selama ukuran ubin (p-stack) tetap.

## 3. Area R-08: panah pada tombol

Bukti:
- src/routes/index.tsx:65
  `<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />`
  pada satu-satunya CTA hero (src/routes/index.tsx:62).
- Tidak ada panah dekoratif lain pada tombol. Tautan kembali memakai
  `&larr;` tekstual (src/routes/login.tsx:168,
  src/routes/register.tsx:175). ArrowRightIcon
  (dulu src/components/ui/icons.tsx:68-75) tidak dipakai di UI
  (tidak ada hasil grep pemakaian) dan DIHAPUS pada Round 4 D6.
- Screenshot: e2e/screenshots/phase5/landing-dark-desktop.png.

Alasan disorot: aturan hanya melarang panah sebagai identitas bawaan
di hampir semua tombol. Di sini panah hanya ada satu, berukuran
proporsional (16px pada label 14px), dan berfungsi sebagai isyarat arah
pada aksi primer (lanjut ke aplikasi). Temuan ini P3: pertahankan
dengan alasan tertulis, atau cabut.

Opsi A (minimal): pertahankan, dan catat tujuannya di dokumen ini
(isyarat arah pada satu CTA primer). Yang berubah: tidak ada. Tes:
tidak ada. Risiko: nol.

Opsi B (lebih berani): cabut panah dan andalkan label
("Mulai buat website") saja. Yang berubah: tampilan CTA. Tes yang
diperbarui: text-sweep (tidak terpengaruh, ikon aria-hidden), axe
diulang. Risiko invarian: nol.

## 4. Area R-14: empat kartu langkah yang seragam

Bukti:
- Grid: src/routes/index.tsx:81
  (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-md`).
- Kartu: src/routes/index.tsx:83-97
  (`bg-card p-panel rounded-2xl border border-border`, hover
  `hover:border-primary/40 hover:shadow-md`).
- Screenshot: e2e/screenshots/phase5/landing-dark-desktop.png,
  e2e/screenshots/phase5/landing-light-mobile.png.

Alasan disorot: keempat kartu identik ukuran, ikon, padding, dan
layout, sementara bobot isinya beda (langkah 3 "Lihat dan revisi"
menjelaskan tiga buah fitur sekaligus). Keseragaman meratakan
hierarki. Catatan penyeimbang: tiap kartu punya hover state yang
berfungsi (bukan dekorasi mati).

Opsi A (minimal): perlakukan langkah 3 sebagai kartu unggulan
(misalnya bentang dua kolom di lg dengan daftar mini tiga sub-poin:
HP, tablet, komputer) dan tiga lainnya tetap. Yang berubah: layout
section cara-kerja; warna, radius, bayangan, salinan tetap (sub-poin
memakai ulang frasa salinan yang sudah disetujui; frasa baru = butuh
persetujuan salinan). Tes yang diperbarui: spacious-invariants
(tinggi landing berubah), responsive, axe dua tema. Risiko invarian:
baseline tinggi landing perlu direkam ulang atas persetujuan; token
spasi tidak boleh diganti angka lepas.

Opsi B (lebih berani): ganti grid dengan daftar baris bernomor
horizontal (nomor besar + teks, tanpa kartu) untuk langkah 1-4.
Yang berubah: layout dan penghapusan bayangan hover kartu. Tes:
spacious, responsive, axe, text-sweep. Risiko invarian: sama seperti
Opsi A, plus verifikasi ulang reflow mobile 360px (tidak boleh
overflow horizontal).

## 5. Area R-05: ritme section dan footer

Bukti:
- Tiga section dengan pola kepala sama (SectionHeader tengah +
  eyebrow badge): hero src/routes/index.tsx:48-69, cara-kerja
  src/routes/index.tsx:71-100, tentang src/routes/index.tsx:102-129.
- Komponen kepala: src/components/sections/section-header.tsx:22-32
  (tengah, max-w-2xl), eyebrow src/components/sections/section-header.tsx:29.
- Pemisah identik `border-b border-border/40` pada :48, :71, :102.
- Footer tiga kolom: src/components/layout/footer.tsx:13
  (border-t border-border bg-muted/50), grid :17-22, kolom sosial
  kondisional :65-83, baris hak cipta :88-90.
- Screenshot: e2e/screenshots/phase5/landing-dark-desktop.png
  (ritme), landing-dark-mobile.png (footer).

Alasan disorot: ketiga section tersusun dari komposisi yang sama
(judul tengah + subjudul + isi), variasinya hanya warna latar
selang-seling (pola "Alternating Background Only"). Footer tiga kolom
(Navigasi/Kontak + merek) adalah bentuk konvensional, tetapi isinya
jujur (kolom sosial hanya muncul bila ada tautan asli, tidak ada
kolom kosong).

Opsi A (minimal): variasikan satu section tanpa menambah section
(misalnya "Tentang" rata kiri dengan kartu ceklis tetap, atau hapus
satu garis pemisah). Yang berubah: alignment dan batas section;
warna, radius, salinan tetap. Tes: spacious (tinggi landing),
responsive, axe. Risiko invarian: baseline tinggi landing direkam
ulang atas persetujuan.

Opsi B (lebih berani): gabungkan "Cara Kerja" dan "Tentang" menjadi
satu alur naratif (langkah + hasil dalam satu section dua kolom:
kiri langkah, kanan kartu hasil). Yang berubah: layout besar;
kemungkinan butuh penyesuaian kata transisi (= salinan, LOCKED,
butuh persetujuan kata per kata). Tes: spacious, responsive, axe,
text-sweep, color-invariants. Risiko invarian: tinggi landing dan
baseline tinggi; reflow tablet (grid 2 kolom di sm) diverifikasi
ulang.

## 6. Area R-20: identitas visual

Bukti:
- Logo = kotak rounded outline generik (src/components/ui/icons.tsx:104-110),
  di dalam ubin primer (src/components/Navbar.tsx:25-27).
- Palet netral monokrom + warna status (token
  src/styles/index.css:230-245 terang, :251-266 gelap).
- Tipografi = stack sistem (src/styles/index.css:277), tanpa berkas font.
- Tidak ada motif berulang milik produk selain ubin primer rounded-xl.
- Screenshot: e2e/screenshots/phase5/landing-dark-desktop.png,
  e2e/screenshots/phase5/projects-dark-desktop.png,
  e2e/screenshots/phase5/workspace-dark-desktop.png.

Alasan disorot: uji tukar logo (apakah desain tetap terasa khas bila
nama produk diganti) saat ini gagal. Tidak ada palet khas, tidak ada
motif, typeface bawaan sistem tanpa alasan merek tertulis. Ini temuan
kejujuran, bukan vonis: tanpa DESIGN.md, menambahkan dekorasi justru
melanggar R-37.

Opsi A (minimal): kunci lockup yang konsisten tanpa mengarang identitas
(nama "Pakhir Studio" + ubin primer tetap, pastikan ukuran dan jarak
sama di navbar, footer, dan halaman auth). Yang berubah: hampir tidak
ada (penyelarasan). Tes: tidak ada. Risiko: nol. Ini bukan identitas
baru, hanya kerapian.

Opsi B (lebih berani): minta arahan merek (satu pertanyaan penentu
sesuai R-37), tulis DESIGN.md, lalu turunkan logo mark, satu aksen,
dan satu motif dari sana. Yang berubah: mengikuti arahan (bisa
menyentuh warna primer = LOCKED, butuh persetujuan). Tes: seluruh
suite (color-invariants dengan baseline baru atas persetujuan, axe
dua tema, spacious). Risiko invarian: dikelola lewat persetujuan
perubahan token.

## 7. Daftar temuan bernomor

Format: [nomor] [prioritas] (aturan) tag. Bukti: file:line + screenshot.

[F-01] [P2] (R-01) [NEEDS MY APPROVAL]
Semburat gradien hero tanpa tujuan tertulis.
Bukti: src/routes/index.tsx:48.
Screenshot: e2e/screenshots/phase5/landing-dark-desktop.png.
Lihat Opsi Area 1.

[F-02] [P2] (R-04) [NEEDS MY APPROVAL]
Empat ikon langkah adalah set bawaan satu pustaka (PenLine, Globe,
Eye, Download).
Bukti: src/routes/index.tsx:9,21,26,31,37.
Screenshot: e2e/screenshots/phase5/landing-dark-desktop.png.
Lihat Opsi Area 2.

[F-03] [P3] (R-08) [NEEDS MY APPROVAL]
Satu panah pada CTA hero; tujuannya (isyarat arah) belum tertulis di
repo. ArrowRightIcon (dulu src/components/ui/icons.tsx:68-75) tidak
terpakai di UI dan DIHAPUS pada Round 4 D6.
Bukti: src/routes/index.tsx:65.
Screenshot: e2e/screenshots/phase5/landing-dark-desktop.png.
Lihat Opsi Area 3. (Opsi B = pertahankan dengan alasan di dokumen ini,
tanpa perubahan kode.)

[F-04] [P2] (R-14) [NEEDS MY APPROVAL]
Empat kartu langkah seragam; langkah 3 memikul tiga fitur sekaligus.
Bukti: src/routes/index.tsx:81-97.
Screenshot: e2e/screenshots/phase5/landing-dark-desktop.png.
Lihat Opsi Area 4.

[F-05] [P2] (R-05) [NEEDS MY APPROVAL]
Tiga section berkomposisi identik (kepala tengah + isi), variasi
hanya selang-seling latar.
Bukti: src/routes/index.tsx:48,71,102;
src/components/sections/section-header.tsx:22-32.
Screenshot: e2e/screenshots/phase5/landing-dark-desktop.png.
Lihat Opsi Area 5.

[F-06] [P3] (R-05) [NEEDS MY APPROVAL]
Footer tiga kolom konvensional. Isinya jujur (tanpa kolom kosong),
jadi ini preferensi, bukan pelanggaran.
Bukti: src/components/layout/footer.tsx:13-22,65-90.
Screenshot: e2e/screenshots/phase5/landing-dark-mobile.png.
Lihat Opsi Area 5.

[F-07] [P2] (R-20, R-37) [NEEDS MY APPROVAL]
Tidak ada motif identitas; logo adalah kotak outline generik; tidak
ada DESIGN.md. Mengarang identitas tanpa arahan dilarang R-37.
Bukti: src/components/ui/icons.tsx:104-110;
src/components/Navbar.tsx:25-27.
Screenshot: e2e/screenshots/phase5/landing-dark-desktop.png.
Lihat Opsi Area 6. Catatan: perubahan bentuk mark = NEEDS APPROVAL;
pewarnaan ulang = LOCKED (warna).

[F-08] [P3] (R-21) [LOCKED]
Tema bawaan gelap tanpa alasan tertulis; sistem operasi tidak pernah
dibaca (tidak ada prefers-color-scheme di src/). Mengubah bawaan
menyentuh tema yang terkunci.
Bukti: src/main.tsx:6-8;
src/providers/theme-provider.tsx:8-15.
Screenshot: e2e/screenshots/phase5/landing-dark-desktop.png vs
e2e/screenshots/phase5/landing-light-desktop.png.
Keputusan ada di Bagian 8.

[F-09] [P1] (WCAG 1.4.11) [LOCKED]
Batas input/textarea/select 1.27:1 (terang) dan 1.34:1 (gelap)
terhadap latar sebelahnya; butuh 3:1. WAJIB (batas adalah satu-satunya
penanda kontrol; latar transparan). Kemungkinan gagal.
Bukti: src/components/ui/input.tsx:14;
src/components/ui/select.tsx:10;
src/components/ui/textarea.tsx:12.
Screenshot: e2e/screenshots/phase5/login-dark-desktop.png,
e2e/screenshots/phase5/brief-dark-desktop.png.
Perbaikan yang diusulkan (tanpa diterapkan) ada di Bagian 9.3.

[F-10] [P1] (WCAG 1.4.11) [LOCKED]
Batas opsi tak-terpilih 1.27:1 / 1.34:1. WAJIB (batas kartu/chip
adalah penanda kontrol). Kemungkinan gagal.
Bukti: src/components/brief/chip-group.tsx:51-58;
src/components/brief/radio-cards.tsx:51;
src/components/brief/segmented-control.tsx:54;
src/components/brief/section-toggles.tsx:50;
src/components/brief/color-picker.tsx:117,172;
src/components/brief/template-picker.tsx:35-39;
src/routes/_app/projects.index.tsx:171,202 (kartu project);
src/pages/Settings.tsx:69,106 (tombol berbingkai).
Screenshot: e2e/screenshots/phase5/brief-dark-desktop.png,
e2e/screenshots/phase5/projects-dark-desktop.png,
e2e/screenshots/phase5/settings-dark-desktop.png.
Perbaikan yang diusulkan (tanpa diterapkan) ada di Bagian 9.3.

[F-11] [P1] (WCAG 1.4.11) [LOCKED]
Lingkaran indikator radio tak-terpilih 1.27:1 / 1.34:1. WAJIB.
Kemungkinan gagal. Keadaan terpilih lulus (isian primer + ikon cek).
Bukti: src/components/brief/radio-cards.tsx:67-75;
src/components/brief/color-picker.tsx:131-139.
Screenshot: e2e/screenshots/phase5/brief-dark-desktop.png.
Perbaikan yang diusulkan (tanpa diterapkan) ada di Bagian 9.3.

[F-12] [P1] (WCAG 1.4.11) [LOCKED]
Rel toggle MATI 1.10:1 (terang) / 1.12:1 (gelap) terhadap kartu.
WAJIB. Kemungkinan gagal. Posisi kenop adalah isyarat non-warna yang
membantu, tetapi tepi kontrolnya sendiri di bawah ambang. Keadaan
MENYALA lulus (17.72 / 19.06).
Bukti: src/components/brief/section-toggles.tsx:58-71.
Screenshot: e2e/screenshots/phase5/brief-dark-desktop.png.
Perbaikan yang diusulkan (tanpa diterapkan) ada di Bagian 9.3.

[F-13] [P1] (R-25) [LOCKED]
Teks status workspace (emerald-600 di atas tint emerald-500/10)
3.43:1 pada tema terang; butuh 4.5:1 untuk teks normal. Axe tidak
menandai pasangan ini pada suite kami (hitungan tangan di Bagian 9).
Bukti: src/routes/_app/projects.$projectId.tsx:472.
Screenshot: e2e/screenshots/phase5/workspace-dark-desktop.png
(teksnya lulus di tema gelap 9.24:1; yang gagal hanya terang).
Kandidat perbaikan (tanpa diterapkan): teks emerald-700 di atas tint
yang sama = 4.99:1.

[F-14] [P1] (R-25) [LOCKED]
Teks kotak peringatan galat (destructive di atas tint
destructive/10) 4.13:1 pada tema terang; butuh 4.5:1. Axe tidak
menandai pasangan ini pada suite kami. Tema gelap lulus (4.90:1).
Bukti: src/routes/login.tsx:102; src/routes/register.tsx:100
(juga hover tombol bahaya src/pages/Settings.tsx:173 memakai
pasangan yang sama).
Screenshot: e2e/screenshots/phase5/login-dark-desktop.png.
Kandidat perbaikan (tanpa diterapkan): teks red-800 (#991b1b) di
atas tint yang sama = 7.11:1.

[F-15] [P2] (R-38) [LOCKED]
Kontak footer (dulu support@pakhirstudio.id, Jakarta, Indonesia)
belum terverifikasi sebagai data asli. Bila fiktif, ini klaim tak
terbukti; bila asli, cukup konfirmasi satu baris. Mengubahnya
menyentuh salinan yang terkunci.
Update Round 4 (D3): pemilik mengonfirmasi nilai baru (gmail dan
Purwokerto) dan memerintahkan penerapannya; temuan ini TERTUTUP
oleh commit Fase 3 Round 4. Kolom kontak selalu dirender (tidak
kondisional), jadi tidak ada slot kosong.
Bukti: src/config/site.ts:9-12.
Screenshot: e2e/screenshots/phase5/landing-dark-mobile.png.

[F-16] [P3] (R-06) [LOCKED]
Typeface = stack sistem tanpa alasan merek tertulis dan tanpa berkas
font. Bukan pelanggaran (sistem stack sah), tetapi R-06 meminta
alasan. Mengganti typeface menyentuh font yang terkunci.
Bukti: src/styles/index.css:277.
Screenshot: semua.

[F-17] [P3] (R-19) [NEEDS MY APPROVAL]
Animasi masuk fade-up 300ms pada hero dan dialog (plus fade-in
overlay), di luar dial MOTION 1 (hanya hover). Tujuannya (isyarat
muncul) wajar dan ada penanganan reduced-motion global
(src/styles/index.css:331-343), jadi ini preferensi. Menghapusnya
mengubah tampilan.
Bukti: src/styles/index.css:203-204;
dulu src/components/sections/hero.tsx:30 (komponen Hero tidak
dipakai di mana pun dan DIHAPUS pada Round 4 D6);
src/components/ui/modal.tsx:93,104.
Screenshot: tidak terlihat pada gambar diam.

[F-18] [P3] (R-09) [NEEDS MY APPROVAL]
Eyebrow badge di atas headline ("Cara Kerja", "Tentang") memakai
varian secondary dengan label asli, jadi berfungsi sebagai label
seksi, bukan ornamen duplikat. Pertahankan atau cabut (headline
sudah berkata sama). Mengubahnya mengubah tampilan.
Bukti: src/components/sections/section-header.tsx:29;
dipakai src/routes/index.tsx:73,104.
Screenshot: e2e/screenshots/phase5/landing-dark-desktop.png.

Tidak ada FREE TO FIX: setiap kandidat perbaikan di atas mengubah
tampilan (butuh persetujuan) atau menyentuh item terkunci (warna,
tema, font, salinan). Tidak ada temuan yang bisa dikerjakan tanpa
keputusan.

Yang sengaja TIDAK menjadi temuan (patuh, tercatat untuk kejujuran):
- Tanpa statistik palsu, tanpa testimoni, tanpa lencana kapsul AI,
  tanpa bilah logo, tanpa FAQ template (R-17, R-18, R-09, R-28).
- Kolom sosial footer kondisional, bukan slot kosong (R-38).
- Satu elemen kaca (navbar blur, src/components/Navbar.tsx:24) dalam
  batas dosis R-10; tanpa glow (R-13); bayangan hanya pada CTA dan
  hover kartu (R-12).
- Radius lima nilai sebagai sistem (6 tombol/input, 8/12 kartu,
  16 kartu besar, full chip/badge), bukan pil di semua elemen (R-11).
- Tautan auth bergaris bawah (src/routes/login.tsx:164), bukan
  mengandalkan warna saja.
- Layar aplikasi (daftar, brief, workspace, settings) dibangun dari
  keputusan pengguna di layar itu, tanpa stat-card/dis Dashboard
  bawaan; angka persen kelengkapan adalah data nyata terhitung.

## 8. Tema bawaan: bukti dan perbandingan

Bukti keadaan sekarang:
- Bawaan = gelap bila tidak ada simpanan: src/main.tsx:6-8
  (`stored === 'light' ? 'light' : 'dark'`) dan
  src/providers/theme-provider.tsx:8-15 (getInitialTheme).
- Tidak ada pembacaan preferensi OS: grep prefers-color-scheme di
  seluruh src/ tidak menghasilkan apa pun.
- Pilihan pengguna hanya dua nilai: src/providers/theme-context.ts:5
  (`type Theme = 'light' | 'dark'`), tanpa opsi 'system'.
- Toggle bekerja di navbar (src/components/Navbar.tsx:48-56) dan menu
  akun sidebar; kedua tema diverifikasi axe pada rute publik dan
  aplikasi (e2e/axe.spec.ts:19-23,79-91) dan pada brief
  (e2e/brief-a11y.spec.ts:32-36,85-86). Bukti visual kedua tema:
  e2e/screenshots/phase5/landing-dark-desktop.png vs
  e2e/screenshots/phase5/landing-light-desktop.png.

Perbandingan (tanpa klaim di luar bukti):
- "Gelap bawaan": konsisten dengan keadaan sekarang; nol perubahan.
  Alasan yang tercatat saat ini: tidak ada (itulah F-08).
- "Ikuti sistem / terang dulu": untuk audiens umum (pemilik usaha
  kecil, bukan perkakas developer), aplikasi konsumen umumnya
  menghormati default perangkat. Ini penalaran produk, bukan data:
  kami tidak memiliki data perangkat pengguna. Yang harus berubah:
  tambah opsi 'system' pada Theme, baca matchMedia saat tidak ada
  simpanan, dengarkan perubahannya, tulis ulang pre-hydration di
  main.tsx agar tidak kedip, dan putuskan fallback saat API tidak
  tersedia. Semua itu menyentuh tema yang terkunci.
- Keputusan: tetap gelap bawaan, atau ikuti sistem, atau terang dulu.
  Tanpa keputusan, tidak ada yang diubah.

## 9. Kerja kontras

Rumus yang dipakai (WCAG):
- Linearisasi tiap kanal sRGB: c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4
- Luminansi relatif: L = 0.2126*R + 0.7152*G + 0.0722*B
- Rasio: (L_terang + 0.05) / (L_gelap + 0.05)
- Warna bertint dihitung sebagai composite alpha di atas latar
  sebelahnya (misalnya bg-emerald-500/15 = 15% #10b981 di atas latar).
- Ambang teks: 4.5:1 (teks normal). Ambang non-teks (1.4.11): 3:1.
- Catatan penting: card == background di kedua tema (terang #ffffff,
  gelap #09090b), jadi ambiguitas "di atas kartu vs halaman" tidak
  berpengaruh kecuali panel tint yang dihitung eksplisit.

### 9.1 Pasangan teks (ambang 4.5:1)

TERANG:
- T1 body #18181b di #ffffff = 17.72 LULUS
- T2 petunjuk/nav #71717a di #ffffff = 4.83 LULUS
- T3 petunjuk di panel muted #71717a di #f4f4f5 = 4.40 GAGAL, tetapi
  hanya terjadi pada kontrol disabled (dikecualikan WCAG) dan hover
  sesaat di mana tinta berganti ke foreground. Tidak ada temuan aktif.
- T4 footer #71717a di #fafafa (bg-muted/50 composite) = 4.63 LULUS
- T5 petunjuk di kartu #52525b di #ffffff = 7.73 LULUS
- T6 petunjuk di muted/40 #52525b di #fbfbfb = 7.47 LULUS
- T7 placeholder #71717a di #ffffff = 4.83 LULUS (menyampaikan format;
  dinilai seperti teks karena bukan hiasan)
- T8 tautan garis bawah #18181b di #ffffff = 17.72 LULUS
- T10 label tombol utama #fafafa di #18181b = 16.97 LULUS
- T11 label tombol sekunder #18181b di #f4f4f5 = 16.12 LULUS
- T12 label tombol outline #18181b di #ffffff = 17.72 LULUS
- T13 label ghost saat hover #18181b di #f4f4f5 = 16.12 LULUS
- T14a badge default #fafafa di #18181b = 16.97 LULUS
- T14b badge eyebrow #18181b di #f4f4f5 = 16.12 LULUS
- T14c badge outline #18181b di #ffffff = 17.72 LULUS
- T15a badge success #047857 di #dbf4ec = 4.74 LULUS
- T15b badge warning #92400e di #fef0da = 6.31 LULUS
- T15c badge destructive #b91c1c di #fde3e3 = 5.32 LULUS
- T16 teks galat langsung #dc2626 di #ffffff = 4.83 LULUS
- T17 teks kotak galat #dc2626 di #fce9e9 = 4.13 GAGAL (F-14)
- T18 chip/segmen terpilih #fafafa di #18181b = 16.97 LULUS
- T20 chip terblokir #71717a di #f4f4f5 = 4.40, DISABLED dikecualikan,
  tanpa temuan
- T21 peringatan langsung #92400e di #ffffff = 7.09 LULUS
- T22 status amber #92400e di #fef5e7 = 6.56 LULUS
- T23a badge verifikasi #047857 di #ecfdf5 = 5.21 LULUS
- T23b teks emerald #047857 di #ffffff = 5.48 LULUS
- T24 status workspace #059669 di #e7f8f2 = 3.43 GAGAL (F-13)

GELAP (bawaan):
- T1 #fafafa di #09090b = 19.06 LULUS
- T2 #a1a1aa di #09090b = 7.76 LULUS
- T3 #a1a1aa di #18181b = 6.91 LULUS
- T4 #a1a1aa di #101013 = 7.41 LULUS
- T5 efektif #a1a1aa di #09090b = 7.76 LULUS (kelas zinc-600 selalu
  dioverride dark:text-muted-foreground; pasangan mentah 2.57 tidak
  pernah tampil)
- T6 efektif #a1a1aa di #0f0f11 = 7.47 LULUS (alasan sama)
- T7 placeholder #a1a1aa di #09090b = 7.76 LULUS
- T8 tautan #fafafa di #09090b = 19.06 LULUS
- T10 #09090b di #fafafa = 19.06 LULUS
- T11 #fafafa di #18181b = 16.97 LULUS
- T12 #fafafa di #09090b = 19.06 LULUS
- T13 #fafafa di #27272a = 14.27 LULUS
- T14a #09090b di #fafafa = 19.06 LULUS
- T14b #fafafa di #18181b = 16.97 LULUS
- T14c #fafafa di #09090b = 19.06 LULUS
- T15a #6ee7b7 di #0a231d = 10.84 LULUS
- T15b #fcd34d di #2c1f0b = 11.14 LULUS
- T15c #fca5a5 di #2c1214 = 9.19 LULUS
- T16 #ef4444 di #09090b = 5.29 LULUS
- T17 #ef4444 di #200f11 = 4.90 LULUS
- T18 #09090b di #fafafa = 19.06 LULUS
- T20 chip terblokir #71717a di #18181b = 3.67, DISABLED
  dikecualikan, tanpa temuan
- T21 peringatan memakai muted #a1a1aa di #09090b = 7.76 LULUS
- T24 status workspace #34d399 di #0a1b17 = 9.24 LULUS

Di bawah 4.5:1: T3-terang (hanya disabled/hover, dikecualikan),
T17-terang 4.13 (F-14), T20 dua tema (disabled, dikecualikan),
T24-terang 3.43 (F-13). Klaim "semua AAA" dari fase sebelumnya
dicabut dan diganti tabel ini.

### 9.2 Non-teks 1.4.11 (ambang 3:1)

WAJIB = batas yang mengidentifikasi kontrol tanpa isyarat lain.
TIDAK = dekoratif atau maknanya dibawa teks/ikon. Kontrol disabled
dikecualikan. Axe tidak menguji kriteria ini; status di bawah adalah
penilaian tangan ("kemungkinan gagal", "kemungkinan lulus", "perlu
penilaian"), bukan klaim berlebihan.

TERANG:
- N1 batas input/textarea/select #e4e4e7 di #ffffff = 1.27.
  WAJIB. Kemungkinan gagal. Isyarat lain: tidak ada (latar
  transparan). (F-09)
- N3 batas chip tak-terpilih, N4 batas kartu-radio/baris-toggle/
  kartu-project/tombol-berbingkai, N7 lingkaran radio tak-terpilih:
  1.27. WAJIB. Kemungkinan gagal. (F-10, F-11)
- N9 rel toggle MATI #f4f4f5 di #ffffff = 1.10. WAJIB. Kemungkinan
  gagal. Isyarat lain: posisi kenop (non-warna) membantu tetapi tepi
  kontrol tetap di bawah ambang. (F-12)
- N10 rel MENYALA #18181b = 17.72. WAJIB. Kemungkinan lulus.
- N12 cincin fokus #18181b lawan sela latar = 17.72. WAJIB.
  Kemungkinan lulus (juga memenuhi 2.4.11 dari sisi rasio).
- N14a batas terpilih (border-primary) = 17.72. WAJIB. Kemungkinan
  lulus (didukung isian dan ikon cek).
- N15 isian meter #18181b lawan rel #f4f4f5 = 16.12. WAJIB.
  Kemungkinan lulus (ada teks persen + aria).
- N16 batas kotak galat #f8d4d4 di #ffffff = 1.37. TIDAK WAJIB:
  kotak sekadar wadah, makna dibawa teks + ikon. Tanpa temuan.
- N17 batas kartu non-kontrol = 1.27. TIDAK WAJIB: dekoratif.
  Tanpa temuan.
- N18 status aktif sidebar: isian bg-primary/10 lawan kartu = 1.10
  (gagal bila dinilai sendiri). WAJIB. Perlu penilaian: perubahan
  tinta label (muted ke primer, teks aktif 14.46:1 di atas tint)
  adalah penanda keadaan yang kuat, tetapi isian tint-nya sendiri
  di bawah ambang. Tanpa nomor temuan; putuskan bersama F-10.
- N19 ubin ikon langkah (primer di atas tint primer/10) = 14.46.
  TIDAK WAJIB: ikon dekoratif, label di sebelahnya membawa makna.
  Tanpa temuan.
- N20 ikon galat error-state #dc2626 di #f4f4f5 = 4.39. TIDAK WAJIB
  sebagai teks (ini ikon, ambang 3:1 terpenuhi). Tanpa temuan.

GELAP: pola sama.
- N1/N3/N4/N7 #27272a di #09090b = 1.34. WAJIB. Kemungkinan gagal.
- N9 rel MATI #18181b di #09090b = 1.12. WAJIB. Kemungkinan gagal.
- N10 19.06, N12 19.06, N14a 19.06, N15 16.97. WAJIB. Kemungkinan
  lulus.
- N16 #371516 di #09090b = 1.21. TIDAK WAJIB (wadah).
- N17 1.34. TIDAK WAJIB (dekoratif).
- N18 teks aktif 15.40:1 di atas tint; isian tint 1.12. Perlu
  penilaian, seperti terang.
- N19 15.40. TIDAK WAJIB.
- N20 ikon #ef4444 di #18181b = 4.71. TIDAK WAJIB (ikon, lulus 3:1).

### 9.3 Usulan minimal (TIDAK diterapkan, butuh persetujuan)

Token baru `--border-control`, dipakai HANYA untuk batas kontrol
formulir, bukan semua border dekoratif (menggelapkan --border global
akan mewarnai ulang footer, divider, dan kartu: blast radius lebih
besar, jadi ditolak sebagai opsi minimal):
- Terang: #71717a. Di atas card/background = 4.83:1 (lulus 3:1).
- Gelap: #a1a1aa. Di atas card/background = 7.76:1 (lulus 3:1).

Sentuhan persisnya:
- src/components/ui/input.tsx:14, select.tsx:10, textarea.tsx:12:
  `border-input` menjadi `border-control` (perlu pemetaan
  --color-border-control di @theme).
- src/components/brief/chip-group.tsx:52,58; radio-cards.tsx:51,71;
  segmented-control.tsx:54; section-toggles.tsx:50;
  color-picker.tsx:117,135,172; template-picker.tsx:35,39;
  src/routes/_app/projects.index.tsx:171,202;
  src/pages/Settings.tsx:69,106.
- Rel toggle MATI (section-toggles.tsx:58-63): tambah border 1px
  border-control pada rel sehingga tepinya 4.83/7.76; kenop di atas
  rel (1.10/1.12) tetap "perlu penilaian" dengan isyarat posisi.
- Keadaan hover (hover:border-primary/50) tetap sebagai peningkatan
  sesaat, bukan penanda utama.

Catatan persetujuan: ini mengubah warna (batas menjadi abu tegas),
jadi LOCKED. Tidak diterapkan hingga diputuskan. Setelah diterapkan
(dengan persetujuan), pasangan N1/N3/N4/N7/N9-tepi menjadi lulus;
sisa: kenop-di-rel-mati (penilaian) dan N18 (penilaian).

### 9.4 Dua palet aksen kandidat (TIDAK diterapkan)

Berasal dari struktur token sekarang: hanya primer, primer-fg, dan
ring yang diganti; netral, muted, aksen, destructive, badge tidak
berubah. Semua pasangan teks axe tetap AA (angka di bawah).

V1 TELAGA (teal). Terang primer #0f766e, fg #ffffff. Gelap primer
#5eead4, fg #09090b.
- TERANG: label-di-primer 5.47, tautan-di-latar 5.47,
  cincin-di-latar 5.47, isian-meter lawan rel 4.98, rel-menyala 5.47.
  Semua lulus (teks >= 4.5, non-teks >= 3).
- GELAP: 13.45, 13.45, 13.45, 11.98, 13.45. Semua lulus.

V2 SENJA (biru). Terang primer #1d4ed8, fg #ffffff. Gelap primer
#93c5fd, fg #09090b.
- TERANG: 6.70, 6.70, 6.70, 6.10, 6.70. Semua lulus.
- GELAP: 11.03, 11.03, 11.03, 9.82, 9.82. Semua lulus.

Catatan: semburat hero (from-primary/5) ikut berganti hue; isian
terpilih bg-primary/5 tetap dapat diabaikan untuk teks (tinta tidak
berubah); hover alpha (primary/90 ke /40) tetap peningkatan sesaat.
Penerapan butuh persetujuan (warna primer = LOCKED) plus baseline
warna baru yang direkam ulang secara lokal (bukan di CI).

## 10. Bukti fase (untuk verifikasi)

- Perintah bukti: `git diff --stat -- src index.html` harus kosong
  untuk fase ini (hanya docs/ yang di-commit; screenshot gitignored).
- Suite yang relevan tetap hijau sebelum commit: npm run check
  (28 berkas / 327 tes), color-invariants (0 perbedaan gaya),
  text-sweep (23 lulus).
