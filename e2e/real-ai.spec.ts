import { test, expect } from '@playwright/test'

/**
 * Smoke test AI SUNGGUHAN (Gemini via backend 127.0.0.1:8080).
 * Dilewati kecuali RUN_REAL_AI=1 — jangan dijalankan di CI reguler
 * (lambat ±1 menit dan memakan kuota AI).
 */
test('smoke generate AI sungguhan @real-ai @needs-backend', async ({ page, request }) => {
  test.skip(!process.env.RUN_REAL_AI, 'butuh RUN_REAL_AI=1 dan backend+kuota AI')
  test.setTimeout(180_000)

  const email = `realai_${Date.now()}@example.com`
  const reg = await request.post('http://127.0.0.1:8080/api/v1/auth/register', {
    data: { email, password: 'Password123' },
  })
  expect(reg.ok()).toBeTruthy()

  await page.goto('/login')
  await page.getByLabel('Alamat Email').fill(email)
  await page.getByLabel('Kata Sandi').fill('Password123')
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page).toHaveURL(/\/projects/, { timeout: 15000 })

  await page.goto('/projects/new')
  await page
    .getByLabel(/Deskripsi Website/)
    .fill('Landing page sederhana untuk toko roti Bahagia di Jakarta. Ada hero, menu, dan kontak.')
  await page.getByRole('button', { name: 'Simpan & Buatkan Website' }).click()

  await expect(page).toHaveURL(/\/projects\/.+\?.*autostart/, { timeout: 15000 })
  await expect(page.getByText(/berhasil disimpan/)).toBeVisible({ timeout: 150000 })
  await expect(page.locator('iframe[title="Pratinjau website"]')).toBeVisible()
})
