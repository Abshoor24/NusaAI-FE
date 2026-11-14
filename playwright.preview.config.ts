import { defineConfig, devices } from '@playwright/test'

/**
 * E2E configuration — Preview Progresif (browser sungguhan Chromium).
 *
 * Jalankan lewat `node e2e/run-preview-e2e.mjs`. Runner itu memilih port
 * bebas, menyalakan Vite + mock SSE, lalu meneruskan URL-nya lewat env.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/preview-real.spec.ts',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PREVIEW_BASE_URL ?? 'http://127.0.0.1:4331',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
