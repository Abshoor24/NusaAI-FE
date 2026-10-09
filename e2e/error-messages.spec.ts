import { test, expect } from '@playwright/test'
import { envelope, mockLogin } from './workspace-helpers'

/**
 * Fase 3.3: pesan error yang sampai ke UI selalu Bahasa Indonesia.
 *
 * Backend dan browser bisa mengirim teks apa saja (termasuk Bahasa Inggris
 * atau halaman error proxy). Yang diuji di sini: untuk setiap kondisi
 * kegagalan, yang tampil adalah pesan Indonesia dengan langkah
 * berikutnya, di dalam elemen role="alert", dan tidak ada satu pun
 * potongan pesan mentah backend yang bocor ke layar.
 *
 * Semua endpoint di-mock; tidak ada panggilan ke backend sungguhan.
 */

/** Potongan yang tidak boleh muncul di layar jika mapper bocor. */
const LEAKS = [
  'Failed to fetch',
  'NetworkError',
  'Bad Gateway',
  'Gateway Timeout',
  'Service Unavailable',
  'Internal Server Error',
  'upstream exploded',
  'nginx',
  'traceback',
]

async function expectIndonesianAlert(page: import('@playwright/test').Page, pattern: RegExp) {
  const alert = page.getByRole('alert')
  await expect(alert, 'pesan error harus berada di elemen role="alert"').toBeVisible({ timeout: 15000 })
  const text = (await alert.innerText()).trim()
  expect(text, `pesan harus Indonesia: "${text}"`).toMatch(pattern)
  for (const leak of LEAKS) {
    expect(text, `pesan mentah "${leak}" bocor ke layar`).not.toContain(leak)
  }
  return text
}

