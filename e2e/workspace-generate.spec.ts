import { test, expect } from '@playwright/test'
import {
  envelope,
  mockLogin,
  mockWorkspaceApi,
  sseBody,
  doneEvent,
  versionHtml,
  type WorkspaceState,
} from './workspace-helpers'

/**
 * Alur inti workspace dengan SSE di-mock (tanpa AI sungguhan):
 * buat project -> autostart generate -> ready v1 -> revisi v2.
 */

test('buat project, generate otomatis, lalu revisi', async ({ page }) => {
  await mockLogin(page)
  const state: WorkspaceState = { status: 'draft', title: 'Kedai Kopi', versions: [] }

  await page.route('**/api/v1/projects', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        json: envelope({
          id: 'p1',
          title: 'Kedai Kopi',
          status: 'draft',
          brief: { description: 'Landing page kedai kopi untuk pengujian E2E.' },
          version_count: 0,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        }),
      })
    }
    return route.continue()
  })
  await mockWorkspaceApi(page, 'p1', state)
  await page.route('**/api/v1/projects/p1/generate', async (route) => {
    // Tunda respons agar fase "Menyiapkan AI" sempat terlihat.
    await new Promise((resolve) => setTimeout(resolve, 1500))
    state.status = 'ready'
    state.versions = [
      { id: 'v1', version_number: 1, kind: 'generate', prompt: 'brief', html: versionHtml(1) },
    ]
    await route.fulfill({
      contentType: 'text/event-stream',
      body: sseBody(['<h1>', 'Versi 1', '</h1>'], doneEvent('p1', 1)),
    })
  })
  await page.route('**/api/v1/projects/p1/revise', (route) => {
    state.versions = [
      { id: 'v2', version_number: 2, kind: 'revise', prompt: 'instruksi', html: versionHtml(2) },
      ...state.versions,
    ]
    return route.fulfill({
      contentType: 'text/event-stream',
      body: sseBody(['<h1>', 'Versi 2', '</h1>'], doneEvent('p1', 2)),
    })
  })

  // Buat project lewat form.
  await page.goto('/projects/new')
  await page.getByLabel(/Deskripsi Website/).fill('Landing page kedai kopi untuk pengujian E2E.')
  await page.getByRole('button', { name: 'Simpan & Buatkan Website' }).click()

  // Otomatis masuk workspace dengan ?autostart=1 lalu generate.
  await expect(page).toHaveURL(/\/projects\/p1\?.*autostart/)
  await expect(page.getByText(/Menyiapkan AI/)).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('Versi 1 berhasil disimpan.')).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('Siap').first()).toBeVisible()
  await expect(page.getByText('Riwayat Versi (1)')).toBeVisible()

  // Revisi.
  await page.getByLabel(/Instruksi Revisi/).fill('Tambahkan section testimoni')
  await page.getByRole('button', { name: 'Kirim Revisi' }).click()
  await expect(page.getByText('Versi 2 berhasil disimpan.')).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('Riwayat Versi (2)')).toBeVisible()

  // "Revisi dari versi ini" pada versi 1 mengisi dasar revisi.
  const v1 = page.locator('li', { hasText: 'Versi 1' }).last()
  await v1.getByRole('button', { name: 'Revisi dari versi ini' }).click()
  await expect(page.getByLabel('Dasar Revisi')).toHaveValue('1')
})

test('revisi kosong ditolak di UI; tidak ada generate ulang setelah ready', async ({ page }) => {
  await mockLogin(page)
  const state: WorkspaceState = {
    status: 'ready',
    title: 'Siap',
    versions: [
      { id: 'v1', version_number: 1, kind: 'generate', prompt: 'brief', html: versionHtml(1) },
    ],
  }
  await mockWorkspaceApi(page, 'p1', state)

  await page.goto('/projects/p1')
  await expect(page.getByText('Siap').first()).toBeVisible()

  // Tombol kirim nonaktif saat instruksi kosong.
  await expect(page.getByRole('button', { name: 'Kirim Revisi' })).toBeDisabled()

  // Panel generate tidak ditawarkan untuk project yang sudah ready.
  await expect(page.getByRole('button', { name: 'Buat Website', exact: true })).toHaveCount(0)
  await expect(page.getByText('Revisi Website')).toBeVisible()
})
