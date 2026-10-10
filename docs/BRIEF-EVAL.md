# Panduan Evaluasi Brief Website (Tahap 1 → Tahap 2)

Bahan ini untuk **penilaian manual oleh Anda** — TIDAK ada AI yang dipanggil.
Delapan contoh brief ada di `fixtures/brief-samples.ts`.

---

## 1. Cara memakai

1. Login ke aplikasi, buka `/projects/new`.
2. Isi brief secara manual **tanpa melihat** isi `fixtures/brief-samples.ts`,
   mengikuti tabel di bawah. Catat waktu yang dibutuhkan.
3. Simpan → masuk workspace dengan `?autostart=1` → generate.
4. Buka hasil di tab baru dan nilai memakai checklist (§3).
5. Ulangi langkah 2-4 memakai **form lama** (git stash / branch sebelum
   refactor) untuk 8 brief yang sama.
6. Isi tabel perbandingan (§5) dan tulis kesimpulan di §6.

Saran: gunakan `scripts/brief-contract-check.ts` lebih dulu untuk memastikan
payload 8 contoh diterima backend (HTTP 201) sebelum evaluates visual.

---

## 2. Delapan contoh brief

| # | id | Jenis usaha | Tujuan utama | Warna (utama/aksen) | Bagian |
|---|---|---|---|---|---|
| 1 | `kedai-kopi` | Makanan & minuman | Menerima pesanan | cokelat tua / krem | 11 |
| 2 | `jasa-foto` | Kreatif & desain | Menerima pesanan | biru laut / ungu muda | 10 |
| 3 | `toko-online-baju` | Toko online | Menerima pesanan | magenta / merah muda | 11 |
| 4 | `bimbel` | Pendidikan | Menerima reservasi | hijau daun / krem susu | 11 |
| 5 | `barbershop` | Jasa | Menerima reservasi | hitam / karamel | 10 |
| 6 | `katering` | Makanan & minuman | Menerima pesanan | merah / krem susu | 12 |
| 7 | `undangan-pernikahan` | Lainnya | Mengumpulkan kontak | biru dongker / emas | 8 |
| 8 | `portofolio-desainer` | Kreatif & desain | Memamerkan karya | hitam / abu-abu muda | 8 |

> Catatan: baris "Kontak" di `fixtures/brief-samples.ts` adalah sumber
> kebenaran; tabel ini hanya ringkasan.

---

## 3. Checklist penilaian manual (per hasil generate)

Centang **Ya / Sebagian / Tidak** untuk setiap butir. Kriteria "Sebagian"
berarti ada yang benar tapi ada yang meleset.

### A. Kesesuaian warna
- [ ] A1. Warna utama website mendekati warna yang dipilih (bukan kebalikan).
- [ ] A2. Warna aksen dipakai pada tombol ajakan / tautan penting.
- [ ] A3. Kombinasi warna tetap terbaca (teks gelap di atas terang atau sebaliknya).
- [ ] A4. Website tidak memakai warna tambahan yang bertabrakan dengan pilihan.

### B. Kelengkapan bagian
- [ ] B1. Semua bagian yang dinyalakan ada di hasil.
- [ ] B2. Bagian yang tidak dinyalakan benar-benar tidak muncul.
- [ ] B3. Urutan bagian mengikuti urutan katalog (pembuka di atas, penutup di bawah).
- [ ] B4. Tidak ada bagian asing yang tidak diminta (mis. blok login atau keranjang).

### C. Ketepatan info kontak
- [ ] C1. Nomor WhatsApp yang tampil persis sama dengan yang diisi.
- [ ] C2. Nomor telepon (bila diisi) tampil benar.
- [ ] C3. Email tampil benar.
- [ ] C4. Instagram menampilkan nama akun yang benar.
- [ ] C5. Jam buka tampil benar.
- [ ] C6. Alamat tampil lengkap.
- [ ] C7. **Tidak ada formulir kirim data** (pola "kirim" / `<form>` yang aktiv).
- [ ] C8. Tombol WhatsApp membuka aplikasi chat (bukan form).

### D. Kualitas teks bahasa Indonesia
- [ ] D1. Tidak ada kalimat terpotong atau tidak gramatikal.
- [ ] D2. Ejaan dan tanda baca benar (huruf kapital, koma).
- [ ] D3. Gaya bahasa sesuai jenis usaha (hangat untuk kafe, profesional untuk jasa).
- [ ] D4. Tidak ada istilah teknis yang tidak perlu ("CTA", "hero section", "mockup").
- [ ] D5. Tidak ada kalimat ajakan yang mengarah ke hal yang jelas tidak mungkin (mis. `Beli sekarang` pada jasa desain).
- [ ] D6. Bahasa Inggris tidak bocor ke dalam teks Indonesia (kecuali nama brand).

