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
## Persyaratan Backend API (CORS & SSE)

Untuk mendukung frontend di produksi:
1. **CORS Headers**:
   - `Access-Control-Allow-Origin`: `https://domain-frontend.com`
   - `Access-Control-Allow-Methods`: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
   - `Access-Control-Allow-Headers`: `Content-Type, Authorization`
   - `Access-Control-Expose-Headers`: `Retry-After, Content-Disposition` (diperlukan agar frontend dapat membaca countdown 429 dan nama file ekspor)
2. **Reverse Proxy SSE (Nginx)** — wajib agar token SSE real-time:
   ```nginx
   location /api/ {
     proxy_pass http://127.0.0.1:8080;
     proxy_http_version 1.1;
     proxy_set_header Connection '';
     proxy_buffering off;
     proxy_set_header X-Accel-Buffering no;
     proxy_read_timeout 3600s;
     proxy_send_timeout 3600s;
     # JANGAN kompres event-stream (gzip merusak framing SSE).
     gzip off;
   }
   ```
   - `proxy_buffering off` + `X-Accel-Buffering no`: token diteruskan
     langsung ke browser tanpa tertahan buffer.
   - `proxy_http_version 1.1` + `Connection ''`: chunked streaming HTTP/1.1.
   - `proxy_read_timeout 3600s`: stream generate/revise hidup lama
     (default 60s memutus SSE di tengah jalan).
   - `gzip off` untuk `text/event-stream`: kompresi menahan/merusak
     batas event. (Kompresi gzip/brotli tetap boleh untuk aset statis
     di blok `server`, BUKAN untuk `/api/` SSE.)
   - Uji manual streaming: `curl -N http://127.0.0.1:8080/api/v1/...`
     (`-N` = `--no-buffer`, wajib agar chunk terlihat langsung).
3. **Konteks aman untuk clipboard ("Salin HTML")**:
   - `navigator.clipboard.writeText` HANYA tersedia di **secure context**
     (HTTPS atau `localhost`). Di HTTP IP polos tombol "Salin HTML"
     menampilkan pesan Indonesia
     "Gagal menyalin HTML ke clipboard. Silakan coba lagi atau salin
     secara manual." (bukan crash) — jadi pasang TLS (Let's Encrypt)
     bila akses via domain/IP publik.
3. **Mencegah Mixed Content**:
   - Bila frontend disajikan lewat HTTPS, backend API **wajib** menggunakan HTTPS (`https://api.domain.com`). Browser akan memblokir request fetch/SSE jika FE HTTPS menghubungi API HTTP.

## Variabel lingkungan build

| Variabel | Wajib | Contoh |
|---|---|---|
| `VITE_API_BASE_URL` | Ya (produksi) | `https://api.pakhirstudio.id` |
| `VITE_ERROR_ENDPOINT` | Tidak | URL webhook laporan error |
| `VITE_USE_MOCK` | Tidak (dev saja) | `true` |

> Platform hosting tetap belum diputuskan saat dokumen ini ditulis —
> panduan di atas generik; minta konfirmasi platform bila butuh
> langkah spesifik (DNS, TLS, CI deploy).

