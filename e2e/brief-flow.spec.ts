import { test, expect } from '@playwright/test'
import { envelope, mockLogin, mockWorkspaceApi, type WorkspaceState } from './workspace-helpers'

/**
 * Alur E2E form brief dengan API di-mock (tanpa backend sungguhan):
 * template -> ubah warna -> nyalakan toggle -> submit -> payload POST
 * -> masuk workspace ?autostart=1. Plus alur keyboard-only dan alur minimum.
 *
 * TIDAK memakai tag @needs-backend: seluruh endpoint di-mock sehingga lolos
 * di mode CI tanpa backend, dan tidak pernah menyentuh AI sungguhan.
 */

const createdPayloads: Array<Record<string, unknown>> = []

async function mockProjects(page: import('@playwright/test').Page): Promise<void> {
  await mockLogin(page)
  const state: WorkspaceState = {
    status: 'draft',
    title: 'Kopi Senja',
    versions: [],
  }
  await mockWorkspaceApi(page, 'p1', state)
  await page.route('**/api/v1/projects', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as Record<string, unknown>
      createdPayloads.push(body)
      return route.fulfill({
        status: 201,
        json: envelope({
          id: 'p1',
          title: 'Kopi Senja',
          status: 'draft',
          brief: { description: 'Deskripsi project untuk pengujian E2E.' },
          version_count: 0,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        }),
      })
    }
    return route.continue()
  })
  // Jaga agar generate (autostart) tidak memanggil AI sungguhan.
  await page.route('**/api/v1/projects/p1/generate', (route) =>
    route.fulfill({
      status: 409,
      json: { success: false, error: { code: 'CONFLICT', message: 'mock: tidak memanggil AI' } },
    }),
  )
}

/**
 * Router TanStack me-JSON-parse nilai query saat full load, sehingga ?autostart=1
 * bisa muncul sebagai `autostart=1` maupun `autostart="1"` di URL. Keduanya
 * diterima (sudah diuji di workspace-generate.spec.ts).
 */
async function expectWorkspaceUrl(page: import('@playwright/test').Page): Promise<void> {
  await expect
    .poll(
      () => {
        const url = new URL(page.url())
        return {
          path: url.pathname,
          autostart: url.searchParams.get('autostart'),
        }
      },
      { timeout: 15000 },
    )
    .toEqual({ path: '/projects/p1', autostart: expect.stringMatching(/^"?.1"?$/) })
}

/** Buka kelompok accordion berdasarkan judulnya bila belum terbuka. */
async function openGroup(page: import('@playwright/test').Page, title: string): Promise<void> {
  const btn = page.getByRole('button', { name: new RegExp(title) }).first()
  await expect(btn).toBeVisible({ timeout: 15000 })
  if ((await btn.getAttribute('aria-expanded')) !== 'true') await btn.click()
  await expect(btn).toHaveAttribute('aria-expanded', 'true')
  await page.waitForTimeout(400)
}

/** Pastikan tidak ada string kosong di seluruh payload yang dikirim. */
function expectNoEmptyStrings(payload: unknown, path = 'payload'): void {
  if (typeof payload === 'string') {
    expect(payload.trim(), `string kosong di ${path}`).not.toBe('')
    return
  }
  if (Array.isArray(payload)) {
    payload.forEach((item, i) => expectNoEmptyStrings(item, `${path}[${i}]`))
    return
  }
  if (payload && typeof payload === 'object') {
    for (const [key, value] of Object.entries(payload)) {
      expect(value, `key "${key}" di ${path} tidak boleh null`).not.toBeNull()
      expectNoEmptyStrings(value, `${path}.${key}`)
    }
  }
}

