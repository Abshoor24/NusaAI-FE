import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { envelope, mockLogin, mockWorkspaceApi, versionHtml, type WorkspaceState } from './workspace-helpers'

/**
 * Sapuan teks (Fase 4.4).
 *
 * Mengunjungi setiap rute dan setiap state yang bisa dicapai, lalu
 * mengumpulkan seluruh teks yang terlihat pengguna: teks pada node,
 * aria-label, title, placeholder, alt, dan document.title. Spec ini gagal
 * kalau ada frasa Inggris yang tercantum di e2e/text-allowlist.json.
 *
 * Kata-kata Latin tidak bisa dibedakan dari Bahasa Indonesia secara
 * otomatis, jadi daftar yang dijaga adalah frasa yang memang pernah
 * muncul sebagai teks Inggris, plus daftar istilah produk yang boleh tetap
 * berbahasa Inggris. Setiap entri wajib punya alasan.
 *
 * Semua endpoint di-mock; tidak ada panggilan backend sungguhan.
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const ALLOWLIST_FILE = resolve(HERE, 'text-allowlist.json')

interface Allowlist {
  forbidden: Array<{ phrase: string; reason: string }>
  allowedTerms: Array<{ term: string; reason: string }>
  requiredPhrases: string[]
}

function readAllowlist(): Allowlist {
  return JSON.parse(readFileSync(ALLOWLIST_FILE, 'utf-8')) as Allowlist
}

type Runner = (page: import('@playwright/test').Page) => Promise<string[]>

/** State yang diperiksa, satu per test agar kegagalan mudah ditelusuri. */
const CHECKS: Array<{ label: string; run: Runner }> = [
  {
    label: 'landing',
    run: async (page) => {
      await page.goto('/', { waitUntil: 'networkidle' })
      return collect(page)
    },
  },
  {
    label: 'login kosong',
    run: async (page) => {
      await page.goto('/login', { waitUntil: 'networkidle' })
      return collect(page)
    },
  },
  {
    label: 'login error validasi dari server',
    run: async (page) => {
      // Validasi sisi browser (required + type=email) memakai pesan tooltip
      // milik browser sendiri, bukan teks aplikasi, jadi state yang diuji di
      // sini adalah FIELD_ERROR dari server.
      await page.route('**/api/v1/auth/login', (route) =>
        route.fulfill({
          status: 422,
          json: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              fields: { email: 'Alamat email tidak valid' },
            },
          },
        }),
      )
      await page.goto('/login', { waitUntil: 'networkidle' })
      await page.getByLabel('Alamat Email').fill('e2e@example.com')
      await page.getByLabel('Kata Sandi').fill('Password123')
      await page.getByRole('button', { name: 'Masuk' }).click()
      await expect(page.getByText('Alamat email tidak valid')).toBeVisible()
      return collect(page)
    },
  },
  {
    label: 'login error server dengan pesan backend Inggris',
    run: async (page) => {
      await page.route('**/api/v1/auth/login', (route) =>
        route.fulfill({
          status: 500,
          json: {
            success: false,
            error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' },
          },
        }),
      )
      await page.goto('/login', { waitUntil: 'networkidle' })
      await page.getByLabel('Alamat Email').fill('e2e@example.com')
      await page.getByLabel('Kata Sandi').fill('Password123')
      await page.getByRole('button', { name: 'Masuk' }).click()
      await expect(page.getByRole('alert')).toBeVisible()
      return collect(page)
    },
  },
  {
    label: 'register kosong',
    run: async (page) => {
      await page.goto('/register', { waitUntil: 'networkidle' })
      return collect(page)
    },
  },
  {
    label: 'register error server 409',
    run: async (page) => {
      await page.route('**/api/v1/auth/register', (route) =>
        route.fulfill({
          status: 409,
          json: { success: false, error: { code: 'CONFLICT', message: 'Email already exists' } },
        }),
      )
      await page.goto('/register', { waitUntil: 'networkidle' })
      await page.getByLabel('Alamat Email').fill('e2e@example.com')
      await page.getByLabel('Kata Sandi').fill('Password123')
      await page.getByRole('button', { name: 'Buat Akun' }).click()
      await expect(page.getByRole('alert')).toBeVisible()
      return collect(page)
    },
  },
  {
    label: 'daftar kosong',
    run: async (page) => {
      await mockAppShell(page, 'empty')
      await page.goto('/projects', { waitUntil: 'networkidle' })
      await expect(page.getByText('Belum ada website')).toBeVisible()
      return collect(page)
    },
  },
  {
    label: 'daftar terisi',
    run: async (page) => {
      await mockAppShell(page, 'filled')
      await page.goto('/projects', { waitUntil: 'networkidle' })
      await expect(page.getByText('Kedai Kopi').first()).toBeVisible()
      return collect(page)
    },
  },
  {
    label: 'modal ubah judul terbuka',
    run: async (page) => {
      await mockAppShell(page, 'filled')
      await page.goto('/projects', { waitUntil: 'networkidle' })
      await page.getByRole('button', { name: 'Judul' }).first().click()
      await expect(page.getByRole('dialog')).toBeVisible()
      return collect(page)
    },
  },
  {
    label: 'daftar gagal 500',
    run: async (page) => {
      await mockLogin(page)
      await page.route('**/api/v1/projects?*', (route) =>
        route.fulfill({
          status: 500,
          json: {
            success: false,
            error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' },
          },
        }),
      )
      await page.goto('/projects', { waitUntil: 'networkidle' })
      await expect(page.getByRole('heading', { name: 'Gagal memuat project' })).toBeVisible()
      return collect(page)
    },
  },
  {
    label: 'brief tertutup',
    run: async (page) => {
      await mockAppShell(page, 'empty')
      await page.goto('/projects/new', { waitUntil: 'networkidle' })
      await page.waitForTimeout(600)
      return collect(page)
    },
  },
  {
    label: 'brief semua kelompok terbuka',
    run: async (page) => {
      await mockAppShell(page, 'empty')
      await page.goto('/projects/new', { waitUntil: 'networkidle' })
      await openEverything(page)
      return collect(page)
    },
  },
  {
    label: 'brief keadaan error validasi',
    run: async (page) => {
      await mockAppShell(page, 'empty')
      await page.goto('/projects/new', { waitUntil: 'networkidle' })
      await page.waitForTimeout(500)
      await page.getByRole('button', { name: /Simpan & Buatkan Website/ }).click()
      await expect(page.getByRole('alert').first()).toBeVisible()
      return collect(page)
    },
  },
  {
    label: 'brief galat 429 dengan hitung mundur',
    run: async (page) => {
      await mockLogin(page)
      await page.route('**/api/v1/projects?*', (route) => route.fulfill({ json: envelope([]) }))
      await page.route('**/api/v1/projects', (route) =>
        route.fulfill({
          status: 429,
          headers: { 'Retry-After': '30', 'Access-Control-Expose-Headers': 'Retry-After' },
          json: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
        }),
      )
      await page.goto('/projects/new', { waitUntil: 'networkidle' })
      await page.getByLabel('Deskripsi Website').fill(
        'Kedai kopi lokal di Purwokerto, buka jam 08.00 sampai 22.00.',
      )
      await page.getByRole('button', { name: /Simpan & Buatkan Website/ }).click()
      await expect(
        page.getByRole('alert').filter({ hasText: /Terlalu banyak permintaan/ }),
      ).toBeVisible({ timeout: 15000 })
      return collect(page)
    },
  },
  {
    label: 'brief galat jaringan',
    run: async (page) => {
      await mockLogin(page)
      await page.route('**/api/v1/projects?*', (route) => route.fulfill({ json: envelope([]) }))
      await page.route('**/api/v1/projects', (route) => route.abort('connectionfailed'))
      await page.goto('/projects/new', { waitUntil: 'networkidle' })
      await page.getByLabel('Deskripsi Website').fill(
        'Kedai kopi lokal di Purwokerto, buka jam 08.00 sampai 22.00.',
      )
      await page.getByRole('button', { name: /Simpan & Buatkan Website/ }).click()
      await expect(page.getByRole('alert').filter({ hasText: /Tidak dapat terhubung/ })).toBeVisible({
        timeout: 15000,
      })
      return collect(page)
    },
  },
  {
    label: 'workspace siap',
    run: async (page) => {
      await mockWorkspace(page)
      await page.goto('/projects/p1', { waitUntil: 'networkidle' })
      await expect(page.getByText('Revisi Website')).toBeVisible()
      return collect(page)
    },
  },
  {
    label: 'drawer sidebar terbuka',
    run: async (page) => {
      await mockWorkspace(page)
      await page.setViewportSize({ width: 360, height: 740 })
      await page.goto('/projects', { waitUntil: 'networkidle' })
      await page.getByRole('button', { name: 'Buka menu' }).click()
      await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeVisible()
      return collect(page)
    },
  },
  {
    label: 'menu navbar terbuka',
    run: async (page) => {
      await page.setViewportSize({ width: 360, height: 740 })
      await page.goto('/', { waitUntil: 'networkidle' })
      await page.getByRole('button', { name: 'Buka menu' }).click()
      await expect(page.getByRole('navigation', { name: 'Navigasi seluler' })).toBeVisible()
      return collect(page)
    },
  },
  {
    label: 'settings',
    run: async (page) => {
      await mockLogin(page)
      await page.goto('/settings', { waitUntil: 'networkidle' })
      await expect(page.getByText('Informasi Pengguna')).toBeVisible()
      return collect(page)
    },
  },
  {
    label: 'settings gagal',
    run: async (page) => {
      await mockLogin(page)
      await page.route('**/api/v1/auth/me', (route) =>
        route.fulfill({
          status: 500,
          json: {
            success: false,
            error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' },
          },
        }),
      )
      await page.goto('/settings', { waitUntil: 'networkidle' })
      await expect(page.getByRole('alert')).toBeVisible()
      return collect(page)
    },
  },
  {
    label: 'halaman 404',
    run: async (page) => {
      await mockLogin(page)
      await page.goto('/tidak-ada', { waitUntil: 'networkidle' })
      await expect(page.getByRole('heading', { name: 'Halaman Tidak Ditemukan' })).toBeVisible()
      return collect(page)
    },
  },
]

