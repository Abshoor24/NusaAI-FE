import { test, expect } from '@playwright/test'
import {
  envelope,
  mockLogin,
  mockWorkspaceApi,
  versionHtml,
  type WorkspaceState,
} from './workspace-helpers'

/**
 * Alur keyboard, skip-link, judul dokumen, dan reduced motion.
 */

async function mockProjectsPage(page: import('@playwright/test').Page): Promise<void> {
  await mockLogin(page)
  await page.route('**/api/v1/projects?*', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        json: envelope([
          {
            id: 'p1',
            title: 'Kedai Kopi',
            status: 'draft',
            brief: { description: 'Deskripsi project untuk pengujian.' },
            version_count: 0,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
        ]),
      })
    }
    return route.continue()
  })
}

/** Tekan Tab hingga predikat terpenuhi; kembalikan jumlah Tab yang dipakai. */
async function tabUntil(
  page: import('@playwright/test').Page,
  predicate: (name: string, tag: string) => boolean,
  max = 40,
): Promise<string> {
  for (let i = 0; i < max; i++) {
    const info = await page.evaluate(() => {
      const el = document.activeElement
      if (!(el instanceof HTMLElement)) return { name: '', tag: '' }
      return {
        name: el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 40) ?? '',
        tag: el.tagName,
      }
    })
    if (predicate(info.name, info.tag)) return info.name
    await page.keyboard.press('Tab')
  }
  throw new Error('elemen fokus tidak ditemukan dalam batas Tab')
}

test('alur keyboard: login, buka modal rename, tutup dengan Escape', async ({ page }) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      json: envelope({
        token: 'e2e-token',
        token_type: 'Bearer',
        expires_in: 86400,
        user: { id: 'u1', email: 'e2e@example.com', created_at: '2026-01-01T00:00:00Z' },
      }),
    }),
  )
  await mockProjectsPage(page)

  await page.goto('/login')
  // autoFocus menaruh fokus di email.
  await expect.poll(async () => page.evaluate(() => document.activeElement?.id)).toBe('email')
  await page.keyboard.type('e2e@example.com')
  await page.keyboard.press('Tab')
  expect(await page.evaluate(() => document.activeElement?.id)).toBe('password')
  await page.keyboard.type('Password123')
  const submitName = await tabUntil(page, (name) => name === 'Masuk')
  expect(submitName).toBe('Masuk')
  // Indikator fokus terlihat pada elemen yang difokus: boleh lewat ring
  // box-shadow ATAU outline (pola state bersama memakai outline 2px), dan
  // keduanya harus benar-benar ter-render (bukan 'none').
  const focus = await page.evaluate(() => {
    const cs = getComputedStyle(document.activeElement as HTMLElement)
    return {
      boxShadow: cs.boxShadow,
      outlineStyle: cs.outlineStyle,
      outlineWidth: parseFloat(cs.outlineWidth),
      outlineColor: cs.outlineColor,
    }
  })
  const ringVisible = focus.boxShadow !== 'none'
  const outlineVisible = focus.outlineStyle !== 'none' && focus.outlineWidth >= 2
  expect(
    ringVisible || outlineVisible,
    `indikator fokus harus terlihat (boxShadow=${focus.boxShadow}, outline=${focus.outlineStyle} ${focus.outlineWidth}px ${focus.outlineColor})`,
  ).toBe(true)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/projects$/, { timeout: 15000 })
  // Tunggu daftar termuat sebelum navigasi keyboard dimulai.
  await expect(page.getByText('Kedai Kopi').first()).toBeVisible({ timeout: 15000 })

  // Buka modal rename murni via keyboard.
  const judulName = await tabUntil(page, (name) => name.includes('Judul'))
  expect(judulName).toContain('Judul')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toContainText('Ubah Judul Project')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 })
  // Fokus kembali ke pemicu modal.
  const backTo = await page.evaluate(() => {
    const el = document.activeElement
    return el instanceof HTMLElement ? (el.textContent?.trim().slice(0, 20) ?? '') : ''
  })
  expect(backTo).toContain('Judul')
})

test('skip-link mengarah ke konten utama', async ({ page }) => {
  await mockProjectsPage(page)
  await page.goto('/projects')
  await expect(page.getByText('Kedai Kopi').first()).toBeVisible({ timeout: 10000 })

  await page.keyboard.press('Tab')
  const first = await page.evaluate(() => {
    const el = document.activeElement
    return el instanceof HTMLElement ? (el.textContent?.trim() ?? '') : ''
  })
  expect(first).toBe('Lewati ke konten utama')
  await page.keyboard.press('Enter')
  const mainId = await page.evaluate(() => document.activeElement?.id ?? '')
  expect(mainId).toBe('konten-utama')
})

test('setiap rute punya document.title berbahasa Indonesia', async ({ page }) => {
  await mockLogin(page)
  const state: WorkspaceState = {
    status: 'ready',
    title: 'Kedai Kopi',
    versions: [
      { id: 'v1', version_number: 1, kind: 'generate', prompt: 'brief', html: versionHtml(1) },
    ],
  }
  await mockWorkspaceApi(page, 'p1', state)
  await page.route('**/api/v1/projects?*', (route) => route.continue())

  const cases: Array<[string, string]> = [
    ['/', 'Nusa AI | Buat Website dengan AI'],
    ['/login', 'Masuk | Nusa AI'],
    ['/register', 'Buat Akun | Nusa AI'],
  ]
  for (const [url, title] of cases) {
    await page.goto(url, { waitUntil: 'networkidle' })
    await expect(page).toHaveTitle(title)
  }
})

test('rute aplikasi punya document.title', async ({ page }) => {
  await mockProjectsPage(page)
  await page.goto('/projects', { waitUntil: 'networkidle' })
  await expect(page).toHaveTitle('Project Saya | Nusa AI')

  await page.goto('/projects/new', { waitUntil: 'networkidle' })
  await expect(page).toHaveTitle('Buat Website Baru | Nusa AI')

  await page.goto('/settings', { waitUntil: 'networkidle' })
  await expect(page).toHaveTitle('Profil & Pengaturan | Nusa AI')

  await page.goto('/tidak-ada', { waitUntil: 'networkidle' })
  await expect(page).toHaveTitle('Halaman Tidak Ditemukan | Nusa AI')
})

test('prefers-reduced-motion menonaktifkan animasi spinner', async ({ page }) => {
  await mockLogin(page)
  // Gantung daftar project agar spinner loading terlihat.
  await page.route('**/api/v1/projects?*', () => {})
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/projects')

  const spinner = page.locator('[role="status"]').first()
  await expect(spinner).toBeVisible({ timeout: 10000 })
  const duration = await spinner.evaluate(
    (el) => getComputedStyle(el).animationDuration,
  )
  expect(Number.parseFloat(duration)).toBeLessThan(0.1)
})
