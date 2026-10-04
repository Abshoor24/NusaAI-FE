# Draf Content-Security-Policy — Pakhir Studio (BELUM diterapkan)

> Status: draf dokumentasi. JANGAN pasang CSP di bawah ke app shell
> sebelum membaca bagian "Trade-off" — CSP dokumen induk DIWARISI
> iframe `srcdoc` preview (spesifikasi HTML), sehingga CSP ketat
> merusak website hasil generate yang memakai font/gambar/skrip CDN.

## Bukti yang diukur

- `e2e/preview-cdn.spec.ts` (lolos): preview berisi stylesheet jsDelivr +
  Google Fonts, skrip axios dari CDN (berjalan), dan gambar remote —
  semuanya tampil/berjalan TANPA CSP di app shell.
- `e2e/workspace-export.spec.ts` (lolos): skrip di dalam preview TIDAK
  bisa membaca `window.parent.localStorage` / `document.cookie` induk
  (sandbox `allow-scripts allow-popups` tanpa `allow-same-origin`).
  Isolasi sudah dicapai tanpa CSP.

## Mengapa CSP ketat merusak preview

Contoh website hasil AI yang wajar memakai:

- `https://fonts.googleapis.com` + `https://fonts.gstatic.com` (font),
- CDN skrip/gaya (mis. `https://cdn.jsdelivr.net`),
- gambar remote (`https:` / `data:`).

`default-src 'self'` atau `script-src 'self'` pada app shell akan
diblokir di dalam preview karena diwarisi. Pengecualian per-CDN
(`script-src cdn.jsdelivr.net`, dst.) rapuh: tiap sumber baru yang
dipakai AI harus didaftarkan manual — mustahil dijaga.

## Draf header (referensi saja, JANGAN dipakai langsung)

```text
# App shell SAAT INI: tanpa CSP (disengaja, agar preview bebas).
# Jika suatu hari preview dipindah ke origin terpisah, contoh ketat:
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  connect-src 'self' https://<host-backend>;
  frame-ancestors 'self';
```

## Jalan keluar yang benar (bukan di putaran ini)

1. Pindahkan render preview ke origin terpisah (mis. subdomain khusus
   tanpa kredensial) — baru CSP ketat aman untuk app shell.
2. Sampai saat itu: andalkan sandbox iframe + validasi upload, tanpa CSP.

## Keputusan

- [x] Preview CDN-heavy diuji dan lolos (`preview-cdn.spec.ts`).
- [ ] CSP TIDAK diterapkan pada app shell (trade-off di atas).
