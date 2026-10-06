import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { envelope, mockLogin, mockWorkspaceApi, versionHtml, type WorkspaceState } from './workspace-helpers'

/**
 * Aksesibilitas form brief /projects/new:
 * - semua kelompok accordion terbuka (bukan hanya keadaan awal),
 * - dalam keadaan ada error validasi,
 * - tema gelap dan terang,
 * - target nol pelanggaran serious/critical (termasuk kontras).
 */

const BRIEF_ROUTE = '/projects/new'
const GROUPS = ['Tentang usahamu', 'Tampilan', 'Isi halaman', 'Kontak & tombol utama', 'Gambar referensi']

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
    if (route.request().method() === 'GET') return route.fulfill({ json: envelope([]) })
    return route.continue()
  })
}

async function gotoBrief(page: import('@playwright/test').Page, theme: 'light' | 'dark'): Promise<void> {
  await mockAppShell(page)
  await page.addInitScript((t) => {
    window.localStorage.setItem('theme', t)
  }, theme)
  await page.goto(BRIEF_ROUTE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
}

/** Buka SEMUA kelompok accordion + <details> lanjutan agar ikut dipindai. */
async function openAllGroups(page: import('@playwright/test').Page): Promise<void> {
  for (const title of GROUPS) {
    const btn = page.getByRole('button', { name: new RegExp(title) }).first()
    await expect(btn).toBeVisible({ timeout: 15000 })
    if ((await btn.getAttribute('aria-expanded')) !== 'true') await btn.click()
    await expect(btn).toHaveAttribute('aria-expanded', 'true', { timeout: 15000 })
  }
  // Tunggu chunk lazy selesai, lalu buka <details> lanjutan.
  await page.waitForTimeout(600)
  for (const details of await page.locator('details').all()) {
    const open = await details.evaluate((el) => (el as HTMLDetailsElement).open)
    if (!open) await details.locator('summary').click()
  }
  await page.waitForTimeout(400)
}

/** Isi form dengan nilai bermasalah agar error validasi muncul di beberapa field. */
async function fillWithValidationErrors(page: import('@playwright/test').Page): Promise<void> {
  await page.getByLabel('Deskripsi Website').fill('pendek')
  await page.getByLabel('Nomor WhatsApp').fill('0812')
  await page.getByLabel('Email').fill('bukan-email')
  await page.getByLabel('Tautan Google Maps').fill('maps.google.com')
  await page.getByLabel('Alamat').fill('a'.repeat(250))
  await page.getByLabel('Jam buka').fill('j'.repeat(150))
  await page.getByLabel('Siapa yang akan datang?').fill('a'.repeat(250))
  await page.getByRole('button', { name: 'Simpan & Buatkan Website' }).click()
  await expect(page.getByRole('alert').first()).toBeVisible()
  await page.waitForTimeout(300)
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

for (const theme of ['light', 'dark'] as const) {
  test(`axe ${theme}: brief semua kelompok terbuka`, async ({ page }) => {
    await gotoBrief(page, theme)
    await openAllGroups(page)
    await expectNoSeriousViolations(page, `${theme} brief terbuka`)
  })

  test(`axe ${theme}: brief dalam keadaan error validasi`, async ({ page }) => {
    await gotoBrief(page, theme)
    await openAllGroups(page)
    await fillWithValidationErrors(page)
    await expectNoSeriousViolations(page, `${theme} brief error`)
  })
}

test('accordion: aria-expended berubah dan fokus tidak hilang', async ({ page }) => {
  await gotoBrief(page, 'dark')
  const first = page.getByRole('button', { name: /Tentang usahamu/ })
  await expect(first).toHaveAttribute('aria-expanded', 'true')

  // Buka kelompok kedua dengan keyboard, fokus harus tetap di tombol.
  const second = page.getByRole('button', { name: /2\. Tampilan/ })
  await second.focus()
  await page.keyboard.press('Enter')
  await expect(second).toHaveAttribute('aria-expanded', 'true')
  const focusedName = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')
  expect(focusedName).toContain('2. Tampilan')

  // Tutup lagi: panel disembunyikan, tombol tetap terfokus.
  await page.keyboard.press('Enter')
  await expect(second).toHaveAttribute('aria-expanded', 'false')
  const stillFocused = await page.evaluate(
    () => document.activeElement?.textContent?.trim() ?? '',
  )
  expect(stillFocused).toContain('2. Tampilan')
})

test('prefers-reduced-motion mematikan transisi accordion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await gotoBrief(page, 'light')
  const btn = page.getByRole('button', { name: /2\. Tampilan/ })
  const durations = await btn.evaluate((el) => {
    const cs = getComputedStyle(el)
    return {
      transition: Number.parseFloat(cs.transitionDuration || '0'),
      animation: Number.parseFloat(cs.animationDuration || '0'),
    }
  })
  expect(durations.transition).toBeLessThan(0.1)
  expect(durations.animation).toBeLessThan(0.1)

  // Ikon chevron ikut kehilangan rotasi animasinya.
  const chevron = btn.locator('svg')
  const transform = await chevron.evaluate((el) => getComputedStyle(el).transitionDuration)
  expect(Number.parseFloat(transform || '0')).toBeLessThan(0.1)
})