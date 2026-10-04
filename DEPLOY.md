# Panduan Deploy — Pakhir Studio (Frontend)

SPA (Vite build → file statis di `dist/`). Backend di-host terpisah;
atur `VITE_API_BASE_URL` saat build (lihat `.env.example`).

## Prasyarat build

```sh
npm ci
npm run check   # tsc + lint + unit test + build
```

Hasil: `dist/` — `index.html` + aset ber-hash di `dist/assets/`.

## Aturan serving

1. **SPA fallback**: semua path yang bukan file → `index.html`
   (routing TanStack di sisi klien; terutama `/login`, `/projects/*`).
2. **Cache**: aset `dist/assets/*` ber-hash → `Cache-Control: public,
   max-age=31536000, immutable`. `index.html` → `no-cache`
   (selalu revalidasi agar rilis baru langsung terambil).
3. **Kompresi**: aktifkan gzip/brotli (Nginx: `gzip_static` /
   `brotli_static`, atau kompresi dinamis).
4. **Header keamanan dasar** (untuk app shell):
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `frame-ancestors 'self'` (atau `X-Frame-Options: SAMEORIGIN`)
   - Catatan: JANGAN pasang CSP ketat — merusak preview website hasil
     generate (iframe `srcdoc` mewarisi CSP induk). Lihat
     `docs/csp-draft.md` untuk analisis lengkap.

## Contoh Nginx

```nginx
server {
  listen 80;
  server_name pakhir.example;
  root /var/www/pakhir-fe/dist;

  gzip on;
  gzip_types text/css application/javascript image/svg+xml;

  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;
  add_header X-Frame-Options SAMEORIGIN always;

  location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable" always;
  }

  location / {
    add_header Cache-Control "no-cache" always;
    try_files $uri $uri/ /index.html;
  }
}
```

## Contoh host statis (Netlify)

```toml
# netlify.toml
[build]
  command = "npm ci && npm run check"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "no-cache"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    X-Frame-Options = "SAMEORIGIN"
```

(Vercel setara via `vercel.json` `rewrites` + `headers`.)

## Catatan home server (kasus Anda)

- IP rumah dinamis → pakai DDNS (mis. DuckDNS/Cloudflare Tunnel)
  agar domain stabil; jika pakai Cloudflare Tunnel, TLS + fallback
  SPA bisa diatur dari dashboard tanpa membuka port.
- Jika expose langsung: buka port 80/443 di router (port forwarding),
  pasang Nginx seperti contoh di atas + TLS Let's Encrypt
  (`certbot --nginx`).
- Backend API harus bisa dijangkau browser pengunjung: set
  `VITE_API_BASE_URL` ke URL publik backend (bukan `localhost`),
  dan pastikan CORS backend mengizinkan origin frontend.
- Home server biasanya sleep/mati → pertimbangkan monitoring
  sederhana (uptime check) agar tahu saat down.

## Variabel lingkungan build

| Variabel | Wajib | Contoh |
|---|---|---|
| `VITE_API_BASE_URL` | Ya (produksi) | `https://api.pakhirstudio.id` |
| `VITE_ERROR_ENDPOINT` | Tidak | URL webhook laporan error |
| `VITE_USE_MOCK` | Tidak (dev saja) | `true` |

> Platform hosting tetap belum diputuskan saat dokumen ini ditulis —
> panduan di atas generik; minta konfirmasi platform bila butuh
> langkah spesifik (DNS, TLS, CI deploy).