test.describe('pesan error Bahasa Indonesia', () => {
  test('login: jaringan gagal (route.abort) → pesan Indonesia dengan langkah', async ({ page }) => {
    await page.route('**/api/v1/auth/login', (route) => route.abort('connectionfailed'))
    await page.goto('/login', { waitUntil: 'networkidle' })
    await page.getByLabel('Alamat Email').fill('e2e@example.com')
    await page.getByLabel('Kata Sandi').fill('Password123')
    await page.getByRole('button', { name: 'Masuk' }).click()
    await expectIndonesianAlert(page, /Tidak dapat terhubung ke server\. Periksa koneksi internet/)
  })

  test('login: 502 dengan pesan backend Bahasa Inggris tidak bocor', async ({ page }) => {
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({
        status: 502,
        contentType: 'text/html',
        body: '<html><body>nginx: upstream exploded</body></html>',
      }),
    )
    await page.goto('/login', { waitUntil: 'networkidle' })
    await page.getByLabel('Alamat Email').fill('e2e@example.com')
    await page.getByLabel('Kata Sandi').fill('Password123')
    await page.getByRole('button', { name: 'Masuk' }).click()
    await expectIndonesianAlert(page, /Layanan sedang tidak tersedia\. Coba lagi/)
    // Body non-JSON: kode tidak terbaca, jalur status yang dipakai.
    await expect(page.getByRole('alert')).not.toContainText('nginx')
  })

  test('login: 500 dengan body non-JSON → pesan Indonesia, bukan "Server mati" dari proxy', async ({
    page,
  }) => {
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({ status: 500, contentType: 'text/plain', body: '502 Bad Gateway from proxy' }),
    )
    await page.goto('/login', { waitUntil: 'networkidle' })
    await page.getByLabel('Alamat Email').fill('e2e@example.com')
    await page.getByLabel('Kata Sandi').fill('Password123')
    await page.getByRole('button', { name: 'Masuk' }).click()
    await expectIndonesianAlert(page, /Terjadi kesalahan pada server\. Coba lagi/)
    await expect(page.getByRole('alert')).not.toContainText('Bad Gateway')
  })

  test('settings: 503 → "Layanan sedang tidak tersedia" di role=alert', async ({ page }) => {
    await mockLogin(page)
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({
        status: 503,
        json: { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Service Unavailable' } },
      }),
    )
    await page.goto('/settings', { waitUntil: 'networkidle' })
    const text = await expectIndonesianAlert(page, /Layanan sedang tidak tersedia/)
    expect(text).not.toContain('Service Unavailable')
    await expect(page.getByRole('button', { name: 'Coba lagi' })).toBeVisible()
  })

  test('settings: 504 Gateway Timeout → pesan Indonesia', async ({ page }) => {
    await mockLogin(page)
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({
        status: 504,
        json: { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Gateway Timeout' } },
      }),
    )
    await page.goto('/settings', { waitUntil: 'networkidle' })
    await expectIndonesianAlert(page, /Layanan sedang tidak tersedia/)
  })

  test('settings: 429 dengan Retry-After → hitung mundur Bahasa Indonesia', async ({ page }) => {
    await mockLogin(page)
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({
        status: 429,
        headers: { 'Retry-After': '42', 'Access-Control-Expose-Headers': 'Retry-After' },
        json: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
      }),
    )
    await page.goto('/settings', { waitUntil: 'networkidle' })
    await expectIndonesianAlert(page, /Terlalu banyak permintaan\. Coba lagi dalam 42 detik/)
  })

  test('daftar project: 500 dengan traceback backend tidak bocor', async ({ page }) => {
    await mockLogin(page)
    await page.route('**/api/v1/projects?*', (route) =>
      route.fulfill({
        status: 500,
        json: {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Traceback (most recent call last): File "app.py", line 42',
          },
        },
      }),
    )
    await page.goto('/projects', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Gagal memuat project' })).toBeVisible({
      timeout: 15000,
    })
    const text = (await page.getByRole('heading', { name: 'Gagal memuat project' }).locator('..').innerText())
      .trim()
    expect(text).toMatch(/Terjadi kesalahan pada server\. Coba lagi beberapa saat/)
    expect(text).not.toContain('Traceback')
    expect(text).not.toContain('app.py')
  })

  test('daftar project: jaringan gagal saat memuat → pesan Indonesia', async ({ page }) => {
    await mockLogin(page)
    await page.route('**/api/v1/projects?*', (route) => route.abort('connectionfailed'))
    await page.goto('/projects', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Gagal memuat project' })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByText(/Tidak dapat terhubung ke server/)).toBeVisible()
    await expect(page.getByText(/Failed to fetch/)).toHaveCount(0)
  })

  test('workspace: 502 dari endpoint versi → pesan Indonesia di role=alert', async ({ page }) => {
    await mockLogin(page)
    await page.route('**/api/v1/projects/p1*', (route) => {
      if (/\/versions\/\d+$/.test(route.request().url())) {
        return route.fulfill({
          status: 502,
          json: { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Bad Gateway' } },
        })
      }
      return route.fulfill({
        json: envelope({
          id: 'p1',
          title: 'Kopi Senja',
          status: 'ready',
          brief: { description: 'Deskripsi project.' },
          version_count: 1,
          latest_version: {
            id: 'v1',
            project_id: 'p1',
            version_number: 1,
            kind: 'generate',
            prompt: 'brief',
            html: '<html><body><h1>Versi 1</h1></body></html>',
            created_at: '2026-01-01T00:00:00Z',
          },
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        }),
      })
    })
    await page.route('**/api/v1/projects/p1/versions', (route) =>
      route.fulfill({
        json: envelope([
          {
            id: 'v1',
            project_id: 'p1',
            version_number: 1,
            kind: 'generate',
            prompt: 'brief',
            created_at: '2026-01-01T00:00:00Z',
          },
        ]),
      }),
    )
    await page.route('**/api/v1/projects/p1/attachments', (route) => route.fulfill({ json: envelope([]) }))

    await page.route('**/api/v1/projects/p1/export*', (route) =>
      route.fulfill({
        status: 502,
        json: { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Bad Gateway' } },
      }),
    )
    await page.goto('/projects/p1', { waitUntil: 'networkidle' })
    // Ekspor memanggil /projects/{id}/export; pesannya tampil di banner status
    // dan harus Bahasa Indonesia.
    await page.getByRole('button', { name: 'Unduh' }).first().click()
    await expect(page.getByRole('status').filter({ hasText: /Layanan sedang tidak tersedia/ })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByText('Bad Gateway')).toHaveCount(0)
  })
})