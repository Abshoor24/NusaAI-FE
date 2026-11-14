import { test, expect } from '@playwright/test'
import type { Frame, Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Verifikasi preview progresif memakai komponen asli (PreviewFrame +
 * sanitizeStreamingHtml) di Chromium sungguhan, bukan jsdom.
 *
 * Isi iframe dibaca lewat elementHandle.contentFrame()/frame.evaluate(), karena
 * sandbox "allow-scripts allow-popups" (tanpa allow-same-origin) membuat
 * contentDocument dari halaman induk selalu null.
 *
 * Dijalankan lewat `node e2e/run-preview-e2e.mjs` (port bebas otomatis).
 */

const SHOT_DIR = 'e2e/screenshots/preview-real'
const BASE = process.env.PREVIEW_BASE_URL ?? 'http://127.0.0.1:4331'
const SSE = process.env.PREVIEW_SSE_URL ?? 'http://127.0.0.1:4328'

test.use({ baseURL: BASE })
test.describe.configure({ mode: 'serial' })

function sseUrl(path: string): string {
  return `${SSE}${path}?fixture=minimal`
}

function harnessUrl(path: string, retryPath?: string): string {
  const params = new URLSearchParams({ mode: 'after', sseUrl: sseUrl(path) })
  if (retryPath) params.set('retryUrl', sseUrl(retryPath))
  return `/e2e/harness.html?${params.toString()}`
}

async function openHarness(page: Page, path: string, retryPath?: string) {
  await page.goto(harnessUrl(path, retryPath))
}

async function phase(page: Page): Promise<string> {
  return page.evaluate(() => (window as any).__phase as string)
}

async function waitPhase(page: Page, wanted: string, timeout = 150_000) {
  await page.waitForFunction(
    (want) => (window as any).__phase === want,
    wanted,
    { timeout },
  )
}

async function activeFrame(page: Page): Promise<Frame | null> {
  const handles = await page.locator('iframe').elementHandles()
  for (const handle of handles) {
    try {
      const display = await handle.evaluate((el) => getComputedStyle(el).display)
      if (display !== 'none') return await handle.contentFrame()
    } catch {
      // iframe berganti saat dibaca; coba berikutnya.
    }
  }
  return null
}

async function waitForActiveFrame(page: Page, timeout = 30_000): Promise<Frame> {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const frame = await activeFrame(page)
    if (frame) {
      try {
        const ready = await frame.evaluate(() =>
          Boolean(document.body && document.body.innerHTML.length > 0),
        )
        if (ready) return frame
      } catch {
        // pergantian buffer; coba lagi
      }
    }
    await page.waitForTimeout(50)
  }
  throw new Error('tidak ada iframe aktif berisi konten')
}

async function activeBodyChars(page: Page): Promise<number> {
  const frame = await activeFrame(page)
  if (!frame) return -1
  return frame.evaluate(() => (document.body ? document.body.innerHTML.length : 0))
}

function shot(name: string): string {
  return join(SHOT_DIR, name)
}

function normalize(html: string): string {
  return html.replace(/\s+/g, ' ').trim()
}

test.beforeEach(async () => {
  mkdirSync(SHOT_DIR, { recursive: true })
})

test('a: hitung pergantian buffer + screenshot tiap 2 detik', async ({ page }) => {
  await openHarness(page, '/sse')

  let frames = 0
  for (let i = 0; i < 24; i++) {
    const current = await phase(page)
    if (current === 'saving' || current === 'idle') break
    await page.screenshot({ path: shot(`a-stream-${String(i).padStart(2, '0')}.png`) })
    frames++
    await page.waitForTimeout(2000)
  }

  await waitPhase(page, 'saving')
  const swaps = await page.evaluate(() => (window as any).__swapCount ?? 0)
  console.log(`[a] pergantian buffer=${swaps}, screenshot 2s=${frames}`)
  expect(swaps).toBeGreaterThanOrEqual(1)
  expect(frames).toBeGreaterThanOrEqual(1)
})

