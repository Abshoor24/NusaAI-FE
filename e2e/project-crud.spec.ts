import { test, expect } from '@playwright/test'

/**
 * Alur utama project dengan API dimock penuh (tanpa backend/AI):
 * lihat daftar → rename → hapus → logout.
 */
function envelope(data: unknown) {
  return { success: true, message: 'ok', data }
}

function project(title: string) {
  return {
    id: 'p1',
    title,
    status: 'draft',
    brief: { description: 'Deskripsi project untuk pengujian E2E.' },
    version_count: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

test('daftar, rename, hapus, lalu logout', async ({ page }) => {
  let title = 'Kopi Senja'
  let deleted = false

  await page.addInitScript(() => {
    window.localStorage.setItem('nusa_auth_token', 'e2e-token')
  })

  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      json: envelope({ id: 'u1', email: 'e2e@example.com', created_at: '2026-01-01T00:00:00Z' }),
    }),
  )
  await page.route('**/api/v1/projects**', (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      return route.fulfill({ json: envelope(deleted ? [] : [project(title)]) })
    }
    if (method === 'PATCH') {
      title = 'Judul Baru E2E'
      return route.fulfill({ json: envelope(project(title)) })
    }
    if (method === 'DELETE') {
      deleted = true
      return route.fulfill({ json: { success: true, message: 'Project deleted', data: null } })
    }
    return route.continue()
  })

  await page.goto('/projects')
  await expect(page.getByRole('heading', { name: 'Project Saya' })).toBeVisible()
  await expect(page.getByText('Kopi Senja')).toBeVisible()

  // Rename.
  await page.getByRole('button', { name: /Judul/ }).click()
  await expect(page.getByRole('dialog')).toContainText('Ubah Judul Project')
  await page.getByLabel('Judul project baru').fill('Judul Baru E2E')
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('Judul Baru E2E')).toBeVisible()

  // Hapus.
  await page.getByRole('button', { name: /Hapus/ }).click()
  await expect(page.getByRole('dialog')).toContainText('Hapus Project?')
  await page.getByRole('button', { name: 'Ya, Hapus' }).click()
  await expect(page.getByText(/Belum ada (website|project)/)).toBeVisible()


  // Logout via halaman pengaturan.
  await page.goto('/settings')
  await page.getByRole('button', { name: 'Keluar dari sesi' }).click()
  await expect(page).toHaveURL(/\/login/)
})
