import { test, expect } from '@playwright/test'
import { mockLogin, mockWorkspaceApi, type WorkspaceState } from './workspace-helpers'

/**
 * D3: website hasil generate yang memakai font/gambar/skrip CDN umum
 * harus tetap tampil di preview (tanpa CSP yang merusak).
 */
test('preview CDN-heavy tampil utuh', async ({ page }) => {
  await mockLogin(page)
  const html = `<html><head>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter&display=swap">
</head><body>
<h1 id="judul">Kedai Kopi</h1>
<img id="foto" src="https://cdn.jsdelivr.net/gh/github/explore@main/topics/astro/astro.png" alt="ikon">
<script src="https://cdn.jsdelivr.net/npm/axios@1/dist/axios.min.js"></script>
<script>document.body.setAttribute('data-cdn-js', typeof window.axios === 'undefined' ? 'gagal' : 'jalan');</script>
</body></html>`
  const state: WorkspaceState = {
    status: 'ready',
    title: 'CDN',
    versions: [{ id: 'v1', version_number: 1, kind: 'generate', prompt: 'brief', html }],
  }
  await mockWorkspaceApi(page, 'p1', state)
  await page.goto('/projects/p1')
  const frame = page.frameLocator('iframe')
  await expect(frame.locator('#judul')).toBeVisible({ timeout: 15000 })

  // Stylesheet CDN termuat di dalam iframe.
  const cssCount = await frame.locator('link[rel="stylesheet"]').count()
  expect(cssCount).toBe(2)
  // Skrip CDN berjalan di dalam iframe.
  await expect(frame.locator('body[data-cdn-js="jalan"]')).toBeAttached({ timeout: 15000 })
  // Gambar remote termuat.
  const imgOk = await frame.locator('#foto').evaluate((el) => {
    const img = el as HTMLImageElement
    return img.complete && img.naturalWidth > 0
  })
  expect(imgOk).toBe(true)
})
