import { defineConfig, devices } from '@playwright/test'

/**
 * E2E configuration — Preview Progresif (browser sungguhan Chromium).
 *
 * Server dijalankan secara manual sebelum menjalankan Playwright:
 *   - Vite pada port 4330 (menyajikan e2e/harness.html)
 *   - SSE mock pada port 4328
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/preview-real.spec.ts',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4331',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