/** Kumpulkan semua teks yang terlihat pengguna di halaman sekarang. */
async function collect(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [document.title]
    const push = (value: string | null | undefined) => {
      const v = (value ?? '').replace(/\s+/g, ' ').trim()
      if (v) out.push(v)
    }
    const isVisible = (el: Element) => {
      if (!(el instanceof HTMLElement)) return false
      if (el.classList.contains('sr-only')) return false
      if (typeof el.checkVisibility === 'function') {
        return el.checkVisibility({ checkVisibilityCSS: true, contentVisibilityAuto: true })
      }
      return getComputedStyle(el).display !== 'none'
    }
    // Teks node langsung, supaya kalimat panjang tidak dipecah per kata.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      const parent = node.parentElement
      if (parent && isVisible(parent)) push(node.textContent)
      node = walker.nextNode()
    }
    for (const attr of ['aria-label', 'placeholder', 'title', 'alt'] as const) {
      for (const el of Array.from(document.querySelectorAll('[' + attr + ']'))) {
        if (isVisible(el)) push(el.getAttribute(attr))
      }
    }
    return out
  })
}

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

async function mockAppShell(
  page: import('@playwright/test').Page,
  list: 'empty' | 'filled',
): Promise<void> {
  await mockLogin(page)
  await page.route('**/api/v1/projects?*', (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    return route.fulfill({
      json: envelope(
        list === 'empty'
          ? []
          : [projectItem('p1', 'Kedai Kopi', 'ready'), projectItem('p2', 'Toko Roti', 'generating')],
      ),
    })
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

async function openEverything(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForTimeout(700)
  for (const b of await page.locator('button[aria-expanded]').all()) {
    if ((await b.getAttribute('aria-expanded')) === 'false') {
      await b.scrollIntoViewIfNeeded()
      await b.click()
      await page.waitForTimeout(200)
    }
  }
  for (const s of await page.locator('details > summary').all()) {
    const open = await s.evaluate((el) => (el.parentElement as HTMLDetailsElement | null)?.open ?? false)
    if (!open) {
      await s.scrollIntoViewIfNeeded()
      await s.click()
      await page.waitForTimeout(140)
    }
  }
  await page.waitForTimeout(500)
}

test.describe('sapuan teks (Fase 4.4)', () => {
  test('daftar allowlist konsisten dan setiap entri punya alasan', () => {
    const list = readAllowlist()
    const check = (label: string, entries: Array<Record<string, string>>, key: string) => {
      expect(entries.length, label + ' tidak boleh kosong').toBeGreaterThan(0)
      for (const entry of entries) {
        expect((entry[key] ?? '').trim().length, label + ' punya entri kosong').toBeGreaterThan(0)
        expect(
          (entry.reason ?? '').trim().length,
          label + ' "' + entry[key] + '" harus punya alasan',
        ).toBeGreaterThan(10)
      }
    }
    check('forbidden', list.forbidden, 'phrase')
    check('allowedTerms', list.allowedTerms, 'term')
    for (const phrase of list.requiredPhrases) {
      expect(phrase.trim().length, 'requiredPhrases tidak boleh kosong').toBeGreaterThan(3)
    }
  })
})

for (const check of CHECKS) {
  test('sapuan teks: ' + check.label, async ({ page }) => {
    test.setTimeout(120_000)
    const list = readAllowlist()
    const texts = await check.run(page)

    expect(texts.length, check.label + ': tidak ada teks yang terkumpul').toBeGreaterThan(3)

    const haystack = texts.join(' \n ').toLowerCase()
    const hits = list.forbidden
      .filter((f) => haystack.includes(f.phrase.toLowerCase()))
      .map((f) => '"' + f.phrase + '" (' + f.reason + ')')
    expect(hits, 'frasa Inggris terlarang di ' + check.label + ':\n' + hits.join('\n')).toEqual([])

    test.info().annotations.push({
      type: 'istilah-dipakai',
      description:
        list.allowedTerms
          .filter((t) => haystack.includes(t.term.toLowerCase()))
          .map((t) => t.term)
          .join(', ') || '(tidak ada)',
    })
  })
}

test('kalimat Indonesia inti tetap ada di seluruh UI', async ({ page }) => {
  test.setTimeout(300_000)
  const list = readAllowlist()
  const seen = new Set<string>()
  for (const check of CHECKS) {
    const texts = await check.run(page)
    const joined = texts.join(' \n ')
    for (const phrase of list.requiredPhrases) {
      if (joined.includes(phrase)) seen.add(phrase)
    }
  }
  const missing = list.requiredPhrases.filter((p) => !seen.has(p))
  expect(missing, 'kalimat inti hilang dari UI: ' + missing.join(' | ')).toEqual([])
})