test('b: tidak ada frame kosong/putih di antara dua buffer', async ({ page }) => {
  await openHarness(page, '/sse')

  let sawEmpty = false
  let samples = 0
  const deadline = Date.now() + 90_000
  while (Date.now() < deadline) {
    const current = await phase(page)
    if (current === 'saving' || current === 'idle') break
    const frame = await activeFrame(page)
    if (frame) {
      try {
        const chars = await frame.evaluate(() =>
          document.body ? document.body.innerHTML.length : 0,
        )
        samples++
        if (chars === 0) sawEmpty = true
      } catch {
        // pergantian buffer; abaikan
      }
    }
    await page.waitForTimeout(60)
  }

  await waitPhase(page, 'saving')
  console.log(`[b] sampel=${samples}, frame aktif kosong terpantau=${sawEmpty}`)
  expect(sawEmpty).toBe(false)
  expect(samples).toBeGreaterThan(5)
})

test('c: animasi .rise tidak diputar ulang; fase final stabil', async ({ page }) => {
  await openHarness(page, '/sse')
  await waitPhase(page, 'streaming')

  const streamSizes: number[] = []
  const riseCounts: number[] = []
  for (let i = 0; i < 40; i++) {
    const current = await phase(page)
    if (current === 'saving' || current === 'idle') break
    riseCounts.push(
      await page.evaluate(() => (window as any).__riseEvents?.length ?? 0),
    )
    const buffer = await page.screenshot({ path: shot(`c-stream-${String(i).padStart(3, '0')}.png`) })
    streamSizes.push(buffer.length)
    await page.waitForTimeout(100)
  }

  await waitPhase(page, 'saving')
  await page.waitForTimeout(2000)

  // Halaman contoh punya dekorasi `.float` dengan animasi infinite. Untuk
  // mengukur kestabilan fase final (bukan dekorasi itu), pakai reduced motion:
  // fixture sendiri menghentikan .float/.rise saat prefers-reduced-motion.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(400)

  const finalSizes: number[] = []
  for (let i = 0; i < 10; i++) {
    const buffer = await page.screenshot({ path: shot(`c-final-${String(i).padStart(2, '0')}.png`) })
    finalSizes.push(buffer.length)
    await page.waitForTimeout(100)
  }

  const riseDuringStream = riseCounts.length > 0 ? Math.max(...riseCounts) : 0
  console.log(
    `[c] animationstart .rise saat streaming=${riseDuringStream}; ` +
      `screenshot 100ms=${streamSizes.length}; unik fase final=${new Set(finalSizes).size}`,
  )
  expect(riseDuringStream).toBe(0)
  expect(new Set(finalSizes).size).toBeLessThanOrEqual(2)
})

test('d: posisi scroll tidak kembali ke atas saat buffer berganti', async ({ page }) => {
  await openHarness(page, '/sse')
  await waitPhase(page, 'streaming')

  const frame = await waitForActiveFrame(page)
  await frame.waitForFunction(
    () => document.documentElement.scrollHeight > 800,
    undefined,
    { timeout: 20_000 },
  )
  await frame.evaluate(() => window.scrollTo(0, 400))
  await page.waitForTimeout(400)
  const before = await frame.evaluate(() => window.scrollY)
  const swapBefore = await page.evaluate(() => (window as any).__swapCount ?? 0)

  await page.waitForFunction(
    (previous) => ((window as any).__swapCount ?? 0) > previous,
    swapBefore,
    { timeout: 30_000 },
  )
  await page.waitForTimeout(500)

  const nextFrame = await activeFrame(page)
  if (!nextFrame) throw new Error('iframe hilang setelah pergantian')
  const after = await nextFrame.evaluate(() => window.scrollY)
  console.log(`[d] scroll sebelum=${before}, setelah pergantian=${after}`)

  expect(before).toBeGreaterThan(0)
  expect(after).toBeGreaterThan(0)
})

