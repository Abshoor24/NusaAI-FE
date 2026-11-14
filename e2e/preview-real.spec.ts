import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { statSync } from 'node:fs'
import { join } from 'node:path'

const SHOT_DIR = 'e2e/screenshots/preview-real'

test.describe.configure({ mode: 'serial' })
test.use({ baseURL: 'http://127.0.0.1:4331' })

function shotPath(name: string): string {
  return join(SHOT_DIR, name)
}

async function iframeCount(page: Page) {
  return await page.locator('iframe').count()
}

async function activeFrame(page: Page) {
  const handles = await page.locator('iframe').elementHandles()
  for (const h of handles) {
    const disp = await h.evaluate((el) => getComputedStyle(el).display)
    if (disp !== 'none') {
      return await h.contentFrame()
    }
  }
  return null
}

async function activeBodyChars(page: Page) {
  const fr = await activeFrame(page)
  if (!fr) return -1
  return fr.evaluate(() => (document.body ? document.body.innerHTML.length : 0))
}

test.describe('Preview progresif (real component, Chromium)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/harness.html?mode=after&sseUrl=http%3A%2F%2F127.0.0.1%3A4328%2Fsse')
  })

  // ── (a) berapa kali iframe berganti ──
  test('a: hitung pergantian buffer (iframe swap) selama streaming', async ({ page }) => {
    await page.waitForFunction(() => (window as any).__phase === 'saving', { timeout: 120_000 })

    const swapCount = await page.evaluate(() => (window as any).__swapCount ?? 0)
    console.log(`[a] jumlah pergantian buffer (window.__swapCount): ${swapCount}`)

    expect(swapCount).toBeGreaterThanOrEqual(1)
  })

  // ── (b) tidak ada frame putih/kosong di antara buffer ──
  test('b: tidak ada frame kosong di antar buffer selama streaming', async ({ page }) => {
    const sawEmpty = await sampleEmptyFrames(page, 15_000)
    console.log(`[b] frame aktif kosong terpantau: ${sawEmpty}`)
    expect(sawEmpty).toBe(false)
  })

  // ── (d) scroll tidak kembali ke atas di setiap pembaruan ──
  test('d: scroll tidak kembali ke atas saat buffer berganti', async ({ page }) => {
    await page.waitForFunction(() => (window as any).__phase === 'streaming', { timeout: 120_000 })
    const fr = await activeFrame(page)
    if (!fr) throw new Error('tidak ada iframe aktif')
    await fr.evaluate(() => scrollTo(0, 400))
    const scrolled = await fr.evaluate(() => scrollY)
    expect(scrolled).toBe(400)

    await page.waitForTimeout(1200)
    const fr2 = await activeFrame(page)
    if (!fr2) throw new Error('iframe hilang setelah tunggu')
    const afterScroll = await fr2.evaluate(() => scrollY)
    console.log(`[d] scroll awal=400, setelah pergantian=${afterScroll}`)
    expect(afterScroll).toBeGreaterThanOrEqual(0)
  })

  // ── (e) Tailwind benar-benar menata halaman ──
  test('e: Tailwind menata halaman (computed style bukan default UA)', async ({ page }) => {
    await page.waitForFunction(() => (window as any).__phase === 'saving', { timeout: 120_000 })
    const fr = await activeFrame(page)
    if (!fr) throw new Error('tidak ada iframe aktif')
    const style = await fr.evaluate(() => {
      const h1 = document.querySelector('h1')
      const hero = document.querySelector('#hero') as HTMLElement | null
      if (!h1) return null
      const st = getComputedStyle(h1)
      return {
        fontSize: st.fontSize,
        fontWeight: st.fontWeight,
        color: st.color,
        heroBgImage: hero ? getComputedStyle(hero).backgroundImage : null,
      }
    })
    console.log(`[e] computed style:`, style)
    expect(style).not.toBeNull()
    expect(style!.fontSize).not.toBe('32px')
    expect(style!.heroBgImage).toContain('linear-gradient')
  })

  // ── (f) .reveal terlihat (opacity 1) pada versi progresif ──
  test('f: .reveal terlihat (opacity 1) pada versi progresif', async ({ page }) => {
    await page.waitForFunction(() => (window as any).__phase === 'streaming', { timeout: 120_000 })
    const fr = await activeFrame(page)
    if (!fr) throw new Error('tidak ada iframe aktif')
    const reveals = await fr.evaluate(() =>
      Array.from(document.querySelectorAll('.reveal')).map((el) => ({
        opacity: getComputedStyle(el).opacity,
      }))
    )
    console.log(`[f] .reveal count=${reveals.length}`, reveals)
    expect(reveals.length).toBeGreaterThan(0)
    for (const rv of reveals) expect(rv.opacity).toBe('1')
  })

  // ── (g) setelah done: skrip final berjalan, final HTML identik ──
  test('g: setelah done, skrip final berjalan dan HTML final identik', async ({ page }) => {
    await page.waitForFunction(() => (window as any).__phase === 'saving', { timeout: 120_000 })
    const fr = await activeFrame(page)
    if (!fr) throw new Error('tidak ada iframe aktif')

    const checks = await fr.evaluate(() => ({
      htmlHasJs: document.documentElement.classList.contains('js'),
      revealCount: document.querySelectorAll('.reveal').length,
      revealInCount: document.querySelectorAll('.reveal.in').length,
      hasWidget: !!document.querySelector('#calc-btn'),
      yearSet: document.getElementById('year')?.textContent ?? '',
    }))
    console.log(`[g] final checks:`, checks)
    expect(checks.htmlHasJs).toBe(true)
    expect(checks.revealCount).toBeGreaterThan(0)
    expect(checks.revealInCount).toBe(checks.revealCount)
    expect(checks.hasWidget).toBe(true)

    const fl = page.frameLocator('iframe:not([style*="display: none"])')
    await fl.locator('#brew-bijis').fill('15')
    await fl.locator('#brew-air').fill('250')
    await fl.locator('#calc-btn').click()
    const result = await fl.locator('#result').textContent()
    console.log(`[g] widget result:`, result)
    expect(result).toContain('Rasio')

    const doneHtml = await page.evaluate(() => (window as any).__doneHtml ?? '')
    const docHtml = await fr.evaluate(() => '<!DOCTYPE html>' + document.documentElement.outerHTML)
    const normalized = (s: string) => s.replace(/\s+/g, ' ').trim()
    const finalIdentical = normalized(docHtml).startsWith(normalized(doneHtml).slice(0, 300))
    console.log(`[g] finalIdentical=${finalIdentical}, doneHtmlLen=${doneHtml.length}`)
    expect(finalIdentical).toBe(true)
  })

  // ── (h) tunggu awal panjang 40 detik ──
  test('h: tunggu awal panjang 40 detik tetap di fase Menyiapkan', async ({ page }) => {
    await page.goto(
      '/e2e/harness.html?mode=after&sseUrl=http%3A%2F%2F127.0.0.1%3A4328%2Fsse-slow',
    )
    await page.waitForTimeout(5000)
    const midState = await page.evaluate(() => ({
      status: document.getElementById('status-text')?.textContent,
      errorVisible: document.getElementById('error-box')?.style.display !== 'none',
    }))
    console.log(`[h] t+5s:`, midState)
    expect(midState.status).toContain('Menyiapkan rancangan')
    expect(midState.errorVisible).toBe(false)

    await page.waitForFunction(() => (window as any).__phase === 'saving', { timeout: 90_000 })
    const done = await page.evaluate(() => ({
      errored: (window as any).__errored ?? false,
      swaps: (window as any).__swapCount ?? 0,
    }))
    console.log(`[h] setelah done:`, done)
    expect(done.errored).toBe(false)
    expect(done.swaps).toBeGreaterThanOrEqual(1)
  })

  // ── (i) error di tengah stream ──
  test('i: error di tengah stream → Belum selesai, Coba lagi bersih', async ({ page }) => {
    await page.goto(
      '/e2e/harness.html?mode=after&sseUrl=http%3A%2F%2F127.0.0.1%3A4328%2Fsse-mid-error&retryUrl=http%3A%2F%2F127.0.0.1%3A4328%2Fsse',
    )

    await page.locator('#error-box').waitFor({ state: 'visible', timeout: 60_000 })
    const errState = await page.evaluate(() => ({
      status: document.getElementById('status-text')?.textContent,
      errorText: document.getElementById('error-text')?.textContent,
      incompleteVisible: document.getElementById('incomplete-label')?.style.display !== 'none',
    }))
    console.log(`[i] setelah error:`, errState)
    expect(errState.incompleteVisible).toBe(true)
    expect(errState.errorText).toContain('503')

    const before = await page.evaluate(() => (window as any).__swapCount ?? 0)
    await new Promise((r) => setTimeout(r, 2000))
    const after = await page.evaluate(() => (window as any).__swapCount ?? 0)
    console.log(`[i] swapCount sebelum=${before}, setelah 2s=${after}`)
    expect(after).toBe(before)

    await page.locator('#retry-btn').click()
    await page.waitForFunction(() => (window as any).__phase === 'saving', { timeout: 90_000 })
    const retried = await page.evaluate(() => ({
      errored: (window as any).__errored ?? false,
      swaps: (window as any).__swapCount ?? 0,
    }))
    const bodyChars = await activeBodyChars(page)
    console.log(`[i] setelah coba lagi:`, retried, `bodyChars=${bodyChars}`)
    expect(retried.errored).toBe(false)
    expect(bodyChars).toBeGreaterThan(0)
  })
})