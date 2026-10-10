import { test, expect, type Page } from '@playwright/test'
import { envelope, mockLogin, mockWorkspaceApi, versionHtml } from './workspace-helpers'
import {
  installErrorHooks,
  expectLayoutInvariants,
  expectNoPageErrors,
  type ErrorHooks,
} from './helpers/layout-invariants'

/**
 * Fase 1 (RED): jelajah semua tautan sidebar bolak-balik, termasuk dari
 * keadaan setelah interaksi form. Setiap halaman harus berisi konten
 * bermakna dan invarian layout (<main> tak tergulir) harus lolos.
 * Seluruh endpoint di-mock: lolos di CI tanpa backend/AI.
 */

function project(title: string) {
  return {
    id: 'p1',
    title,
    status: 'ready',
    brief: { description: 'Deskripsi project untuk pengujian E2E.' },
    version_count: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

async function mockNavApi(page: Page): Promise<void> {
  await mockLogin(page)
  await page.route('**/api/v1/projects**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: envelope([project('Kopi Senja')]) })
    }
    return route.continue()
  })
  await mockWorkspaceApi(page, 'p1', {
    status: 'ready',
    title: 'Kopi Senja',
    versions: [
      { id: 'v1', version_number: 1, kind: 'generate', prompt: 'brief', html: versionHtml(1) },
    ],
  })
}

async function cekHalaman(
  page: Page,
  label: string,
  heading: RegExp,
): Promise<void> {
  await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({
    timeout: 15000,
  })
  await page.waitForTimeout(300)
  await expectLayoutInvariants(page, { label, formExpected: true })
}

test('jelajah sidebar bolak-balik + dari keadaan rusak', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  const hooks: ErrorHooks = installErrorHooks(page)
  await mockNavApi(page)

  // 1. Daftar project.
  await page.goto('/projects', { waitUntil: 'networkidle' })
  await cekHalaman(page, 'daftar', /Project Saya/)
  await expect(page.getByText('Kopi Senja')).toBeVisible()

  // 2. Ke form via sidebar, rusak-kan lewat chip, invarian harus tetap lolos.
  await page.getByRole('link', { name: /Buat Website/ }).first().click()
  await expect(page).toHaveURL(/\/projects\/new/)
  await cekHalaman(page, 'new-sebelum-interaksi', /Ceritakan usahamu/)
  const tampilan = page.getByRole('button', { name: /2\. Tampilan/ }).first()
  if ((await tampilan.getAttribute('aria-expanded')) !== 'true') await tampilan.click()
  await page.getByText('Minimalis', { exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Minimalis' })).toBeChecked()
  await page.waitForTimeout(300)
  await expectLayoutInvariants(page, { label: 'new-setelah-chip' })

  // 3. Kembali ke daftar: konten bermakna, tidak kosong.
  await page.getByRole('link', { name: /Project Saya/ }).first().click()
  await expect(page).toHaveURL('/projects')
  await cekHalaman(page, 'daftar-lagi', /Project Saya/)

  // 4. Pengaturan via menu akun.
  await page.getByRole('button', { name: 'Menu akun' }).click()
  await page.getByRole('link', { name: /Pengaturan/ }).click()
  await expect(page).toHaveURL('/settings')
  await cekHalaman(page, 'settings', /Profil & Pengaturan/)

  // 5. Workspace data mock.
  await page.goto('/projects/p1', { waitUntil: 'networkidle' })
  await expect(page.getByText('Kopi Senja').first()).toBeVisible({ timeout: 15000 })
  await page.waitForTimeout(300)
  await expectLayoutInvariants(page, { label: 'workspace' })

  // 6. 404: pesan + tautan kembali.
  await page.goto('/rute-yang-tidak-ada', { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { name: /Halaman Tidak Ditemukan/ })).toBeVisible()
  await page.waitForTimeout(300)
  await expectLayoutInvariants(page, { label: '404', formExpected: false })
  await page.getByRole('link', { name: /Kembali ke Project/ }).click()
  await expect(page).toHaveURL('/projects')
  await cekHalaman(page, 'daftar-dari-404', /Project Saya/)

  // 7. Kembali ke form: tetap utuh.
  await page.getByRole('link', { name: /Buat Website/ }).first().click()
  await expect(page).toHaveURL(/\/projects\/new/)
  await cekHalaman(page, 'new-terakhir', /Ceritakan usahamu/)

  expectNoPageErrors(hooks, 'navigasi')
})
