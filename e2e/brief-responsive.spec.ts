import { test, expect } from '@playwright/test'
import { envelope, mockLogin, mockWorkspaceApi, versionHtml, type WorkspaceState } from './workspace-helpers'

/**
 * Uji responsif TERUKUR untuk form brief /projects/new:
 * - tidak ada scroll horizontal,
 * - form bisa di-scroll sampai bawah pada viewport pendek & zoom 125%,
 * - tombol sticky selalu terlihat dan tidak menutupi field terakhir,
 * - semua kontrol interaktif >= 44x44px pada 360px.
 *
 * Zoom 125% disimulasikan sebagai viewport CSS yang diperkecil (1024x480),
 * karena zoom browser memperkecil viewport CSS, bukan menskalakan layout.
 */

const URL = '/projects/new'
const ALL_GROUPS = [
  'Tentang usahamu',
  'Tampilan',
  'Isi halaman',
  'Kontak & tombol utama',
  'Gambar referensi',
]

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

async function openGroups(page: import('@playwright/test').Page, titles: string[]): Promise<void> {
  for (const title of titles) {
    const btn = page.getByRole('button', { name: new RegExp(title) }).first()
    await expect(btn).toBeVisible({ timeout: 15000 })
    if ((await btn.getAttribute('aria-expanded')) !== 'true') await btn.click()
  }
  await page.waitForTimeout(500)
}

interface Viewport {
  width: number
  height: number
}

const VIEWPORTS: Array<Viewport & { label: string }> = [
  { label: '360x740 (mobile)', width: 360, height: 740 },
  { label: '768x1024 (tablet)', width: 768, height: 1024 },
  { label: '1280x800 (desktop)', width: 1280, height: 800 },
  { label: '1280x600 @100% (tinggi rendah)', width: 1280, height: 600 },
  { label: '1024x480 @125% zoom', width: 1024, height: 480 },
]

for (const vp of VIEWPORTS) {
  test(`brief bisa di-scroll penuh & tombol sticky selalu terlihat — ${vp.label}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await mockAppShell(page)
    await page.goto(URL, { waitUntil: 'networkidle' })
    await openGroups(page, ALL_GROUPS)

    // 1. Tidak ada scroll horizontal.
    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))
    expect(overflow.scroll, `scroll horizontal di ${vp.label}`).toBeLessThanOrEqual(
      overflow.client + 1,
    )

    // 2. Tombol aksi utama terlihat dari awal (sticky) dan tetap terlihat
    //    setelah form digulir sampai bawah.
    const submit = page.getByRole('button', { name: 'Simpan & Buatkan Website' })
    await expect(submit).toBeVisible()
    expect(await submit.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return r.top >= 0 && r.bottom <= window.innerHeight
    })).toBe(true)

    const box = await page.locator('form').boundingBox()
    expect(box, 'area scroll form').not.toBeNull()
    await page.mouse.move((box?.x ?? 0) + (box?.width ?? 100) / 2, (box?.y ?? 0) + 200)
    await page.mouse.wheel(0, 40000)
    await page.waitForTimeout(400)

    const state = await page.evaluate(() => {
      const form = document.querySelector('form')
      const bar = document.querySelector('form > div.sticky')
      const fields = Array.from(
        document.querySelectorAll(
          'input:not([type=hidden]):not(.sr-only), textarea, [role="switch"]',
        ),
      )
      const last = fields[fields.length - 1]
      const lr = last?.getBoundingClientRect()
      const br = bar?.getBoundingClientRect()
      return {
        scrollTop: form ? Math.round(form.scrollTop) : 0,
        maxScroll: form ? form.scrollHeight - form.clientHeight : 0,
        scrollable: form ? getComputedStyle(form).overflowY : null,
        // reached bottom within 2px
        atBottom: form ? form.scrollHeight - form.clientHeight - form.scrollTop <= 2 : false,
        stickyVisible: br ? br.top < window.innerHeight && br.bottom <= window.innerHeight + 1 : false,
        coveredBySticky: lr && br ? lr.bottom > br.top + 1 : false,
      }
    })
    expect(state.scrollable, 'elemen form harus jadi area scroll').toBe('auto')
    expect(state.atBottom, `form harus bisa di-scroll sampai bawah di ${vp.label}`).toBe(true)
    expect(state.scrollTop).toBeGreaterThan(0)
    expect(state.stickyVisible, 'bilah aksi harus tetap terlihat').toBe(true)
    // Field terakhir berada di luar bilah sticky (tidak tertutup).
    expect(state.coveredBySticky, 'bilah sticky tidak boleh menutupi field terakhir').toBe(false)
  })
}

test('semua kontrol interaktif >= 44x44px pada 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await mockAppShell(page)
  await page.goto(URL, { waitUntil: 'networkidle' })
  await openGroups(page, ALL_GROUPS)
  await page.waitForTimeout(500)

  const small = await page.evaluate(() => {
    const selector =
      'button:not([disabled]), a[href], input:not([type=hidden]), textarea, select, summary, [role="switch"]'
    const out: string[] = []
    for (const el of Array.from(document.querySelectorAll(selector))) {
      // Input radio/checkbox sengaja sr-only: yang diklik user adalah <label>
      // pembungkusnya, yang selalu >= 44px.
      if (el.classList.contains('sr-only')) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none') continue
      const name =
        el.getAttribute('aria-label') ||
        (el.textContent || '').trim().slice(0, 30) ||
        `${el.tagName}[${el.getAttribute('type') ?? ''}]`
      if (r.width < 44 || r.height < 44) {
        out.push(`${name}: ${Math.round(r.width)}x${Math.round(r.height)}`)
      }
    }
    return out
  })
  expect(small, `kontrol di bawah 44px pada 360px:\n${small.join('\n')}`).toEqual([])
})