import { test, expect } from '@playwright/test'
import {
  mockLogin,
  mockWorkspaceApi,
  versionHtml,
  type WorkspaceState,
} from './workspace-helpers'

/**
 * Unduh HTML (nama file non-ASCII via filename*) dan isolasi preview.
 */

async function gotoReadyWorkspace(
  page: import('@playwright/test').Page,
  html: string,
): Promise<void> {
  await mockLogin(page)
  const state: WorkspaceState = {
    status: 'ready',
    title: 'Kedai Kopi',
    versions: [{ id: 'v1', version_number: 1, kind: 'generate', prompt: 'brief', html }],
  }
  await mockWorkspaceApi(page, 'p1', state)
  await page.goto('/projects/p1')
  await expect(page.getByText('Siap').first()).toBeVisible({ timeout: 10000 })
}

test('unduh HTML memakai filename* dan nama tersanitasi', async ({ page }) => {
  await gotoReadyWorkspace(page, versionHtml(1))
  await page.route('**/api/v1/projects/p1/export*', (route) =>
    route.fulfill({
      contentType: 'text/html',
      headers: {
        // Judul non-ASCII + karakter khusus; & dan spasi legal, sisanya dibuang.
        'Content-Disposition':
          "attachment; filename*=UTF-8''Kedai%20Kopi%20Ibu%20Sri%20%26%20Anak%3A%20%22Spesial%22-v1.html",
        'Access-Control-Expose-Headers': 'Content-Disposition',
      },
      body: '<html><body><h1>Halo</h1></body></html>',
    }),
  )

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Unduh' }).first().click(),
  ])
  expect(download.suggestedFilename()).toBe('Kedai Kopi Ibu Sri & Anak Spesial-v1.html')
})

test('skrip di preview tidak bisa menyentuh origin aplikasi', async ({ page }) => {
  const probeHtml = `<html><body><script>
    var hasil = [];
    try { void window.parent.localStorage; hasil.push('localStorage: TERBUKA'); }
    catch (e) { hasil.push('localStorage: ' + e.name); }
    try { void window.parent.document.cookie; hasil.push('cookie: TERBUKA'); }
    catch (e) { hasil.push('cookie: ' + e.name); }
    document.body.textContent = hasil.join(' | ');
  </script></body></html>`
  await gotoReadyWorkspace(page, probeHtml)

  // Playwright membaca DOM iframe via CDP (tidak terpengaruh sandbox).
  const body = page.frameLocator('iframe').locator('body')
  await expect(body).toContainText('localStorage: SecurityError', { timeout: 10000 })
  await expect(body).toContainText('cookie: SecurityError')
  await expect(body).not.toContainText('TERBUKA')
})
