import { test, expect } from '@playwright/test'

/**
 * Regresi bug 1.4: redirect pasca-login untuk URL ber-query.
 * Memakai backend sungguhan (127.0.0.1:8080) untuk register/login,
 * tanpa memanggil AI.
 */
const API = 'http://127.0.0.1:8080/api/v1'

async function registerAccount(request: import('@playwright/test').APIRequestContext) {
  const email = `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`
  const password = 'Password123'
  const res = await request.post(`${API}/auth/register`, { data: { email, password } })
  expect(res.ok()).toBeTruthy()
  return { email, password }
}

test('sesi habis di URL ber-query, login, kembali ke URL yang sama @needs-backend', async ({
  page,
  request,
}) => {
  const { email, password } = await registerAccount(request)

  // Tanpa token, guard mengarahkan ke login dengan param redirect.
  // Query harus terbawa (dalam bentuk kanonis apa pun, mis. "1" ber-quote).
  await page.goto('/projects/proyek-abc?autostart=1&withImages=1')
  await expect(page).toHaveURL(/\/login\?.*redirect=.*autostart/)

  await page.getByLabel('Alamat Email').fill(email)
  await page.getByLabel('Kata Sandi').fill(password)
  await page.getByRole('button', { name: 'Masuk' }).click()

  // Kembali ke URL asal beserta query-nya — inilah yang rusak sebelum 1.4.
  await expect(page).toHaveURL(/\/projects\/proyek-abc\?.*autostart/)
})

test('redirect asing ditolak, jatuh ke /projects @needs-backend', async ({ page, request }) => {
  const { email, password } = await registerAccount(request)

  await page.goto('/login?redirect=' + encodeURIComponent('https://evil.example/'))
  await page.getByLabel('Alamat Email').fill(email)
  await page.getByLabel('Kata Sandi').fill(password)
  await page.getByRole('button', { name: 'Masuk' }).click()

  await expect(page).toHaveURL('/projects')
})
