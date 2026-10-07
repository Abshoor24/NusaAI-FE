import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { envelope, mockLogin, mockWorkspaceApi, versionHtml, type WorkspaceState } from './workspace-helpers'
import { installErrorHooks, expectNoPageErrors, readLayout, type ErrorHooks } from './helpers/layout-invariants'

/**
 * Invarian Spacious (Fase 4.2 - 4.5).
 *
 * Menjamin:
 *  - tinggi form /projects/new naik paling banyak 15% dari baseline
 *    (fixtures/brief-baseline.json) pada 1280x800 dan 360x740
 *  - <main> tidak bisa digulir, tanpa scroll horizontal, satu scroll container
 *  - tombol sticky "Simpan & Buatkan Website" selalu terlihat
 *  - form Brief tetap bisa di-scroll sampai bawah pada tinggi 600
 *  - semua target sentuh >= 44px pada 360
 *  - fokus terlihat saat navigasi keyboard di tiap halaman
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const BRIEF_BASELINE = JSON.parse(
  readFileSync(resolve(HERE, '../fixtures/brief-baseline.json'), 'utf-8'),
) as Array<{ vp: string; state: string; formScrollHeight: number }>

const MAX_GROWTH = 1.15

const VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1280, height: 600 },
] as const

const ROUTES = ['/', '/login', '/register', '/projects', '/projects/new', '/projects/p1', '/settings', '/tidak-ada'] as const

function projectItem(id: string, title: string, status: string) {
  return {
    id,
    title,
    status,
    brief: { description: 'Deskripsi project untuk pengujian.' },
    version_count: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

async function mockAppShell(page: import('@playwright/test').Page): Promise<void> {
  await mockLogin(page)
  const state: WorkspaceState = {
    status: 'ready',
    title: 'Kedai Kopi',
    versions: [{ id: 'v1', version_number: 1, kind: 'generate', prompt: 'brief', html: versionHtml(1) }],
  }
  await mockWorkspaceApi(page, 'p1', state)
  await page.route('**/api/v1/projects?*', (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    return route.fulfill({
      json: envelope([
        projectItem('p1', 'Kedai Kopi', 'ready'),
        projectItem('p2', 'Toko Roti', 'generating'),
        projectItem('p3', 'Kafe Aroma', 'failed'),
      ]),
    })
  })
}

async function openEverything(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForTimeout(700)
  for (const b of await page.locator('button[aria-expanded]').all()) {
    if ((await b.getAttribute('aria-expanded')) === 'false') {
      await b.scrollIntoViewIfNeeded()
      await b.click()
      await page.waitForTimeout(220)
    }
  }
  for (const s of await page.locator('details > summary').all()) {
    const open = await s.evaluate((el) => (el.parentElement as HTMLDetailsElement | null)?.open ?? false)
    if (!open) {
      await s.scrollIntoViewIfNeeded()
      await s.click()
      await page.waitForTimeout(150)
    }
  }
  await page.waitForTimeout(600)
}

