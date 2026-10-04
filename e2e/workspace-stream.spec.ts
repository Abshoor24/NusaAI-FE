import { test, expect } from '@playwright/test'
import {
  mockLogin,
  mockWorkspaceApi,
  sseBody,
  versionHtml,
  type WorkspaceState,
} from './workspace-helpers'

/**
 * Kasus tepi stream SSE (semua di-mock, tanpa AI sungguhan).
 */

async function gotoDraftWorkspace(page: import('@playwright/test').Page): Promise<void> {
  await mockLogin(page)
  const state: WorkspaceState = { status: 'draft', title: 'Tes', versions: [] }
  await mockWorkspaceApi(page, 'p1', state)
  await page.goto('/projects/p1')
  await expect(page.getByRole('button', { name: 'Buat Website', exact: true })).toBeVisible()
}

test('Batal menghentikan stream dan UI kembali normal (bukan gagal AI)', async ({ page }) => {
  await gotoDraftWorkspace(page)
  // Gantung request tanpa respons: stream tidak pernah selesai.
  await page.route('**/api/v1/projects/p1/generate', () => {})
  await page.getByRole('button', { name: 'Buat Website', exact: true }).click()

  await expect(page.getByText(/Menyiapkan AI/)).toBeVisible({ timeout: 10000 })
  await page.getByRole('button', { name: 'Batalkan' }).click()

  await expect(page.getByText('Dibatalkan. Memuat status terbaru…')).toBeVisible()
  // Tidak ada alert kegagalan AI, tombol generate tersedia lagi.
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Buat Website', exact: true })).toBeEnabled()
})

test('stream tanpa event done -> pesan STREAM_INTERRUPTED yang ramah', async ({ page }) => {
  await gotoDraftWorkspace(page)
  await page.route('**/api/v1/projects/p1/generate', (route) =>
    route.fulfill({
      contentType: 'text/event-stream',
      body: sseBody(['<h1>', 'setengah jalan']),
    }),
  )
  await page.getByRole('button', { name: 'Buat Website', exact: true }).click()

  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Koneksi AI terputus, coba lagi.', { timeout: 10000 })
})

test('429 + Retry-After pendek -> countdown tampil dan tombol aktif lagi', async ({ page }) => {
  await gotoDraftWorkspace(page)
  await page.route('**/api/v1/projects/p1/generate', (route) =>
    route.fulfill({
      status: 429,
      // Tanpa expose header, fetch (CORS) tidak bisa membaca Retry-After
      // sehingga aplikasi memakai default 60 detik.
      headers: {
        'Retry-After': '2',
        'Content-Type': 'application/json',
        'Access-Control-Expose-Headers': 'Retry-After',
      },
      json: { success: false, error: { code: 'RATE_LIMITED', message: 'Terlalu banyak' } },
    }),
  )
  await page.getByRole('button', { name: 'Buat Website', exact: true }).click()

  await expect(page.getByText(/Tombol aktif lagi dalam \d+ detik/)).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('button', { name: 'Buat Website', exact: true })).toBeEnabled({
    timeout: 10000,
  })
})

test('AI_PROVIDER_ERROR OUTPUT_BLOCKED -> pesan Indonesia dengan role alert', async ({ page }) => {
  await gotoDraftWorkspace(page)
  await page.route('**/api/v1/projects/p1/generate', (route) =>
    route.fulfill({
      status: 502,
      headers: { 'Content-Type': 'application/json' },
      json: {
        success: false,
        error: { code: 'AI_PROVIDER_ERROR', message: 'blocked', reason: 'OUTPUT_BLOCKED' },
      },
    }),
  )
  await page.getByRole('button', { name: 'Buat Website', exact: true }).click()

  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Permintaan ditolak filter keamanan', { timeout: 10000 })
})

test('reload saat generating tanpa stream lokal -> polling lalu berhenti saat ready', async ({
  page,
}) => {
  await mockLogin(page)
  const state: WorkspaceState = { status: 'generating', title: 'Tes', versions: [] }
  await mockWorkspaceApi(page, 'p1', state)

  await page.goto('/projects/p1')
  await expect(page.getByText('Sedang diproses…')).toBeVisible({ timeout: 10000 })

  // Backend selesai ~1 detik kemudian; polling 4 detik harus menangkapnya.
  setTimeout(() => {
    state.status = 'ready'
    state.versions = [
      { id: 'v1', version_number: 1, kind: 'generate', prompt: 'brief', html: versionHtml(1) },
    ]
  }, 1000)

  await expect(page.getByText('Siap').first()).toBeVisible({ timeout: 15000 })
  await expect(page.locator('iframe[title="Pratinjau website"]')).toBeVisible({ timeout: 10000 })
})
