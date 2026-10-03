/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL backend (kanonis). Contoh: http://localhost:8080 */
  readonly VITE_API_BASE_URL?: string
  /** Nama lama; tetap didukung sebagai fallback. */
  readonly VITE_API_URL?: string
  /** "true" untuk memakai mock tanpa backend (dev saja, tidak ikut produksi). */
  readonly VITE_USE_MOCK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}