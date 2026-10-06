import { test, expect, type Page } from '@playwright/test'
import { envelope, mockLogin } from './workspace-helpers'
import {
  installErrorHooks,
  expectLayoutInvariants,
  expectNoPageErrors,
  type ErrorHooks,
} from './helpers/layout-invariants'

/**
 * Fase 1 (RED): tiap kontrol brief di tiap accordion (mouse + keyboard).
 * Invarian layout di-assert SETELAH SETIAP interaksi — sebelum perbaikan,
 * klik pertama pada kontrol sr-only langsung menggulir <main> (bug layar
 * kosong). Seluruh endpoint di-mock: lolos di CI tanpa backend/AI.
 */

const VIEWPORTS = [
  { label: '360x740', width: 360, height: 740 },
  { label: '768x1024', width: 768, height: 1024 },
  { label: '1280x800', width: 1280, height: 800 },
  { label: '1280x600-rendah', width: 1280, height: 600 },
]

async function mockBriefApi(page: Page): Promise<void> {
  await mockLogin(page)
  // Generik dulu, spesifik belakangan (yang belakangan menang).
  await page.route('**/api/v1/projects**', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        json: envelope({
          id: 'p1',
          title: 'E2E',
          status: 'draft',
          brief: { description: 'Deskripsi project untuk pengujian E2E.' },
          version_count: 0,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        }),
      })
    }
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: envelope([]) })
    }
    return route.continue()
  })
  await page.route('**/api/v1/projects/p1/generate', (route) =>
    route.fulfill({
      status: 409,
      json: { success: false, error: { code: 'CONFLICT', message: 'mock: tidak memanggil AI' } },
    }),
  )
}

async function openGroup(page: Page, title: string, vp: string): Promise<void> {
  const btn = page.getByRole('button', { name: new RegExp(title) }).first()
  await expect(btn, `accordion ${title} terlihat`).toBeVisible({ timeout: 15000 })
  if ((await btn.getAttribute('aria-expanded')) !== 'true') await btn.click()
  await expect(btn).toHaveAttribute('aria-expanded', 'true')
  await page.waitForTimeout(400)
  await expectLayoutInvariants(page, { label: `${vp}:buka-${title}` })
}

async function cek(page: Page, vp: string, langkah: string): Promise<void> {
  await page.waitForTimeout(300)
  await expectLayoutInvariants(page, { label: `${vp}:${langkah}` })
}

async function switchState(page: Page, name: RegExp): Promise<string | null> {
  return page.getByRole('switch', { name }).first().getAttribute('aria-checked')
}

