import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // autoCodeSplitting: tiap route jadi chunk terpisah (workspace yang
    // berat dimuat lazy, tidak menumpuk di bundle awal).
    TanStackRouterVite({ autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    // Hanya aktif bila ANALYZE=true (treemap HTML) atau ANALYZE=json
    // (data mentah untuk analisis), agar build normal tidak melambat.
    ...(process.env.ANALYZE === 'true'
      ? [visualizer({ filename: 'dist/stats.html', gzipSize: true })]
      : []),
    ...(process.env.ANALYZE === 'json'
      ? [visualizer({ filename: 'dist/stats.json', template: 'raw-data', gzipSize: true })]
      : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Spek Playwright (e2e/) dijalankan via `npm run test:e2e`, bukan vitest.
    exclude: ['node_modules', 'dist', 'e2e/**'],
    // File DOM memakai pragma `// @vitest-environment jsdom` per file
    // (environmentMatchGlobs belum ada di vitest 5.0.x yang terpasang).
    setupFiles: ['./src/test-setup.ts'],
  },
})