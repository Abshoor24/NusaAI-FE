import { defineConfig, devices } from '@playwright/test';

/**
 * E2E configuration — Preview Progresif (browser sungguhan Chromium).
 * Memakai server mock SSE di 127.0.0.1:3457 dan halaman uji standalone
 * e2e/preview-test.html (mereplikasi perilaku PreviewFrame).
 *
 * Jalankan dengan:
 *   npx playwright test -c playwright.preview.config.ts e2e/preview-progressive.spec.ts --project=chromium --reporter=list
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3456',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node e2e/mock-server/sse-mock.mjs --port 3456',
    url: 'http://127.0.0.1:3456',
    reuseExistingServer: false,
    timeout: 30 * 1000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