### E. Keterbacaan
- [ ] E1. Ukuran teks utama comfortable di layar HP.
- [ ] E2. Kontras teks terhadap latar memadai.
- [ ] E3. Tombol utama jelas berbeda dari teks biasa.
- [ ] E4. Tata letak rapi di layar sempit (tidak ada teks terpotong).

### F. Kesesuaian dengan tujuan
- [ ] F1. Tombol ajakan sesuai tujuan (contoh: tujuan "kumpulkan kontak" → tombol
      "Hubungi via WhatsApp", bukan "Beli sekarang").
- [ ] F2. Untuk usaha yang menerima pesanan, ada cara pesan yang jelas.
- [ ] F3. Untuk yang menerima reservasi, ada cara reservasi.
- [ ] F4. Untuk portofolio, karya lebih dominan daripada teks.

---

## 4. Data pendukung yang perlu dicatat

Per brief, catat:

| Metrik | Nilai |
|---|---|
| Waktu mengisi form (menit) | |
| Jumlah field yang diisi manual | |
| Jumlah field yang terisi dari template | |
| Waktu sampai generate selesai (detik) | |
| Jumlah versi yang perlu direvisi | |
| Catatan bebas | |

---

## 5. Tabel perbandingan "form lama" vs "form baru"

Isi untuk SETIAP delapan brief.

| Metrik | Form lama | Form baru | Selisih / catatan |
|---|---|---|---|
| Rata-rata waktu isi form | | | |
| Rata-rata jumlah revisi | | | |
| Rata-rata kepatuhan A (warna) | | | |
| Rata-rata kepatuhan B (kelengkapan bagian) | | | |
| Rata-rata kepatuhan C (info kontak) | | | |
| Rata-rata kepatuhan D (teks Indonesia) | | | |
| Rata-rata kepatuhan E (keterbacaan) | | | |
| Rata-rata kepatuhan F (sesuai tujuan) | | | |
| Jumlah brief yang menghasilkan website "cukup dipakai apa adanya" | | | |

Perhitungan: "Ya" = 1, "Sebagian" = 0,5, "Tidak" = 0. Rata-rata per
bagian = jumlah poin / jumlah butir.

---

## 6. Sinyal keputusan lanjut ke Tahap 2

Centang yang terpenuhi:

- [ ] **S1. Hasil jelas lebih baik.** Untuk mayoritas brief, form baru menghasilkan
      website yang lebih baik pada minimal 3 dari 6 kategori penilaian (A-F).
- [ ] **S2. User ingin mengedit brief lama.** Ada permintaan eksplisit untuk
      mengubah/menambah brief yang sudah dibuat (bukan membuat baru).
- [ ] **S3. Deskripsi sering mendekati 4000 karakter.** Pada >= 3 dari 8 brief,
      panjang deskripsi berada di rentang 3000-4000 dan baris tambahan perlu
      dipangkas (`trimmed = true`).

### Keputusan

| Sinyal | Terpenuhi? | Catatan |
|---|---|---|
| S1 | | |
| S2 | | |
| S3 | | |

**Rekomendasi tahap 2** (pilih salah satu, isi alasannya):

- [ ] Lanjut Tahap 2 (kolom brief jsonb di server).
- [ ] Lanjut Tahap 2 sebagian (mis. hanya kolom `brief` structured, tanpa
      prompt AI yang diubah).
- [ ] Tidak lanjut; enough di frontend.

---

## 7. Yang perlu diuji manual di HP sungguhan

Tidak bisa dibuktikan di Playwright (viewport desktop):

1. **Target sentuh** — ketuk chip gaya, toggle bagian, tombol palet warna.
   Apakah ukurannya terasa pas di jari?
2. **Bilah sticky** saat keyboard HP terbuka — apakah tombol "Simpan & Buatkan
   Website" masih terlihat?
3. **Pemilih warna** `<input type="color">` — buka dialog warna bawaan OS.
   Apakah bisa memilih warna dengan benar? (Android dan iOS berbeda.)
4. **Gulir panjang** — apakah accordion terasa lambat saat dibuka di HP kelas bawah?
5. **Kembali dari halaman** — apakah draf di sessionStorage pulih setelah
   app ditutup dan dibuka lagi di tab yang sama?
6. **Mode privat / storage penuh** — apakah form tetap bisa diisi (tidak crash)?
7. **Tautan WhatsApp di preview** — ketuk tombol WhatsApp di dalam iframe
   pratinjau. Apakah membuka WhatsApp? (Lihat hasil 5.5 di laporan — ini
   perilaku sandbox, bukan bug frontend.)