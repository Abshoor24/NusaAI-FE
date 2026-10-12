import { test, expect } from '@playwright/test'
import { envelope, mockLogin, mockWorkspaceApi, versionHtml, type WorkspaceState } from './workspace-helpers'
import {
  colorTokens,
  compositeOver,
  hexTriple,
  parseColor,
  ratioOf,
  resolveTriple,
  toRgbTriple,
  type Rgb,
} from './color-math'

/**
 * Token kontras hasil keputusan D1/D2 (Fase 2 Round 4).
 *
 * Meng-assert WARNA TERHITUNG (bukan nama kelas) pada kontrol yang
 * disetujui, di kedua tema:
 * - border kontrol formulir = triple --border-control
 *   (terang #71717a, gelap #a1a1aa)
 * - rasio teks kotak galat D1 >= 4.5 (red-700 terang,
 *   dark:text-destructive gelap tetap)
 * - rasio teks status workspace D1 >= 4.5 (emerald-700 terang,
 *   dark:text-emerald-400 gelap tetap)
 * Triple dibanding toleransi 2/kanal; rasio dihitung dari warna
 * ter-render (oklch/oklab dinormalisasi ke sRGB, tint dikomposit).
 *
 * Semua endpoint di-mock; tidak ada panggilan backend sungguhan.
 */

const BORDER = { light: '#71717a', dark: '#a1a1aa' }


/**
 * Assert warna terhitung (toleransi 2 per kanal untuk pembulatan).
 * property 'ring' membaca box-shadow (rel toggle MATI memakai ring-1).
 * Border dibanding triple token (token kami hex, lewat apa adanya).
 */
async function expectComputed(
  locator: import('@playwright/test').Locator,
  property: 'borderColor' | 'ring',
  expectedHex: string,
  label: string,
): Promise<void> {
  const serialized = await locator.evaluate((el, prop: string) => {
    if (prop === 'ring') return getComputedStyle(el).boxShadow
    return getComputedStyle(el).borderColor
  }, property)
  const got = toRgbTriple(serialized)
  const want = hexTriple(expectedHex)
  const close = got.every((v, i) => Math.abs(v - want[i]) <= 2)
  expect(close, `${label}: dapat ${serialized} (${got}), harap ${expectedHex} (${want})`).toBe(true)
}

/**
 * Assert rasio kontras teks >= 4.5 dari warna ter-render.
 * Latar ber-alpha (tint Tailwind) dikomposit di atas latar opak
 * terdekat, seperti yang dilihat pengguna.
 */
async function expectTextContrast(
  locator: import('@playwright/test').Locator,
  label: string,
): Promise<void> {
  const [fgRaw, bgRaw, backdropRaw] = await locator.evaluate((el) => {
    const cs = getComputedStyle(el)
    let backdrop = 'rgb(255, 255, 255)'
    let node = el.parentElement
    while (node) {
      const b = getComputedStyle(node).backgroundColor
      const toks = b.match(/(?:rgba?\([^)]+\)|oklch?\([^)]+\)|oklab\([^)]+\))/g) ?? []
      const opaque = toks.some((t) => !/,\s*0\s*\)$/.test(t) && !/\/\s*0\s*\)$/.test(t))
      if (opaque) {
        backdrop = b
        break
      }
      node = node.parentElement
    }
    return [cs.color, cs.backgroundColor, backdrop]
  })
  const fg = toRgbTriple(fgRaw)
  const bgTok = colorTokens(bgRaw)[0]
  const bgParsed = parseColor(bgTok) as Rgba & { lab?: [number, number, number] }
  const bgTriple = resolveTriple(bgParsed)
  const finalBg =
    bgParsed.alpha >= 1 ? bgTriple : compositeOver(bgTriple, bgParsed.alpha, toRgbTriple(backdropRaw))
  const r = ratioOf(fg, finalBg)
  expect(r, `${label}: rasio ${r.toFixed(2)} (teks ${fgRaw} di ${bgRaw})`).toBeGreaterThanOrEqual(4.5)
}

type Theme = 'light' | 'dark'

