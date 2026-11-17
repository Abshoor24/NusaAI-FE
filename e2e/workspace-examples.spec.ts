import { test, expect } from '@playwright/test'
import {
  mockExamplesApi,
  mockLogin,
  mockWorkspaceApi,
  type WorkspaceState,
} from './workspace-helpers'

async function gotoDraftWorkspace(page: import('@playwright/test').Page): Promise<void> {
  await mockLogin(page)
  await mockExamplesApi(page)
  const state: WorkspaceState = { status: 'draft', title: 'Tes', versions: [] }
  await mockWorkspaceApi(page, 'p1', state)
  await page.goto('/projects/p1')
  await expect(page.getByRole('button', { name: 'Buat Website', exact: true })).toBeVisible()
}

test('selama menunggu, galeri contoh tampil dengan label Contoh hasil', async ({ page }) => {
  await gotoDraftWorkspace(page)
  await page.route('**/api/v1/projects/p1/generate', () => {})

  await page.getByRole('button', { name: 'Buat Website', exact: true }).click()

  await expect(page.getByText('Sambil menunggu, lihat contoh hasil')).toBeVisible({
    timeout: 10000,
  })
  await expect(page.getByText('Brief diterima')).toBeVisible()
  await expect(page.getByText('Menunggu AI')).toBeVisible()
  await expect(page.getByText('Kopi Arum')).toBeVisible()
  await expect(page.getByText('Bengkel Jaya Motor')).toBeVisible()

  await page.getByRole('button', { name: 'Batalkan' }).click()
})

test('AI_BUSY menampilkan contoh terdekat berlabel, bukan hasil generate', async ({ page }) => {
  await gotoDraftWorkspace(page)
  await page.route('**/api/v1/projects/p1/generate', (route) =>
    route.fulfill({
      status: 503,
      headers: { 'Content-Type': 'application/json' },
      json: {
        success: false,
        error: {
          code: 'AI_BUSY',
          message: 'Semua model AI sedang sibuk.',
          reason: 'quota',
        },
      },
    }),
  )

  await page.getByRole('button', { name: 'Buat Website', exact: true }).click()

  await expect(page.getByText('Contoh hasil, AI sedang sibuk')).toBeVisible({
    timeout: 10000,
  })
  await expect(page.getByText('Kopi Arum')).toBeVisible()
  await expect(page.getByText('Ini bukan hasil generate proyek Anda.', { exact: false })).toBeVisible()
  await expect(page.getByText(/Versi \d+ berhasil disimpan/)).toHaveCount(0)

  await page.getByRole('button', { name: 'Lihat contoh' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Contoh hasil, AI sedang sibuk')
  await expect(dialog.locator('iframe')).toBeVisible()
})
