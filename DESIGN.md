# DESIGN.md: Daftar Project (/projects), monokrom

- Tema: satu mode ikut token proyek (light/dark). Netral saja:
  putih `#ffffff`, tinta `#18181b`, abu `#f4f4f5 #e4e4e7 #71717a`.
- Pengecualian: badge status dan pesan error/sukses memakai varian
  semantik yang sudah ada (fungsional, disetujui pemilik).
- Tipografi: sans bawaan proyek. H1 `text-title` tebal rapat,
  judul kartu semibold `line-clamp-2`, meta `text-hint` redup.
- Spasi: token proyek (`py-page`, `mb-header`, `gap-stack`,
  `p-panel`). Header lega, isi kartu rapat, antar-kartu sedang.
- Bentuk: kartu `rounded-2xl` border hairline, thumbnail di dalam
  dengan `rounded-t-2xl`, tombol pil hanya untuk CTA primer,
  ikon 44px dengan tooltip saat sidebar ciut.
- Motif identitas: garis kontur topografi sebagai latar paling
  belakang seluruh halaman aplikasi, plus thumbnail inisial di
  kartu. Statis, `aria-hidden`, tanpa animasi loop.
- Motion: transisi warna 200ms saja. Hormati reduced-motion global.
- Nada copy: Bahasa Indonesia, langsung, tanpa klaim tanpa data.
- Dial: ENERGY 2 / RHYTHM 2 / MOTION 1.
- Design Read: halaman daftar project untuk pemilik usaha
  Indonesia, bahasa visual monokrom tenang berkontras inversi.