test('template -> ubah warna -> toggle -> submit: payload sesuai pemetaan', async ({ page }) => {
  createdPayloads.length = 0
  await mockProjects(page)
  await page.goto('/projects/new', { waitUntil: 'networkidle' })

  // 1. Pilih template.
  await page.getByRole('button', { name: /Kedai kopi/ }).click()
  await expect(page.getByLabel('Deskripsi Website')).toHaveValue(/Kedai kopi/)

  // 2. Ubah warna: mode manual + palet.
  // Radio & chip memakai input sr-only di dalam <label>, jadi diklik lewat
  // labelnya (meniru pengguna nyata).
  await openGroup(page, 'Tampilan')
  await page.getByText('Pilih sendiri', { exact: true }).click()
  await page.getByRole('button', { name: 'Elegan' }).click()
  await expect(page.getByLabel('Warna utama', { exact: true })).toHaveValue('#1E3A8A')
  await expect(page.getByLabel('Warna aksen', { exact: true })).toHaveValue('#DDD6FE')
  // Nama warna tampil sebagai TEKS, bukan hanya mengandalkan warna.
  await expect(page.getByText('Terlihat sebagai biru laut')).toBeVisible()

  // 3. Ubah susunan bagian: matikan "Ulasan pelanggan" (menyala default
  //    kategori kuliner) dan nyalakan "Pertanyaan yang sering ditanya"
  //    (tidak menyala secara default).
  await openGroup(page, 'Isi halaman')
  await expect(page.getByRole('switch', { name: /Ulasan pelanggan/ })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await page.getByRole('switch', { name: /Ulasan pelanggan/ }).click()
  await page.getByRole('switch', { name: /Pertanyaan yang sering ditanyakan/ }).click()

  // 4. Isi kontak minimal & submit.
  await openGroup(page, 'Kontak & tombol utama')
  await expect(page.getByLabel('Nomor WhatsApp')).toHaveValue('081234567890')
  await page.getByRole('button', { name: 'Simpan & Buatkan Website' }).click()

  // 5. Masuk workspace dengan ?autostart=1.
  await expectWorkspaceUrl(page)

  // 6. Assert payload: pemetaan sesuai, tidak ada string kosong.
  expect(createdPayloads).toHaveLength(1)
  const payload = createdPayloads[0] as {
    title?: string
    brief: {
      description: string
      business_name?: string
      style?: string
      color_palette?: string
      website_type?: string
      language?: string
      sections?: string[]
    }
  }
  expectNoEmptyStrings(payload)

  expect(payload.brief.color_palette).toBe(
    'warna utama: biru laut (#1E3A8A); warna aksen: ungu muda (#DDD6FE)',
  )
  expect(payload.brief.style).toContain('Hangat')
  expect(payload.brief.sections).toContain('faq')
  expect(payload.brief.sections).not.toContain('testimoni')
  expect(payload.brief.sections).toContain('hero')
  expect(payload.brief.sections!.length).toBeLessThanOrEqual(12)
  for (const name of payload.brief.sections!) expect(name.length).toBeLessThanOrEqual(50)
  expect(payload.brief.description).toContain('Jenis usaha:')
  expect(payload.brief.description).toContain('Tujuan utama website:')
  expect(payload.brief.description).toContain('WhatsApp +6281234567890')
  expect(payload.brief.description).toContain('https://wa.me/6281234567890')
  expect(payload.brief.description).toContain('Website berupa halaman statis')
  expect(payload.brief.description.length).toBeLessThanOrEqual(4000)
  expect(payload.brief.business_name).toBeUndefined()
})

test('alur minimum: hanya deskripsi yang tetap berhasil', async ({ page }) => {
  createdPayloads.length = 0
  await mockProjects(page)
  await page.goto('/projects/new', { waitUntil: 'networkidle' })

  await page
    .getByLabel('Deskripsi Website')
    .fill('Kedai kopi lokal di Purwokerto dengan menu dan tombol pesan WhatsApp.')
  await page.getByRole('button', { name: 'Simpan & Buatkan Website' }).click()

  await expectWorkspaceUrl(page)
  expect(createdPayloads).toHaveLength(1)
  const payload = createdPayloads[0] as { brief: Record<string, unknown> }
  // Hanya description yang terkirim; tidak ada key kosong.
  expect(Object.keys(payload.brief)).toEqual(['description'])
  expectNoEmptyStrings(payload)
})

test('alur keyboard-only: isi deskripsi dan submit tanpa tetikus', async ({ page }) => {
  createdPayloads.length = 0
  await mockProjects(page)
  await page.goto('/projects/new', { waitUntil: 'networkidle' })

  // Fokus langsung ke kolom deskripsi lewat keyboard.
  const textarea = page.getByLabel('Deskripsi Website')
  await textarea.focus()
  await expect(textarea).toBeFocused()
  await page.keyboard.type(
    'Jasa desain grafis freelance yang mengerjakan logo dan materi promosi usaha kecil.',
  )
  await expect(textarea).toHaveValue(/Jasa desain grafis/)

  // Tab dari deskripsi -> nama usaha; isi dengan keyboard.
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Nama usaha atau brand')).toBeFocused()
  await page.keyboard.type('Studio Aris')

  // Kirim tanpa tetikus: fokuskan tombol aksi lalu Enter.
  const submit = page.getByRole('button', { name: 'Simpan & Buatkan Website' })
  await submit.focus()
  await expect(submit).toBeFocused()
  await page.keyboard.press('Enter')

  await expectWorkspaceUrl(page)
  const payload = createdPayloads[0] as { brief: { business_name?: string } }
  expect(payload.brief.business_name).toBe('Studio Aris')
})

test('pilihan radio & chip dapat dipakai dengan panah keyboard', async ({ page }) => {
  await mockProjects(page)
  await page.goto('/projects/new', { waitUntil: 'networkidle' })

  // Radio "Jenis usaha": fokus pada pilihan pertama, panah bawah 1x.
  const firstRadio = page.getByRole('radio', { name: /Makanan & minuman/ })
  await firstRadio.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('radio', { name: /Pakaian & aksesori/ })).toBeChecked()

  // Chip gaya: fokus + Space menyalakan.
  await openGroup(page, 'Tampilan')
  const chip = page.getByRole('checkbox', { name: 'Minimalis' })
  await chip.focus()
  await page.keyboard.press('Space')
  await expect(chip).toBeChecked()

  // Radio bahasa (segmented control) memakai panah juga.
  const langAuto = page.getByRole('radio', { name: /Otomatis/ })
  await langAuto.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: /Indonesia/ })).toBeChecked()
})

test('error server VALIDATION_ERROR memetakan pesan ke field yang tepat', async ({ page }) => {
  createdPayloads.length = 0
  await mockLogin(page)
  await page.route('**/api/v1/projects', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 400,
        json: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            fields: {
              description: 'must be at least 10 characters',
              style: 'must be at most 200 characters',
            },
          },
        },
      })
    }
    return route.continue()
  })
  await page.goto('/projects/new', { waitUntil: 'networkidle' })
  await page.getByLabel('Deskripsi Website').fill('cukup panjang untuk lolos validasi klien')
  await page.getByRole('button', { name: 'Simpan & Buatkan Website' }).click()
  // description -> field brief; style -> ditampilkan apa adanya di banner.
  await expect(page.getByText('Server menolak: must be at least 10 characters')).toBeVisible()
  await expect(page.getByText('style: must be at most 200 characters')).toBeVisible()
  await expect(page).toHaveURL(/\/projects\/new/)
})