async function gotoThemed(
  page: import('@playwright/test').Page,
  path: string,
  theme: Theme,
): Promise<void> {
  await page.addInitScript((t) => {
    window.localStorage.setItem('theme', t)
  }, theme)
  await page.goto(path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
}

async function mockBriefShell(page: import('@playwright/test').Page): Promise<void> {
  await mockLogin(page)
  await page.route('**/api/v1/projects?*', (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    return route.fulfill({ json: envelope([]) })
  })
}

async function mockWorkspace(page: import('@playwright/test').Page): Promise<void> {
  await mockLogin(page)
  const state: WorkspaceState = {
    status: 'ready',
    title: 'Kedai Kopi',
    versions: [{ id: 'v1', version_number: 1, kind: 'generate', prompt: 'brief', html: versionHtml(1) }],
  }
  await mockWorkspaceApi(page, 'p1', state)
}

/** Buka grup accordion brief berdasarkan nama, bila masih tertutup. */
async function openGroup(page: import('@playwright/test').Page, name: RegExp): Promise<void> {
  const btn = page.getByRole('button', { name }).first()
  await expect(btn).toBeVisible({ timeout: 15000 })
  if ((await btn.getAttribute('aria-expanded')) !== 'true') await btn.click()
  await expect(btn).toHaveAttribute('aria-expanded', 'true', { timeout: 15000 })
  await page.waitForTimeout(300)
}

for (const theme of ['light', 'dark'] as const) {
  test(`border input login (${theme})`, async ({ page }) => {
    await gotoThemed(page, '/login', theme)
    await expectComputed(page.getByLabel('Alamat Email'), 'borderColor', BORDER[theme], `border input ${theme}`)
  })

  test(`teks kotak galat login 500 (${theme})`, async ({ page }) => {
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({
        status: 500,
        json: { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' } },
      }),
    )
    await gotoThemed(page, '/login', theme)
    await page.getByLabel('Alamat Email').fill('e2e@example.com')
    await page.getByLabel('Kata Sandi').fill('Password123')
    await page.getByRole('button', { name: 'Masuk' }).click()
    const alert = page.getByRole('alert').first()
    await expect(alert).toBeVisible()
    await expectTextContrast(alert, `teks alert ${theme}`)
  })

  test(`border textarea deskripsi brief (${theme})`, async ({ page }) => {
    await mockBriefShell(page)
    await gotoThemed(page, '/projects/new', theme)
    await expectComputed(
      page.getByLabel('Deskripsi Website'),
      'borderColor',
      BORDER[theme],
      `border textarea ${theme}`,
    )
  })

  test(`lingkaran radio tak-terpilih (${theme})`, async ({ page }) => {
    await mockBriefShell(page)
    await gotoThemed(page, '/projects/new', theme)
    // colorMode bawaan 'ai', jadi radio "Pilih sendiri" tak-terpilih.
    await openGroup(page, /Tampilan/)
    const circle = page
      .getByRole('radio', { name: 'Pilih sendiri' })
      .locator('..')
      .locator('span[aria-hidden="true"]')
      .first()
    await expectComputed(circle, 'borderColor', BORDER[theme], `lingkaran radio ${theme}`)
  })

  test(`tepi rel toggle MATI (${theme})`, async ({ page }) => {
    await mockBriefShell(page)
    await gotoThemed(page, '/projects/new', theme)
    // sections bawaan kosong: semua toggle MATI.
    await openGroup(page, /Isi halaman/)
    const track = page.getByRole('switch').first().locator('span[aria-hidden="true"]').first()
    await expect(track).toBeVisible()
    await expectComputed(track, 'ring', BORDER[theme], `ring rel MATI ${theme}`)
  })

  test(`border input warna kustom (${theme})`, async ({ page }) => {
    await mockBriefShell(page)
    await gotoThemed(page, '/projects/new', theme)
    await openGroup(page, /Tampilan/)
    // Input radio sr-only tidak bisa diklik langsung: klik labelnya.
    await page.getByRole('radio', { name: 'Pilih sendiri' }).locator('..').click()
    const colorInput = page.locator('input[type="color"]').first()
    await expect(colorInput).toBeVisible()
    await expectComputed(colorInput, 'borderColor', BORDER[theme], `border input warna ${theme}`)
  })

  test(`border select workspace (${theme})`, async ({ page }) => {
    await mockWorkspace(page)
    await gotoThemed(page, '/projects/p1', theme)
    const select = page.locator('select').first()
    await expect(select).toBeVisible({ timeout: 15000 })
    await expectComputed(select, 'borderColor', BORDER[theme], `border select ${theme}`)
  })

  test(`teks status workspace (${theme})`, async ({ page }) => {
    await mockWorkspace(page)
    await gotoThemed(page, '/projects/p1', theme)
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.getByRole('button', { name: 'Salin HTML' }).click()
    const status = page.getByText('HTML berhasil disalin ke clipboard.')
    await expect(status).toBeVisible({ timeout: 15000 })
    await expectTextContrast(status, `teks status ${theme}`)
  })
}
