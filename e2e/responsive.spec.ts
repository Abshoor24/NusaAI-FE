import { test, expect } from '@playwright/test'
import { envelope, mockLogin, mockWorkspaceApi, versionHtml, type WorkspaceState } from './workspace-helpers'

/**
 * Uji responsif terukur: tanpa scroll horizontal, drawer mobile,
 * target sentuh tombol ikon >= 44px pada 360px.
 */

const VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
] as const

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
      return route.fulfill({
        json: envelope([
          {
            id: 'p1',
            title: 'Kedai Kopi',
            status: 'ready',
            brief: { description: 'Deskripsi project untuk pengujian.' },
            version_count: 1,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
        ]),
      })
    }
    return route.continue()
  })
}

for (const vp of VIEWPORTS) {
  test(`tidak ada scroll horizontal ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize(vp)
    await mockAppShell(page)
    for (const url of ['/', '/login', '/projects', '/projects/new', '/projects/p1', '/settings']) {
      await page.goto(url, { waitUntil: 'networkidle' })
      const overflow = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }))
      expect(overflow.scroll, `scroll horizontal di ${url}`).toBeLessThanOrEqual(overflow.client + 1)
      await page.screenshot({ path: `e2e/screenshots/${vp.width}-${url.replace(/\//g, '_')}.png` })
    }
  })
}

test('drawer sidebar mobile bisa dibuka dan ditutup', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await mockAppShell(page)
  await page.goto('/projects', { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: 'Buka menu' }).click()
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeVisible()

  // Tutup dengan Escape.
  await page.keyboard.press('Escape')
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeHidden({ timeout: 5000 })

  // Buka lagi, tutup via tombol Tutup di drawer.
  await page.getByRole('button', { name: 'Buka menu' }).click()
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeVisible()
  await page.getByRole('button', { name: 'Tutup menu' }).click()
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeHidden({ timeout: 5000 })

  // Buka lagi, tutup via backdrop (di kanan drawer w-72 = 288px).
  await page.getByRole('button', { name: 'Buka menu' }).click()
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeVisible()
  await page.mouse.click(340, 400)
  const nav = page.getByRole('navigation', { name: 'Navigasi utama' })
  await expect(nav).toBeHidden({ timeout: 5000 })
})

test('tombol ikon >= 44px pada 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await mockAppShell(page)
  await page.goto('/projects', { waitUntil: 'networkidle' })

  // Tombol ikon = button yang namanya hanya dari aria-label.
  const small: string[] = []
  for (const url of ['/', '/projects']) {
    await page.goto(url, { waitUntil: 'networkidle' })
    const buttons = page.locator('button[aria-label]')
    const count = await buttons.count()
    for (let i = 0; i < count; i++) {
      const el = buttons.nth(i)
      if (!(await el.isVisible())) continue
      const box = await el.boundingBox()
      const name = (await el.getAttribute('aria-label')) ?? `index-${i}`
      if (!box || box.width < 44 || box.height < 44) {
        small.push(`${url} "${name}": ${box ? `${Math.round(box.width)}x${Math.round(box.height)}` : 'tanpa box'}`)
      }
    }
  }
  expect(small, 'tombol ikon di bawah 44px').toEqual([])
})
