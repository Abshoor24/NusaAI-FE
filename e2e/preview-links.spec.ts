import { test, expect } from '@playwright/test'
import { mockLogin, mockWorkspaceApi, type WorkspaceState } from './workspace-helpers'

/**
 * UKURAN (bukan perbaikan) perilaku tautan di dalam preview.
 *
 * Hipotesis yang diuji:
 *  (a) tautan target="_blank" dari srcDoc preview membuka tab baru,
 *  (b) skrip di tab itu BERJALAN atau mati (sandbox diwarisi),
 *  (c) tautan TANPA target="_blank" menavigasi iframe-nya sendiri.
 *
 * Tidak ada perubahan pada PreviewFrame.tsx (Aturan Keras 2):
 * sandbox tetap persis "allow-scripts allow-popups". Hasil di sini
 * dipakai untuk keputusan Anda, bukan untuk membenahi apa pun.
 */

/** HTML preview dengan skrip penanda yang mengubah document.title. */
const HTML_WITH_LINKS = `<html><body style="font-family: sans-serif">
<h1 id="judul">Pratinjau uji tautan</h1>
<a id="wa" href="https://wa.me/628123456789" target="_blank" rel="noopener noreferrer">WhatsApp</a>
<a id="telp" href="tel:+628123456789" target="_blank" rel="noopener noreferrer">Telepon</a>
<a id="maps" href="https://maps.google.com/?q=Surabaya" target="_blank" rel="noopener noreferrer">Maps</a>
<a id="tanpa-target" href="https://example.com/tanpa-target">Tanpa target</a>
<script>document.body.setAttribute('data-skrip', 'jalan');</script>
</body></html>`

/**
 * Halaman target lokal: HTML yang mengubah document.title lewat skrip.
 * Dipakai untuk menguji apakah skrip di tab baru benar-benar berjalan.
 */
const TARGET_PAGE_HTML = `<html><head><title>sebelum</title></head><body>
<h1 id="tujuan">halaman target</h1>
<script>document.title = 'skrip-target-jalan';</script>
</body></html>`

async function setupPreview(page: import('@playwright/test').Page): Promise<void> {
  await mockLogin(page)
  const state: WorkspaceState = {
    status: 'ready',
    title: 'Uji tautan',
    versions: [{ id: 'v1', version_number: 1, kind: 'generate', prompt: 'brief', html: HTML_WITH_LINKS }],
  }
  await mockWorkspaceApi(page, 'p1', state)
  // CATATAN PENTING: mock harus dipasang pada CONTEXT, bukan page — tab baru
  // hasil klik target="_blank" adalah Page lain. Mock di page tidak berlaku,
  // dan tab baru akan mendarat di chrome-error://chromewebdata/.
  await page.context().route(TARGET_ORIGIN_GLOB, (route) => {
    console.log('[5.5] route mock:', route.request().url())
    return route.fulfill({ contentType: 'text/html', body: TARGET_PAGE_HTML })
  })
  await page.goto('/projects/p1', { waitUntil: 'networkidle' })
  await expect(page.frameLocator('iframe').locator('#judul')).toBeVisible({ timeout: 15000 })
}

/** Pola URL untuk ketiga domain luar yang dipakai di HTML preview. */
const TARGET_ORIGIN_GLOB = /https:\/\/(wa\.me|example\.com)\/.*/

test('ukur: skrip di dalam iframe berjalan (sandbox allow-scripts)', async ({ page }) => {
  await setupPreview(page)
  const flag = await page.frameLocator('iframe').locator('body').getAttribute('data-skrip')
  expect(flag).toBe('jalan')
})

test('ukur: (a) tautan target=_blank membuka tab baru', async ({ page, context }) => {
  await setupPreview(page)
  const pagesBefore = context.pages().length
  await page.frameLocator('iframe').locator('#wa').click()
  await page.waitForTimeout(1500)
  const pagesAfter = context.pages().length
  console.log('[5.5] tab sebelum:', pagesBefore, 'sesudah:', pagesAfter)
  expect(pagesAfter).toBeGreaterThan(pagesBefore)
})

test('ukur: (b) skrip di tab baru — hidup atau mati (sandbox diwarisi?)', async ({
  page,
  context,
}) => {
  await setupPreview(page)
  const before = context.pages().length
  await page.frameLocator('iframe').locator('#wa').click()
  await page.waitForTimeout(1500)
  const opened = context.pages().slice(before)
  expect(opened.length, 'tab baru harus terbuka').toBeGreaterThan(0)
  const tab = opened[0]

  await tab.waitForLoadState('domcontentloaded', { timeout: 10000 })
  const url = tab.url()
  const title = await tab.title()
  const hasTargetContent = await tab.locator('#tujuan').count()
  console.log(
    `[5.5] URL tab baru: ${url} | title: ${title} | elemen target ada: ${hasTargetContent > 0}`,
  )

  // Skrip target mengubah document.title menjadi 'skrip-target-jalan'.
  // Judul TIDAK berubah = skrip mati (sandbox diwarisi tab baru).
  expect(title, 'skrip di tab baru tidak berjalan').not.toBe('sebelum')
  expect(title, 'tab baru mewarisi sandbox tanpa allow-scripts').toBe('skrip-target-jalan')
})

test('ukur: (c) tautan tanpa target menavigasi iframe-nya sendiri', async ({ page }) => {
  await setupPreview(page)
  const frame = page.frameLocator('iframe')
  await expect(frame.locator('#judul')).toBeVisible()

  await frame.locator('#tanpa-target').click()
  await page.waitForTimeout(1500)

  // Bila iframe menavigasi sendiri, isi iframe berubah (judul lama hilang).
  const judulLamaMasihAda = await frame.locator('#judul').count()
  const iframeSrc = await page.locator('iframe').getAttribute('src')
  const judulBrowser = await page.title()
  console.log(
    `[5.5] tanpa target: judul lama masih ada=${judulLamaMasihAda} iframe src=${iframeSrc} judul tab=${judulBrowser}`,
  )

  // Bila iframe menavigasi sendiri, srcdoc diganti sehingga judul lama hilang.
  expect(judulLamaMasihAda).toBe(0)
  // Halaman utama TIDAK boleh ikut berubah (itulah bedanya dengan target="_blank").
  expect(page.url()).not.toContain('tanpa-target')
})