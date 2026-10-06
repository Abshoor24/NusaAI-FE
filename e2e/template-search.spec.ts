import { test, expect } from '@playwright/test'
import { mockLogin } from './workspace-helpers'

test.describe('Param ?template di /projects/new', () => {
  test('E2E: page.goto langsung ke /projects/new?template=kedai-kopi pre-populasi form brief', async ({ page }) => {
    await mockLogin(page)
    await page.goto('/projects/new?template=kedai-kopi')

    await expect(page.getByRole('heading', { name: 'Ceritakan usahamu, kami buatkan websitenya' })).toBeVisible()


    // Form description pre-filled with kedai-kopi template
    const descTextarea = page.getByLabel('Deskripsi Website')
    await expect(descTextarea).toBeVisible()
    await expect(descTextarea).toHaveValue(/Kedai kopi kecil di Purwokerto/)

    // Category is pre-selected as kuliner
    const categoryRadio = page.getByRole('radio', { name: /Makanan & minuman/ })
    await expect(categoryRadio).toBeChecked()
  })
})
