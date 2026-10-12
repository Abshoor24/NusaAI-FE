import { defineConfig, devices } from '@playwright/test'

/**
 * E2E Pakhir Studio. Frontend dev memakai server yang sudah berjalan
 * (`reuseExistingServer: true`); di CI, webServer dinyalakan otomatis.
 * Tes yang menyentuh AI dimock di level jaringan (lihat e2e/*.spec.ts)
 * agar tidak memakan kuota dan stabil.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  // CI memakai production build + vite preview (deterministik: tanpa
  // transform modul on-demand, menguji artefak yang benar-benar dikirim).
  // Lokal tetap npm run dev. Preview memakai dist/ dari langkah CI
  // sebelumnya (npm run check selalu build lebih dulu).
  webServer: process.env.CI
    ? {
        command: 'npm run preview -- --port 5173 --strictPort',
        url: 'http://localhost:5173',
        reuseExistingServer: false,
        timeout: 180_000,
        stdout: 'pipe',
        stderr: 'pipe',
      }
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 60_000,
      },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
