import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {
  envelope,
  mockLogin,
  mockWorkspaceApi,
  versionHtml,
  type WorkspaceState,
} from './workspace-helpers'

/**
 * Pindaian aksesibilitas axe untuk semua rute utama, mode gelap dan terang.
 * Target: nol pelanggaran serius/kritis.
 */

async function gotoWithTheme(
  page: import('@playwright/test').Page,
  url: string,
  theme: 'light' | 'dark',
): Promise<void> {
  await page.addInitScript((t) => {
    window.localStorage.setItem('theme', t)
  }, theme)
  // networkidle (bukan timeout tetap) agar chunk lazy selesai sebelum dipindai.
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
}

async function expectNoSeriousViolations(
  page: import('@playwright/test').Page,
  label: string,
): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze()
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  if (serious.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`[axe:${label}]`, JSON.stringify(serious, null, 2).slice(0, 3000))
  }
  expect(serious, `pelanggaran serius/kritis di ${label}`).toEqual([])
}

async function mockAppShell(page: import('@playwright/test').Page): Promise<void> {
  await mockLogin(page)
  const state: WorkspaceState = {
    status: 'ready',
    title: 'Kedai Kopi',
    versions: [
      { id: 'v1', version_number: 1, kind: 'generate', prompt: 'brief', html: versionHtml(1) },
    ],
  }
  await mockWorkspaceApi(page, 'p1', state)
  await page.route('**/api/v1/projects?*', (route) => {
    if (route.request().method() === 'GET') {
      // Sertakan semua varian badge agar color-contrast teruji semua.
      const item = (id: string, title: string, status: string) => ({
        id,
        title,
        status,
        brief: { description: 'Deskripsi project untuk pengujian.' },
        version_count: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      })
      return route.fulfill({
        json: envelope([
          item('p1', 'Kedai Kopi', 'ready'),
          item('p2', 'Toko Roti', 'generating'),
          item('p3', 'Kafe Aroma', 'failed'),
        ]),
      })
    }
    return route.continue()
  })
}

const PUBLIC_ROUTES = ['/', '/login', '/register']
const APP_ROUTES = ['/projects', '/projects/new', '/projects/p1', '/settings', '/tidak-ada']

for (const theme of ['light', 'dark'] as const) {
  test(`axe ${theme}: rute publik`, async ({ page }) => {
    for (const url of PUBLIC_ROUTES) {
      await gotoWithTheme(page, url, theme)
      await expectNoSeriousViolations(page, `${theme} ${url}`)
    }
  })

  test(`axe ${theme}: rute aplikasi + 404`, async ({ page }) => {
    await mockAppShell(page)
    for (const url of APP_ROUTES) {
      await gotoWithTheme(page, url, theme)
      await expectNoSeriousViolations(page, `${theme} ${url}`)
    }
  })
}
