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
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