test('e: Tailwind benar-benar menata halaman (computed style)', async ({ page }) => {
  await openHarness(page, '/sse')
  await waitPhase(page, 'saving')
  await page.waitForTimeout(1200)

  const frame = await activeFrame(page)
  if (!frame) throw new Error('tidak ada iframe aktif')
  await frame.waitForFunction(
    () => {
      const h1 = document.querySelector('h1')
      return Boolean(
        h1 &&
          getComputedStyle(h1).fontSize !== '32px' &&
          getComputedStyle(document.body).backgroundColor !== 'rgba(0, 0, 0, 0)',
      )
    },
    undefined,
    { timeout: 20_000 },
  )
  const style = await frame.evaluate(() => {
    const h1 = document.querySelector('h1')
    const hero = document.querySelector('section') as HTMLElement | null
    return {
      h1FontSize: h1 ? getComputedStyle(h1).fontSize : null,
      h1FontFamily: h1 ? getComputedStyle(h1).fontFamily : null,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      heroBgImage: hero ? getComputedStyle(hero).backgroundImage : null,
    }
  })

  console.log('[e] computed style:', style)
  expect(style.h1FontSize).not.toBeNull()
  expect(style.h1FontSize).not.toBe('32px')
  expect(style.bodyBg).not.toBe('rgba(0, 0, 0, 0)')
  expect(style.heroBgImage).toContain('radial-gradient')
})

test('f: .reveal terlihat (opacity 1) pada versi progresif', async ({ page }) => {
  await openHarness(page, '/sse')
  await waitPhase(page, 'streaming')

  let reveals: Array<{ opacity: string }> = []
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    const frame = await activeFrame(page)
    if (frame) {
      try {
        reveals = await frame.evaluate(() =>
          Array.from(document.querySelectorAll('.reveal')).map((el) => ({
            opacity: getComputedStyle(el).opacity,
          })),
        )
      } catch {
        reveals = []
      }
      if (reveals.length > 0) break
    }
    await page.waitForTimeout(150)
  }

  console.log(`[f] .reveal=${reveals.length}, opacity=${reveals.map((r) => r.opacity).join(',')}`)
  expect(reveals.length).toBeGreaterThan(0)
  for (const reveal of reveals) expect(reveal.opacity).toBe('1')
})

test('g: setelah done, skrip final berjalan dan HTML final identik', async ({ page }) => {
  await openHarness(page, '/sse')
  await waitPhase(page, 'saving')
  await page.waitForTimeout(1000)

  const frame = await activeFrame(page)
  if (!frame) throw new Error('tidak ada iframe aktif')

  await frame.waitForFunction(() => document.documentElement.classList.contains('js'))
  await frame.evaluate(() => window.scrollTo(0, 700))
  await frame.waitForFunction(
    () =>
      document.querySelectorAll('.reveal').length > 0 &&
      document.querySelectorAll('.reveal.in').length > 0,
    undefined,
    { timeout: 15_000 },
  )

  const checks = await frame.evaluate(() => ({
    hasJs: document.documentElement.classList.contains('js'),
    revealCount: document.querySelectorAll('.reveal').length,
    revealInCount: document.querySelectorAll('.reveal.in').length,
    year: document.getElementById('year')?.textContent ?? '',
    statusPill: document.getElementById('open-status-pill')?.textContent ?? '',
  }))
  console.log('[g] final checks:', checks)
  expect(checks.hasJs).toBe(true)
  expect(checks.revealCount).toBeGreaterThan(0)
  expect(checks.revealInCount).toBeGreaterThan(0)
  expect(checks.revealInCount).toBeLessThanOrEqual(checks.revealCount)
  expect(checks.year).toMatch(/^\d{4}$/)
  expect(checks.statusPill).toBe('Kedai Buka Hari Ini')

  const menuOpened = await frame.evaluate(() => {
    const button = document.querySelector('button[onclick="setMenu(true)"]')
    if (!(button instanceof HTMLButtonElement)) return false
    button.click()
    return !document.getElementById('mobile-menu')?.classList.contains('hidden')
  })
  console.log(`[g] widget/menu bisa diklik=${menuOpened}`)
  expect(menuOpened).toBe(true)

  const doneHtml = await page.evaluate(() => (window as any).__doneHtml ?? '')
  const iframeCount = await page.locator('iframe').count()
  expect(iframeCount).toBe(1)
  const srcDoc = (await page.locator('iframe').first().getAttribute('srcdoc')) ?? ''
  const withoutAnchorFix = srcDoc.replace(
    /<script data-pakhir-anchor-fix>[\s\S]*?<\/script>/,
    '',
  )
  const identical = normalize(withoutAnchorFix) === normalize(doneHtml)
  console.log(
    `[g] HTML final identik dengan event done=${identical} ` +
      `(done=${doneHtml.length}, srcDoc=${srcDoc.length})`,
  )
  expect(identical).toBe(true)
})

