/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL backend (kanonis). Contoh: http://localhost:8080 */
  readonly VITE_API_BASE_URL?: string
  /** Nama lama; tetap didukung sebagai fallback. */
  readonly VITE_API_URL?: string
  /** "true" untuk memakai mock tanpa backend (dev saja, tidak ikut produksi). */
  readonly VITE_USE_MOCK?: string
  /** Skenario mock (ok, pre502, err-*, no-terminal, conflict-*, ratelimit). Lihat .env.example. */
  readonly VITE_MOCK_SCENARIO?: string
  /**
   * URL webhook penerima laporan error (opsional, nonaktif bila kosong).
   * Payload minimal dan tidak memuat token/HTML (lihat src/lib/error-report.ts).
   */
  readonly VITE_ERROR_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}