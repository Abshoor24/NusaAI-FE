import { test, expect } from '@playwright/test'
import { envelope, mockLogin, mockWorkspaceApi } from './workspace-helpers'
import {
  installErrorHooks,
  expectLayoutInvariants,
  expectNoPageErrors,
  type ErrorHooks,
} from './helpers/layout-invariants'

/**
 * Fase 3.3: status tiap route /_app — pending "Memuat…", error fallback
 * Indonesia + tombol coba lagi, workspace gagal. Sidebar tetap tampil,
 * invarian layout lolos, tanpa pageerror. API selalu di-mock (mode CI).
 */

function project() {
  return {
    id: 'p1',
    title: 'Kopi Senja',
    status: 'draft',
    brief: { description: 'Deskripsi project untuk pengujian E2E.' },
    version_count: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

test('daftar: memuat lalu tampil, sidebar tetap ada', async ({ page }) => {
  const hooks: ErrorHooks = installErrorHooks(page)
  await mockLogin(page)
  await page.route('**/api/v1/projects**', async (route) => {
    if (route.request().method() === 'GET') {
      await new Promise((r) => setTimeout(r, 800))
      return route.fulfill({ json: envelope([project()]) })
    }
    return route.continue()
  })
  await page.goto('/projects')
  await expect(page.getByText('Memuat project…')).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeVisible()
  await expect(page.getByText('Kopi Senja')).toBeVisible({ timeout: 10000 })
  await expectLayoutInvariants(page, { label: 'daftar-ok', formExpected: false })
  expectNoPageErrors(hooks, 'daftar-memuat')
})

test('daftar: gagal lalu Coba Lagi berbahasa Indonesia', async ({ page }) => {
  const hooks: ErrorHooks = installErrorHooks(page)
  await mockLogin(page)
  let gagal = true
  await page.route('**/api/v1/projects**', (route) => {
    if (route.request().method() === 'GET') {
      if (gagal) {
        return route.fulfill({
          status: 500,
          json: { success: false, error: { code: 'INTERNAL', message: 'Server mati' } },
        })
      }
      return route.fulfill({ json: envelope([project()]) })
    }
    return route.continue()
  })
  await page.goto('/projects')
  await expect(page.getByRole('heading', { name: 'Gagal memuat project' })).toBeVisible({
    timeout: 15000,
  })
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeVisible()
  const retry = page.getByRole('button', { name: 'Coba Lagi' })
  await expect(retry).toBeVisible()
  gagal = false
  await retry.click()
  await expect(page.getByText('Kopi Senja')).toBeVisible({ timeout: 10000 })
  await expectLayoutInvariants(page, { label: 'daftar-pulih', formExpected: false })
  expectNoPageErrors(hooks, 'daftar-error')
})

test('settings: gagal lalu coba lagi', async ({ page }) => {
  const hooks: ErrorHooks = installErrorHooks(page)
  await mockLogin(page)
  let gagal = true
  await page.route('**/api/v1/auth/me', (route) => {
    if (gagal) {
      return route.fulfill({
        status: 500,
        json: { success: false, error: { code: 'INTERNAL', message: 'Server mati' } },
      })
    }
    return route.fulfill({
      json: envelope({ id: 'u1', email: 'budi@example.com', created_at: '2026-01-01T00:00:00Z' }),
    })
  })
  await page.goto('/settings')
  await expect(page.getByText(/Gagal memuat profil/)).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeVisible()
  gagal = false
  await page.getByRole('button', { name: 'Coba lagi' }).click()
  await expect(page.getByText('budi@example.com')).toBeVisible({ timeout: 10000 })
  await expectLayoutInvariants(page, { label: 'settings-pulih', formExpected: false })
  expectNoPageErrors(hooks, 'settings-error')
})

test('workspace gagal: pesan Indonesia + aksi coba lagi', async ({ page }) => {
  const hooks: ErrorHooks = installErrorHooks(page)
  await mockLogin(page)
  await mockWorkspaceApi(page, 'p1', { status: 'failed', title: 'Kopi Senja', versions: [] })
  await page.goto('/projects/p1', { waitUntil: 'networkidle' })
  await expect(page.getByText('Generate Gagal: Coba Lagi')).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeVisible()
  await expectLayoutInvariants(page, { label: 'workspace-gagal', formExpected: false })
  expectNoPageErrors(hooks, 'workspace-gagal')
})