test.describe('tinggi form Brief (Fase 4.3)', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.width}x${vp.height}: tinggi total form <= +15% baseline (semua accordion terbuka)`, async ({
      page,
    }) => {
      await page.setViewportSize(vp)
      await mockAppShell(page)
      await page.goto('/projects/new', { waitUntil: 'networkidle' })
      await openEverything(page)

      const measured = await page.evaluate(() => {
        const form = document.querySelector('form') as HTMLFormElement | null
        const sticky = document.querySelector('.sticky.bottom-0') as HTMLElement | null
        const main = document.querySelector('main#konten-utama') as HTMLElement | null
        if (!form) return null
        form.scrollTo(0, form.scrollHeight)
        const sr = sticky?.getBoundingClientRect()
        const mr = main?.getBoundingClientRect()
        return {
          formScrollHeight: form.scrollHeight,
          reachedBottom: form.scrollTop + form.clientHeight >= form.scrollHeight - 2,
          stickyVisible: sr && mr ? sr.bottom <= mr.bottom + 1 && sr.top >= mr.top - 1 : null,
          mainScrollHeight: main?.scrollHeight ?? null,
          mainClientHeight: main?.clientHeight ?? null,
        }
      })
      expect(measured, 'form harus ada').not.toBeNull()
      const base = BRIEF_BASELINE.find((b) => b.vp === `${vp.width}x${vp.height}` && b.state === 'open')
      expect(base, `baseline untuk ${vp.width}x${vp.height} open harus ada`).toBeTruthy()
      const limit = Math.round(base!.formScrollHeight * MAX_GROWTH)
      expect(
        measured!.formScrollHeight,
        `tinggi form ${measured!.formScrollHeight} vs baseline ${base!.formScrollHeight} (batas ${limit})`,
      ).toBeLessThanOrEqual(limit)
      expect(measured!.reachedBottom, 'form harus bisa di-scroll sampai bawah').toBe(true)
      if (measured!.stickyVisible !== null) {
        expect(measured!.stickyVisible, 'tombol sticky harus selalu terlihat').toBe(true)
      }
      if (vp.width >= 768) {
        expect(
          measured!.mainScrollHeight!,
          '<main> tidak boleh punya overflow scroll',
        ).toBeLessThanOrEqual(measured!.mainClientHeight! + 1)
      }
    })
  }
})

const SHORT_VIEWPORTS = [
  { width: 1280, height: 600 },
  { width: 360, height: 640 },
] as const

test.describe('login & register pada layar pendek (Fase 2.2)', () => {
  for (const vp of SHORT_VIEWPORTS) {
    for (const route of ['/login', '/register'] as const) {
      test(`${vp.width}x${vp.height} ${route}: isian & tombol submit terjangkau tanpa terpotong`, async ({
        page,
      }) => {
        await page.setViewportSize(vp)
        // API mock: submit diuji sampai memicu request, tanpa backend sungguhan.
        const authOk = {
          token: 'e2e-token',
          token_type: 'Bearer',
          expires_in: 86400,
          user: { id: 'u1', email: 'e2e@example.com', created_at: '2026-01-01T00:00:00Z' },
        }
        await page.route('**/api/v1/auth/login', (r) => r.fulfill({ json: envelope(authOk) }))
        await page.route('**/api/v1/auth/register', (r) => r.fulfill({ json: envelope(authOk) }))
        await mockLogin(page)
        await page.goto(route, { waitUntil: 'networkidle' })
        await page.waitForTimeout(400)

        const email = page.getByLabel('Alamat Email')
        const password = page.getByLabel('Kata Sandi')
        const submit = page.getByRole('button', { name: /^(Masuk|Buat Akun)$/ })

        // Target sentuh 44px wajib di lebar sentuh; di >=768px aplikasi memakai
        // tinggi desain 40px (pola `md:min-h-10` yang sudah ada sebelumnya).
        const minHeight = vp.width < 768 ? 44 : 40

        for (const [name, locator] of [
          ['email', email],
          ['password', password],
          ['submit', submit],
        ] as const) {
          await expect(locator, `${route}: ${name} harus ada`).toBeVisible()
          const box = await locator.boundingBox()
          expect(box, `${route}: ${name} harus punya box`).not.toBeNull()
          expect(box!.height, `${route}: ${name} tinggi`).toBeGreaterThanOrEqual(minHeight)
          expect(box!.y, `${route}: ${name} di dalam viewport atas`).toBeGreaterThanOrEqual(0)
          expect(
            box!.y + box!.height,
            `${route}: ${name} di dalam viewport bawah`,
          ).toBeLessThanOrEqual(vp.height + 1)
        }

        // Tidak ada elemen form yang jatuh di luar area scroll dokumen.
        const docOverflow = await page.evaluate(
          () => document.documentElement.scrollHeight - document.documentElement.clientHeight,
        )
        expect(docOverflow, `${route} pada ${vp.width}x${vp.height} tidak boleh menggulir`).toBeLessThanOrEqual(1)

        // Kontrol benar-benar bisa dipakai: klik, isi, lalu kirim. Tombol
        // submit baru aktif setelah dua isian terisi (perilaku yang sama
        // sejak awal, tidak diubah di sini).
        await email.click()
        await expect(email).toBeFocused()
        await email.fill('e2e@example.com')
        await password.click()
        await expect(password).toBeFocused()
        await password.fill('Password123')
        await expect(submit, `${route}: submit aktif setelah isian terisi`).toBeEnabled()
        await submit.click()
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollHeight - document.documentElement.clientHeight), {
            timeout: 5000,
          })
          .toBeLessThanOrEqual(1)
        await expect(email, `${route}: isian email masih ada setelah submit`).toBeVisible()
      })
    }
  }
})

test.describe('invarian layout semua rute (Fase 4.2)', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.width}x${vp.height}: tanpa scroll horizontal & satu scroll container`, async ({ page }) => {
      await page.setViewportSize(vp)
      const hooks: ErrorHooks = installErrorHooks(page)
      await mockAppShell(page)
      for (const route of ROUTES) {
        await page.goto(route, { waitUntil: 'networkidle' })
        await page.waitForTimeout(400)
        const overflow = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
        }))
        expect(overflow.scroll, `scroll horizontal di ${route}`).toBeLessThanOrEqual(overflow.client + 1)
        const s = await readLayout(page)
        if ('noMain' in s) {
          // Rute publik tidak punya <main id="konten-utama">; cukup pastikan
          // tidak ada elemen yang tiba-tiba jadi scroll container tambahan.
          expect((s as { scrollers?: string[] }).scrollers?.length ?? 0).toBeLessThanOrEqual(1)
          continue
        }
        const main = s.main
        expect(main.scrollHeight, `<main> overflow di ${route}`).toBeLessThanOrEqual(main.clientHeight + 1)
        expect(main.scrollTop, `<main> tergulir di ${route}`).toBe(0)
        expect(s.scrollers.length, `scroll vertikal di ${route}: ${s.scrollers.join(', ')}`).toBeLessThanOrEqual(1)
        expect(s.absEscapees.length, `input sr-only lolos di ${route}`).toBe(0)
        expect(s.absOverflows.length, `absolute lolos di ${route}`).toBe(0)
      }
      expectNoPageErrors(hooks, `layout ${vp.width}x${vp.height}`)
    })
  }
})

