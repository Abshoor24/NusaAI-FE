import { test, expect } from '@playwright/test'
import { mockLogin, mockWorkspaceApi } from './workspace-helpers'
import {
  installErrorHooks,
  expectNoPageErrors,
  type ErrorHooks,
} from './helpers/layout-invariants'

/**
 * Fase 4: tautan #fragmen di HTML AI harus menggulir di DALAM iframe dan
 * tidak menavigasi iframe ke URL aplikasi (dulu: pratinjau rusak/putih).
 * Tautan lain (target=_blank) tidak berubah. Sandbox & HTML unduhan utuh.
 */

const HTML = `<html><head><style>body{font-family:sans-serif;margin:0}</style></head><body>
<h1 id="judul">Kedai Kopi</h1>
<a id="ke-produk" href="#produk">Lihat produk</a>
<div style="height:1200px;background:#eee"></div>
<section id="produk"><h2>Produk kami</h2></section>
<a id="keluar" href="https://example.com" target="_blank">Situs luar</a>
</body></html>`

test('klik #produk menggulir dalam iframe, bukan navigasi', async ({ page }) => {
  const hooks: ErrorHooks = installErrorHooks(page)
  await mockLogin(page)
  await mockWorkspaceApi(page, 'p1', {
    status: 'ready',
    title: 'Kedai Kopi',
    versions: [{ id: 'v1', version_number: 1, kind: 'generate', prompt: 'brief', html: HTML }],
  })
  const dinavigasi: string[] = []
  page.on('framenavigated', (frame) => {
    if (frame.url().startsWith('about:')) return
    dinavigasi.push(frame.url())
  })
  await page.goto('/projects/p1', { waitUntil: 'networkidle' })
  const frame = page.frameLocator('iframe')
  await expect(frame.locator('#judul')).toBeVisible({ timeout: 15000 })

  // Sandbox tetap persis; srcdoc memuat HTML asli + pencegat render-only.
  const sandbox = await page.getAttribute('iframe', 'sandbox')
  expect(sandbox).toBe('allow-scripts allow-popups')

  await frame.locator('#ke-produk').click()
  await page.waitForTimeout(1000)
  // Iframe TIDAK boleh menavigasi ke URL aplikasi.
  expect(dinavigasi.filter((u) => u.includes('#produk')), 'iframe menavigasi keluar').toEqual([])
  expect(new URL(page.url()).pathname).toBe('/projects/p1')
  // Tujuan tergulir ke area terlihat dalam iframe.
  await expect(frame.locator('#produk h2')).toBeVisible({ timeout: 5000 })
  const kotak = await frame.locator('#produk h2').boundingBox()
  const bingkai = await page.locator('iframe').boundingBox()
  expect(kotak, 'target anchor terlihat').not.toBeNull()
  expect(bingkai, 'iframe terlihat').not.toBeNull()
  if (kotak && bingkai) {
    expect(kotak.y, 'anchor tergulir ke dalam viewport iframe').toBeGreaterThanOrEqual(
      bingkai.y - 2,
    )
    expect(kotak.y).toBeLessThanOrEqual(bingkai.y + bingkai.height)
  }
  expectNoPageErrors(hooks, 'anchor')
})

test('tautan target=_blank tetap membuka tab baru', async ({ page }) => {
  const hooks: ErrorHooks = installErrorHooks(page)
  await mockLogin(page)
  await mockWorkspaceApi(page, 'p1', {
    status: 'ready',
    title: 'Kedai Kopi',
    versions: [{ id: 'v1', version_number: 1, kind: 'generate', prompt: 'brief', html: HTML }],
  })
  await page.goto('/projects/p1', { waitUntil: 'networkidle' })
  const frame = page.frameLocator('iframe')
  await expect(frame.locator('#judul')).toBeVisible({ timeout: 15000 })
  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 15000 }),
    frame.locator('#keluar').click(),
  ])
  expect(new URL(popup.url()).hostname).toBe('example.com')
  await popup.close()
  expectNoPageErrors(hooks, 'blank')
})