test('h: tunggu awal panjang 40 detik tetap di fase Menyiapkan', async ({ page }) => {
  test.setTimeout(160_000)
  await openHarness(page, '/sse-slow')

  await page.waitForTimeout(5000)
  const mid = await page.evaluate(() => ({
    status: document.getElementById('status-text')?.textContent ?? '',
    errorVisible: Boolean(document.getElementById('error-box')),
    phase: (window as any).__phase,
  }))
  console.log('[h] t+5s:', mid)
  expect(mid.status).toContain('Menyiapkan rancangan')
  expect(mid.errorVisible).toBe(false)

  const started = Date.now()
  await waitPhase(page, 'saving', 120_000)
  const waited = (Date.now() - started) / 1000
  const done = await page.evaluate(() => ({
    errored: (window as any).__errored ?? false,
    swaps: (window as any).__swapCount ?? 0,
  }))
  console.log(`[h] total tunggu=${waited.toFixed(1)}s, setelah done:`, done)
  expect(done.errored).toBe(false)
  expect(done.swaps).toBeGreaterThanOrEqual(1)
})

test('i: error di tengah stream → Belum selesai, Coba Lagi bersih', async ({ page }) => {
  test.setTimeout(160_000)
  await openHarness(page, '/sse-mid-error', '/sse')

  await page.locator('#error-box').waitFor({ state: 'visible', timeout: 90_000 })
  const errorState = await page.evaluate(() => ({
    status: document.getElementById('status-text')?.textContent ?? '',
    errorText: document.getElementById('error-text')?.textContent ?? '',
    incompleteText: document.getElementById('incomplete-label')?.textContent ?? '',
  }))
  console.log('[i] setelah error:', errorState)
  expect(errorState.status).toBe('Belum selesai')
  expect(errorState.errorText).toContain('503')
  expect(errorState.incompleteText).toBe('Belum selesai')

  const swapsBefore = await page.evaluate(() => (window as any).__swapCount ?? 0)
  await page.waitForTimeout(2000)
  const swapsAfter = await page.evaluate(() => (window as any).__swapCount ?? 0)
  console.log(`[i] swap sebelum=${swapsBefore}, 2s setelah error=${swapsAfter}`)
  expect(swapsAfter).toBe(swapsBefore)

  await page.locator('#retry-btn').click()
  await page.locator('#error-box').waitFor({ state: 'detached', timeout: 10_000 })
  await waitPhase(page, 'saving', 90_000)

  const retried = await page.evaluate(() => ({
    errored: (window as any).__errored ?? false,
    swaps: (window as any).__swapCount ?? 0,
  }))
  const finalFrame = await activeFrame(page)
  if (!finalFrame) throw new Error('tidak ada iframe final setelah coba lagi')
  await finalFrame.waitForFunction(
    () => Boolean(document.body && document.body.innerHTML.length > 0),
    undefined,
    { timeout: 15_000 },
  )
  const bodyChars = await activeBodyChars(page)
  console.log(`[i] setelah coba lagi:`, retried, `bodyChars=${bodyChars}`)
  expect(retried.errored).toBe(false)
  expect(retried.swaps).toBeGreaterThan(swapsBefore)
  expect(bodyChars).toBeGreaterThan(0)
})