test.describe('target sentuh 44px pada 360 (Fase 4.5)', () => {
  test('semua kontrol interaktif >= 44px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await mockAppShell(page)
    const small: string[] = []
    for (const route of ROUTES) {
      await page.goto(route, { waitUntil: 'networkidle' })
      await page.waitForTimeout(400)
      const boxes = await page.evaluate(() => {
        const out: Array<{ name: string; w: number; h: number }> = []
        const nodes = Array.from(
          document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role="switch"]'),
        )
        for (const el of nodes) {
          if (!(el instanceof HTMLElement)) continue
          const cs = getComputedStyle(el)
          if (cs.display === 'none' || cs.visibility === 'hidden') continue
          if (el.classList.contains('sr-only')) continue
          const r = el.getBoundingClientRect()
          if (r.width < 1 || r.height < 1) continue
          const name =
            el.getAttribute('aria-label') ??
            el.getAttribute('placeholder') ??
            (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 24) ??
            el.tagName.toLowerCase()
          out.push({ name: `${el.tagName.toLowerCase()}:${name || '(tanpa nama)'}`, w: r.width, h: r.height })
        }
        return out
      })
      for (const b of boxes) {
        if (b.w < 44 || b.h < 44) {
          small.push(`${route} "${b.name}": ${Math.round(b.w)}x${Math.round(b.h)}`)
        }
      }
    }
    expect(small, 'kontrol di bawah 44px').toEqual([])
  })
})

test.describe('fokus terlihat (Fase 4.5)', () => {
  for (const route of ROUTES) {
    test(`indikator fokus terlihat di ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      await mockAppShell(page)
      await page.goto(route, { waitUntil: 'networkidle' })
      await page.waitForTimeout(400)
      let checked = 0
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Tab')
        const info = await page.evaluate(() => {
          const el = document.activeElement
          if (!(el instanceof HTMLElement)) return null
          const cs = getComputedStyle(el)
          const ringVisible = cs.boxShadow !== 'none'
          const outlineVisible = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 1
          const wrapped =
            el.classList.contains('ctl-has-focus') &&
            el.matches(':has(:focus-visible)')
          return {
            tag: el.tagName.toLowerCase(),
            name: (el.getAttribute('aria-label') ?? el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 24),
            visible: ringVisible || outlineVisible || wrapped,
          }
        })
        if (!info) continue
        if (info.tag === 'body' || info.tag === 'html') continue
        expect(
          info.visible,
          `fokus di ${route} pada <${info.tag}> "${info.name}" harus punya indikator terlihat`,
        ).toBe(true)
        checked++
      }
      expect(checked, `tidak ada elemen fokus di ${route}`).toBeGreaterThan(0)
    })
  }
})
