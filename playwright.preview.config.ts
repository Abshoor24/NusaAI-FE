import { defineConfig, devices } from '@playwright/test'

/**
 * E2E configuration — Preview Progresif (browser sungguhan Chromium).
 *
 * Verifikasi komponen PreviewFrame asli + sanitizeStreamingHtml asli melalui
 * halaman harness yang disajikan Vite (e2e/harness.html) dengan mock SSE di
 * port 4328. Tidak ada replika harness — komponen asli yang diuji.
 *
 * Jalankan dengan:
 *   npx playwright test -c playwright.preview.config.ts --reporter=list
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/preview-real.spec.ts',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4327',
    trace: 'on-first-retry',
  },
  globalSetup: './e2e/global-setup.ts',
  webServer: [
    {
      command: 'node e2e/mock-server/sse-mock.mjs --port 4328',
      url: 'http://127.0.0.1:4328/full_run1.html',
      reuseExistingServer: false,
      timeout: 30 * 1000,
    },
    {
      command: 'npx vite --port 4327 --strictPort',
      url: 'http://127.0.0.1:4327/e2e/harness.html?mode=after&sseUrl=http%3A%2F%2F127.0.0.1%3A4328%2Fsse',
      reuseExistingServer: false,
      timeout: 60 * 1000,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
