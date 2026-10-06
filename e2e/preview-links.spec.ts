import { test, expect } from '@playwright/test'
import { mockLogin, mockWorkspaceApi, type WorkspaceState } from './workspace-helpers'

/**
 * UKURAN (bukan perbaikan) perilaku tautan di dalam preview.
 *
 * Hipotesis yang diuji:
 *  (a) tautan target="_blank" dari srcDoc preview membuka tab baru,
 *  (b) skrip di tab itu BERJALAN (allow-scripts diwarisi) TAPI origin tetap
 *      opaque "null" dan storage/cookie diblokir (tanpa allow-same-origin),
 *  (c) [Opsi A] tautan https TANPA target otomatis diberi target="_blank"
 *      oleh skrip pratinjau render-only sehingga iframe tidak dinavigasi.
 *
 * Tidak ada perubahan pada PreviewFrame.tsx (Aturan Keras):
 * sandbox tetap persis "allow-scripts allow-popups". Hasil di sini
 * dipakai untuk keputusan Anda, bukan untuk membenahi apa pun.
 * Opsi allow-popups-to-escape-sandbox TIDAK diterapkan (lihat H5).
 */

/** HTML preview dengan skrip penanda yang mengubah document.title. */
const HTML_WITH_LINKS = `<html><body style="font-family: sans-serif">
<h1 id="judul">Pratinjau uji tautan</h1>
<a id="wa" href="https://wa.me/628123456789" target="_blank" rel="noopener noreferrer">WhatsApp</a>
<a id="mail" href="mailto:halo@contoh.id">Email</a>
<a id="telp" href="tel:+628123456789">Telepon</a>
<a id="ke-bagian" href="#bagian">Ke Bagian</a>
<div style="height:1200px;background:#eee"></div>
<section id="bagian"><h2>Bagian bawah</h2></section>
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

/** Pola URL untuk domain luar yang dipakai di HTML preview. */
const TARGET_ORIGIN_GLOB = /https:\/\/(wa\.me|example\.com|maps\.google\.com)\/.*/

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

test('ukur: (b) skrip di tab baru berjalan TAPI origin tetap opaque (sandbox diwarisi)', async ({
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

  // KOREKSI H5: skrip target MENGUBAH title menjadi 'skrip-target-jalan',
  // artinya allow-scripts DIWARISI popup (bukan "tanpa allow-scripts").
  // Klaim lama "terlepas dari sandbox" SALAH untuk storage/origin —
  // lihat H5: origin "null", localStorage/cookie melempar SecurityError.
  // Judul BERUBAH = skrip hidup (allow-scripts diwarisi).
  expect(title, 'skrip di tab baru berjalan (allow-scripts diwarisi)').toBe('skrip-target-jalan')
  expect(url).toContain('wa.me')
  expect(hasTargetContent).toBeGreaterThan(0)
})

test('opsi A: tautan tanpa target otomatis mendapatkan target=_blank sehingga pratinjau tetap utuh', async ({ page }) => {
  await setupPreview(page)
  const frame = page.frameLocator('iframe')
  await expect(frame.locator('#judul')).toBeVisible()

  await frame.locator('#tanpa-target').click()
  await page.waitForTimeout(1500)

  // Opsi A: tautan luar tanpa target otomatis diberi target="_blank", sehingga
  // pratinjau iframe TIDAK rusak/blank (judul lama tetap ada = 1).
  const judulLamaMasihAda = await frame.locator('#judul').count()
  expect(judulLamaMasihAda).toBe(1)
  expect(page.url()).not.toContain('tanpa-target')
})

test('H2: tautan mailto: dan tel: di pratinjau TIDAK mendapat atribut target/rel tambahan', async ({ page, context }) => {
  await setupPreview(page)
  const frame = page.frameLocator('iframe')
  await expect(frame.locator('#judul')).toBeVisible()

  for (const id of ['#mail', '#telp']) {
    const link = frame.locator(id)
    // Sebelum klik: tanpa target/rel tambahan.
    expect(await link.getAttribute('target')).toBeNull()
    expect(await link.getAttribute('rel')).toBeNull()
  }

  // Klik mailto: — TIDAK boleh membuka tab kosong.
  const pagesBeforeMail = context.pages().length
  await frame.locator('#mail').click()
  await page.waitForTimeout(1000)
  expect(context.pages().length, 'mailto: tidak membuka tab kosong').toBe(pagesBeforeMail)
  expect(await frame.locator('#mail').getAttribute('target')).toBeNull()
  expect(await frame.locator('#mail').getAttribute('rel')).toBeNull()

  // Klik tel: — TIDAK boleh membuka tab kosong.
  const pagesBeforeTel = context.pages().length
  await frame.locator('#telp').click()
  await page.waitForTimeout(1000)
  expect(context.pages().length, 'tel: tidak membuka tab kosong').toBe(pagesBeforeTel)
  expect(await frame.locator('#telp').getAttribute('target')).toBeNull()
  expect(await frame.locator('#telp').getAttribute('rel')).toBeNull()

  // Pratinjau tetap utuh setelah kedua klik.
  expect(await frame.locator('#judul').count()).toBe(1)
})

test('H3: aktivasi Enter pada tautan # dan https masing-masing hanya sekali', async ({
  page,
  context,
}) => {
  await setupPreview(page)
  const frame = page.frameLocator('iframe')
  await expect(frame.locator('#judul')).toBeVisible()

  // Sandbox tetap persis (click saja cukup, tanpa handler keydown).
  expect(await page.getAttribute('iframe', 'sandbox')).toBe('allow-scripts allow-popups')

  // 1) Enter pada tautan # — menggulir sekali, tanpa navigasi ganda.
  const navigated: string[] = []
  page.on('framenavigated', (f) => {
    if (f.url().startsWith('about:')) return
    navigated.push(f.url())
  })
  await frame.locator('#ke-bagian').focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(800)
  expect(navigated.filter((u) => u.includes('#bagian')), 'Enter # menavigasi keluar').toEqual([])
  await expect(frame.locator('#bagian h2')).toBeVisible({ timeout: 5000 })

  // 2) Enter pada tautan https tanpa target — tepat SATU tab baru (bukan dua).
  const before = context.pages().length
  await frame.locator('#tanpa-target').focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1500)
  const opened = context.pages().slice(before)
  expect(opened.length, 'Enter pada https membuka tepat satu tab').toBe(1)
  for (const t of opened) await t.close()
})

test('H5: pengukuran tab baru yang dibuka dari iframe sandbox allow-scripts allow-popups', async ({ page, context }) => {
  await setupPreview(page)
  const before = context.pages().length
  await page.frameLocator('iframe').locator('#wa').click()
  await page.waitForTimeout(1500)
  const opened = context.pages().slice(before)
  expect(opened.length).toBeGreaterThan(0)
  const tab = opened[0]
  await tab.waitForLoadState('domcontentloaded', { timeout: 10000 })

  const origin = await tab.evaluate(() => window.origin)
  const hasOpener = await tab.evaluate(() => window.opener !== null)

  const localStorageResult = await tab.evaluate(() => {
    try {
      localStorage.setItem('h5_test', '1')
      const val = localStorage.getItem('h5_test')
      localStorage.removeItem('h5_test')
      return { ok: true, val }
    } catch (e: unknown) {
      return { ok: false, err: e instanceof Error ? e.message : String(e) }
    }
  })

  const cookieResult = await tab.evaluate(() => {
    try {
      document.cookie = 'h5_cookie=1; SameSite=Lax'
      return { ok: true, cookie: document.cookie }
    } catch (e: unknown) {
      return { ok: false, err: e instanceof Error ? e.message : String(e) }
    }
  })

  const formResult = await tab.evaluate(() => {
    try {
      const f = document.createElement('form')
      f.action = 'about:blank'
      f.method = 'POST'
      document.body.appendChild(f)
      // f.submit() via JS tidak melempar walau tanpa allow-forms;
      // pemblokiran terjadi di level navigasi, bukan exception.
      f.submit()
      return { ok: true, note: 'submit() tidak melempar' }
    } catch (e: unknown) {
      return { ok: false, err: e instanceof Error ? e.message : String(e) }
    }
  })

  console.log(`[H5 METRICS] window.origin: "${origin}"`)
  console.log(`[H5 METRICS] window.opener present: ${hasOpener}`)
  console.log(`[H5 METRICS] localStorage access:`, localStorageResult)
  console.log(`[H5 METRICS] document.cookie access:`, cookieResult)
  console.log(`[H5 METRICS] form submit allowed:`, formResult)

  // TEMUAN H5 (terukur 2026-10-06, Chromium):
  // - origin === "null" (opaque): popup MEWARISI sandbox, TIDAK "terlepas".
  // - window.opener === null (rel=noopener): aman dari reverse-tabnabbing.
  // - localStorage & cookie MELEMPAR SecurityError "lacks allow-same-origin".
  // - f.submit() tidak melempar, tapi popup tetap opaque (storage/cookie
  //   tetap diblokir; navigasi form tanpa allow-forms diblokir browser).
  // Dampak wa.me / Google Maps (tujuan nyata, bukan mock): halaman tujuan
  // dimuat dalam konteks opaque — skripnya jalan (allow-scripts diwarisi)
  // tetapi penyimpanan/cookie pihak ketiga diblokir dan submit form tanpa
  // allow-forms diblokir, sehingga login/session, keranjang, atau pencarian
  // yang butuh storage/form dapat rusak/keluar-sendiri.
  // OPSI (TIDAK diterapkan): tambah "allow-popups-to-escape-sandbox" pada
  // sandbox agar popup lepas dari sandbox. RISIKO: popup menjadi tab penuh
  // (origin asli, storage/cookie aktif, opener tetap null berkat noopener),
  // sehingga situs luar berjalan normal TAPI kehilangan isolasi sandbox —
  // HTML AI yang jahat bisa membuka popup tak tersandbox. Keputusan: tetap
  // "allow-scripts allow-popups" persis (aturan keras), tawarkan opsi ini
  // ke pemilik produk tanpa menerapkannya.
  expect(origin, 'popup mewarisi sandbox: origin opaque').toBe('null')
  expect(hasOpener, 'rel=noopener: opener null').toBe(false)
  expect(localStorageResult.ok, 'localStorage diblokir tanpa allow-same-origin').toBe(false)
  expect(cookieResult.ok, 'cookie diblokir tanpa allow-same-origin').toBe(false)
})