for (const vp of VIEWPORTS) {
  test(`interaksi semua kontrol brief — ${vp.label}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    const hooks: ErrorHooks = installErrorHooks(page)
    await mockBriefApi(page)
    await page.goto('/projects/new', { waitUntil: 'networkidle' })

    await expect(page.getByLabel('Deskripsi Website')).toBeVisible()
    await cek(page, vp.label, 'awal')

    // ── Accordion dibuka satu per satu ──
    for (const g of ['Tampilan', 'Isi halaman', 'Kontak & tombol utama', 'Gambar referensi']) {
      await openGroup(page, g, vp.label)
    }

    // ── Tampilan: chip gaya (MOUSE, klik label) ──
    await page.getByText('Minimalis', { exact: true }).click()
    await expect(page.getByRole('checkbox', { name: 'Minimalis' })).toBeChecked()
    await cek(page, vp.label, 'chip-minimalis')
    await page.getByText('Hangat', { exact: true }).click()
    await cek(page, vp.label, 'chip-hangat')

    // ── Tampilan: segmented bahasa ──
    await page.getByText('Indonesia', { exact: true }).click()
    await expect(page.getByRole('radio', { name: /Indonesia/ })).toBeChecked()
    await cek(page, vp.label, 'segmented-indonesia')

    // ── Tampilan: mode warna + palet + hex ──
    await page.getByText('Pilih sendiri', { exact: true }).click()
    await cek(page, vp.label, 'mode-custom')
    await page.getByRole('button', { name: 'Elegan' }).click()
    await expect(page.getByLabel('Warna utama', { exact: true })).toHaveValue('#1E3A8A')
    await cek(page, vp.label, 'palet-elegan')
    await page.getByLabel('Warna utama', { exact: true }).fill('#6F4E37')
    await cek(page, vp.label, 'hex-manual')

    // ── Tentang: kartu jenis usaha + tujuan ──
    await page.getByText('Makanan & minuman', { exact: true }).click()
    await cek(page, vp.label, 'kategori-kuliner')
    await page.getByText('Menerima pesanan', { exact: true }).click()
    await cek(page, vp.label, 'tujuan-pesanan')

    // ── Isi halaman: switch manual, lalu ganti kategori (pilihan manual lestari) ──
    const s1before = await switchState(page, /Ulasan pelanggan/)
    await page.getByRole('switch', { name: /Ulasan pelanggan/ }).click()
    const s1 = await switchState(page, /Ulasan pelanggan/)
    expect(s1, 'toggle ulasan berbalik').not.toBe(s1before)
    await cek(page, vp.label, 'switch-ulasan')
    const s2before = await switchState(page, /Pertanyaan yang sering ditanyakan/)
    await page.getByRole('switch', { name: /Pertanyaan yang sering ditanyakan/ }).click()
    const s2 = await switchState(page, /Pertanyaan yang sering ditanyakan/)
    expect(s2, 'toggle faq berbalik').not.toBe(s2before)
    await cek(page, vp.label, 'switch-faq')

    await page.getByText('Pakaian & aksesori', { exact: true }).click()
    await expect(page.getByRole('switch', { name: /Ulasan pelanggan/ })).toHaveAttribute(
      'aria-checked',
      s1 ?? '',
    )
    await expect(
      page.getByRole('switch', { name: /Pertanyaan yang sering ditanyakan/ }),
    ).toHaveAttribute('aria-checked', s2 ?? '')
    await cek(page, vp.label, 'ganti-kategori-manual-lestari')

    await page.getByRole('button', { name: 'Atur ulang ke saran' }).click()
    await cek(page, vp.label, 'atur-ulang-saran')

    // ── Isi halaman: tambah bagian kustom (di dalam <details> lanjutan) ──
    await page.getByText('Lanjutan: tambah bagian sendiri').click()
    await page.getByLabel('Tambah bagian lain').fill('Promo Ramadan')
    await page.getByRole('button', { name: 'Tambah', exact: true }).click()
    await expect(page.getByText('Promo Ramadan')).toBeVisible()
    await cek(page, vp.label, 'bagian-kustom')

    // ── Kontak ──
    await page.getByLabel('Nomor WhatsApp').fill('081234567890')
    await cek(page, vp.label, 'kontak-wa')

    // ── KEYBOARD: chip + radio panah + segmented panah ──
    const chipModern = page.getByRole('checkbox', { name: 'Modern' })
    await chipModern.focus()
    await page.keyboard.press('Space')
    await expect(chipModern).toBeChecked()
    await cek(page, vp.label, 'kbd-chip-space')
    const radioMakanan = page.getByRole('radio', { name: /Makanan & minuman/ })
    await radioMakanan.focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('radio', { name: /Pakaian & aksesori/ })).toBeChecked()
    await cek(page, vp.label, 'kbd-radio-panah')
    const langAuto = page.getByRole('radio', { name: /Otomatis/ })
    await langAuto.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('radio', { name: /Indonesia/ })).toBeChecked()
    await cek(page, vp.label, 'kbd-segmented-panah')

    // ── Submit kosong: error validasi + fokus ke field salah pertama ──
    await page.getByLabel('Deskripsi Website').fill('')
    await page.getByRole('button', { name: 'Simpan & Buatkan Website' }).click()
    await expect(page.getByText('Ada isian yang perlu diperbaiki.')).toBeVisible()
    await expect(page.getByLabel('Deskripsi Website')).toBeFocused()
    await cek(page, vp.label, 'submit-error-fokus')

    expectNoPageErrors(hooks, vp.label)
  })
}
