import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * Verifikasi Preview Progresif di Chromium sungguhan (Playwright), bukan jsdom.
 *
 * Bukti probe (probe-sandbox.mjs): iframe ber-sandbox "allow-scripts allow-popups"
 * TANPA allow-same-origin membuat iframe.contentDocument === null dari halaman
 * induk (desain keamanan browser). Semua pemeriksaan DOM iframe memakai jalur
 * Playwright CDP: elementHandle.contentFrame() + frame.evaluate()/frameLocator().
 *
 * Harness: e2e/preview-test.html dengan ?mode=before|after
 *  - before: perilaku lama (tulis langsung frame aktif; tanpa motion-kill,
 *    tanpa pemelihara scroll)
 *  - after : perbaikan (buffer swap setelah load, <style>*{animation:none}>
 *    hanya progresif, scrollTop dipertahankan lewat window.name)
 */

const BASE = 'http://127.0.0.1:3456'
const SHOT_DIR = 'e2e/screenshots/preview-verify'

test.describe.configure({ mode: 'serial' })

/** frame aktif sebagai objek frame Playwright (jalur CDP). */
async function activeFrame(page: Page) {
  const id = await page.evaluate(() => {
    const a = document.getElementById('frame-a')
    const b = document.getElementById('frame-b')
    if (a && a.classList.contains('active')) return 'frame-a'
    if (b && b.classList.contains('active')) return 'frame-b'
    return null
  })
  if (!id) return null
  const handle = await page.locator(`#${id}`).elementHandle()
  return handle ? await handle.contentFrame() : null
}

async function waitForActiveFrame(page: Page, timeout = 30000) {
  await page.waitForFunction(() => {
    const a = document.getElementById('frame-a')
    const b = document.getElementById('frame-b')
    return !!((a && a.classList.contains('active')) || (b && b.classList.contains('active')))
  }, { timeout })
}

async function waitDone(page: Page, timeout = 45000) {
  await page.waitForFunction(
    () => document.getElementById('status-text')?.textContent === 'Selesai',
    { timeout },
  )
}

/** Ukur satu mode; mengembalikan angka a-g. */
async function measureMode(page: Page, mode: 'before' | 'after') {
  await page.goto(`${BASE}/?mode=${mode}`)

  const placeholderSeen = await page
    .locator('#placeholder')
    .waitFor({ state: 'visible', timeout: 3000 })
    .then(() => true)
    .catch(() => false)

  await waitDone(page)

  const frameChanges = await page.evaluate(
    () => (window as any).__frameChangeLogs?.length ?? 0,
  )

  await page.waitForTimeout(1500) // beri waktu skrip final & animasi selesai

  // (b) frame aktif tidak kosong (via CDP)
  const activeBodyChars = await (await activeFrame(page))!.evaluate(
    () => document.body ? document.body.innerHTML.length : -1,
  )

  // (c) animasi .rise: bandingkan 10 screenshot beruntun 150ms di fase FINAL
  const { statSync } = await import('node:fs')
  const { join } = await import('node:path')
  const shotSizes: number[] = []
  for (let i = 0; i < 10; i++) {
    const name = `final-flicker-${mode}-${i}.png`
    await page.screenshot({ path: join(SHOT_DIR, name) })
    shotSizes.push(statSync(join(SHOT_DIR, name)).size)
    await page.waitForTimeout(150)
  }
  const riseEvents = await page.evaluate(() => (window as any).__riseEvents ?? [])

  // (e) Tailwind menata halaman: computed style h1 (via CDP)
  const h1Style = await (await activeFrame(page))!.evaluate(() => {
    const h1 = document.querySelector('h1')
    if (!h1) return null
    const st = getComputedStyle(h1)
    const hero = document.querySelector('#hero') as HTMLElement | null
    return {
      fontSize: st.fontSize,
      fontWeight: st.fontWeight,
      color: st.color,
      heroBgImage: hero ? getComputedStyle(hero).backgroundImage : null,
    }
  })

  // (f) .reveal terlihat pada versi progresif (via CDP)
  const reveals = await (await activeFrame(page))!.evaluate(() =>
    Array.from(document.querySelectorAll('.reveal')).map((el) => ({
      opacity: getComputedStyle(el).opacity,
      hasIn: el.classList.contains('in'),
    })),
  )

  // (g) skrip final berjalan: class js, reveal.in, widget bisa diklik
  const finalChecks = await (await activeFrame(page))!.evaluate(() => ({
    htmlHasJs: document.documentElement.classList.contains('js'),
    revealCount: document.querySelectorAll('.reveal').length,
    revealInCount: document.querySelectorAll('.reveal.in').length,
    hasWidget: !!document.querySelector('#calc-btn'),
    yearSet: document.getElementById('year')?.textContent ?? '',
  }))

  let widgetResult = ''
  if (finalChecks.hasWidget) {
    const fl = page.frameLocator('#frame-a')
    await fl.locator('#brew-bijis').fill('15')
    await fl.locator('#brew-air').fill('250')
    await fl.locator('#calc-btn').click()
    widgetResult = (await fl.locator('#result').textContent()) ?? ''
  }

  // (g-final) versi final identik dengan HTML dari event done:
  // bandingkan outerHTML dokumen aktif dengan HTML mentah event done.
  const finalHtmlApplied = await page.evaluate(
    () => (window as any).__finalHtmlApplied ?? null,
  )
  const docHtml = await (await activeFrame(page))!.evaluate(
    () => '<!DOCTYPE html>' + document.documentElement.outerHTML,
  )
  const finalIdentical = finalHtmlApplied
    ? docHtml.replace(/\s+/g, ' ').startsWith(
        finalHtmlApplied.replace(/\s+/g, ' ').slice(0, 200),
      )
    : false

  return {
    mode,
    placeholderSeen,
    frameChanges,
    activeBodyChars,
    shotSizes,
    uniqueShotSizes: new Set(shotSizes).size,
    riseEventCount: riseEvents.length,
    h1Style,
    reveals,
    finalChecks,
    widgetResult,
    finalIdentical,
  }
}

test.describe('Preview progresif (browser sungguhan)', () => {
  test.beforeEach(async () => {
    const { mkdirSync } = await import('node:fs')
    mkdirSync(SHOT_DIR, { recursive: true })
  })

  test('UKUR SEBELUM: mode=before (a-g)', async ({ page }) => {
    const r = await measureMode(page, 'before')
    console.log('=== HASIL SEBELUM (mode=before) ===')
    console.log(JSON.stringify(r, null, 2))
    expect(r.placeholderSeen).toBe(true)
    expect(r.activeBodyChars).toBeGreaterThan(0)
  })

  test('UKUR SESUDAH: mode=after (a-g)', async ({ page }) => {
    const r = await measureMode(page, 'after')
    console.log('=== HASIL SESUDAH (mode=after) ===')
    console.log(JSON.stringify(r, null, 2))
    // (b) frame aktif tidak pernah kosong
    expect(r.activeBodyChars).toBeGreaterThan(0)
    // (e) Tailwind menata halaman (h1 bukan default UA 32px; bg hero gradient)
    expect(r.h1Style).not.toBeNull()
    expect(r.h1Style!.fontSize).not.toBe('32px')
    expect(r.h1Style!.heroBgImage).toContain('linear-gradient')
    // (f) .reveal terlihat pada versi progresif
    expect(r.reveals.length).toBeGreaterThan(0)
    for (const rv of r.reveals) expect(rv.opacity).toBe('1')
    // (g) skrip final berjalan
    expect(r.finalChecks.htmlHasJs).toBe(true)
    expect(r.finalChecks.revealCount).toBeGreaterThan(0)
    expect(r.finalChecks.revealInCount).toBe(r.finalChecks.revealCount)
    expect(r.widgetResult).toContain('Rasio')
    // (g-final) versi final identik dengan HTML event done
    expect(r.finalIdentical).toBe(true)
    // (c) animasi tidak diputar ulang di fase final: beruntun stabil
    expect(r.uniqueShotSizes).toBeLessThanOrEqual(2)
  })

  test('c-detail: animasi .rise diputar ulang tiap pergantian (mode=before, bukti cacat)', async ({ page }) => {
    await page.goto(`${BASE}/?mode=before`)
    await waitDone(page)
    const riseEvents = await page.evaluate(() => (window as any).__riseEvents ?? [])
    console.log(`[c-before] animationstart .rise tercatat: ${riseEvents.length}x`, riseEvents)
    // Perilaku lama: animasi hero diputar ulang pada tiap pembaruan buffer.
    expect(riseEvents.length).toBeGreaterThanOrEqual(1)
  })

  test('c-detail: TIDAK ada animasi diputar ulang pada versi progresif (mode=after)', async ({ page }) => {
    await page.goto(`${BASE}/?mode=after`)
    await waitDone(page)
    // Screenshot beruntun 10x150ms pada fase FINAL harus stabil
    const { statSync } = await import('node:fs')
    const { join } = await import('node:path')
    const sizes: number[] = []
    for (let i = 0; i < 10; i++) {
      const name = `final-flicker-after-detail-${i}.png`
      await page.screenshot({ path: join(SHOT_DIR, name) })
      sizes.push(statSync(join(SHOT_DIR, name)).size)
      await page.waitForTimeout(150)
    }
    const unique = new Set(sizes).size
    console.log(`[c-after] 10 screenshot beruntun: ${sizes.join(',')} (unik=${unique})`)
    expect(unique).toBeLessThanOrEqual(2)
  })

  test('d-detail: scrollTop dipertahankan saat streaming (mode=after)', async ({ page }) => {
    await page.goto(`${BASE}/?mode=after`)
    await waitForActiveFrame(page)

    const scrolled = await (await activeFrame(page))!.evaluate(() => {
      scrollTo(0, 300)
      return scrollY
    })
    expect(scrolled).toBe(300)

    await waitDone(page)
    const finalScroll = await (await activeFrame(page))!.evaluate(() => window.scrollY)
    console.log(`[d-after] scrollTop awal=300, setelah selesai=${finalScroll}`)
    expect(finalScroll).toBeGreaterThan(0)
  })

  test('d-detail: scrollTop kembali 0 saat streaming (mode=before, bukti cacat)', async ({ page }) => {
    await page.goto(`${BASE}/?mode=before`)
    await waitForActiveFrame(page)

    const scrolled = await (await activeFrame(page))!.evaluate(() => {
      scrollTo(0, 300)
      return scrollY
    })
    expect(scrolled).toBe(300)

    await waitDone(page)
    const finalScroll = await (await activeFrame(page))!.evaluate(() => window.scrollY)
    console.log(`[d-before] scrollTop awal=300, setelah selesai=${finalScroll}`)
    // Perilaku lama: scroll ter-reset saat pembaruan buffer.
    expect(finalScroll).toBe(0)
  })

  test('b-detail: tidak ada frame putih/kosong di antara buffer (kedua mode)', async ({ page }) => {
    for (const mode of ['before', 'after'] as const) {
      await page.goto(`${BASE}/?mode=${mode}`)
      let sawEmpty = false
      let stop = false
      void (async () => {
        while (!stop) {
          try {
            const fr = await activeFrame(page)
            if (fr) {
              const chars = await fr.evaluate(
                () => (document.body ? document.body.innerHTML.length : 0),
              )
              if (chars === 0) {
                sawEmpty = true
                console.log(`[b-${mode}] frame aktif KOSONG terpantau!`)
              }
            }
          } catch { /* frame berganti; abaikan */ }
          await page.waitForTimeout(50)
        }
      })()
      await waitDone(page)
      stop = true
      await page.waitForTimeout(300)
      console.log(`[b] mode=${mode} frame aktif kosong terpantau: ${sawEmpty}`)
      if (mode === 'after') expect(sawEmpty).toBe(false)
      // mode before boleh kosong (itu cacat yang diperbaiki); dicatat saja.
    }
  })

  test('h-detail: tunggu awal panjang 40 detik (heartbeat) tetap di fase Menyiapkan', async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto(`${BASE}/?mode=after&sseUrl=${encodeURIComponent(BASE + '/sse-slow')}`)

    const t0 = Date.now()
    // Selama 40 detik harus tetap placeholder "Menyiapkan rancangan…", tanpa error
    await page.waitForTimeout(5000)
    const midState = await page.evaluate(() => ({
      status: document.getElementById('status-text')?.textContent,
      placeholderVisible: document.getElementById('placeholder')?.style.display !== 'none',
      errorVisible: document.getElementById('error-box')?.style.display !== 'none',
    }))
    console.log(`[h] t+5s: ${JSON.stringify(midState)}`)
    expect(midState.placeholderVisible).toBe(true)
    expect(midState.errorVisible).toBe(false)
    expect(midState.status).toContain('Menyiapkan rancangan')

    // Setelah token pertama tiba, streaming berjalan normal sampai Selesai
    await waitDone(page, 60_000)
    const waited = (Date.now() - t0) / 1000
    const done = await page.evaluate(() => ({
      frameChanges: (window as any).__frameChangeLogs?.length ?? 0,
      errored: (window as any).__errored ?? false,
    }))
    console.log(`[h] total tunggu=${waited.toFixed(1)}s, frameChanges=${done.frameChanges}, errored=${done.errored}`)
    expect(done.errored).toBe(false)
    expect(done.frameChanges).toBeGreaterThanOrEqual(1)
  })

  test('i-detail: error di tengah stream (~700 token) → indikator berhenti, label Belum selesai, coba lagi bersih', async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto(`${BASE}/?mode=after&sseUrl=${encodeURIComponent(BASE + '/sse-mid-error')}`)

    await page.locator('#error-box').waitFor({ state: 'visible', timeout: 30_000 })
    const errState = await page.evaluate(() => ({
      status: document.getElementById('status-text')?.textContent,
      errorText: document.getElementById('error-text')?.textContent,
      incompleteVisible: document.getElementById('incomplete-label')?.style.display !== 'none',
      erroredAt: (window as any).__erroredAt ?? null,
    }))
    console.log(`[i] setelah error: ${JSON.stringify(errState)}`)
    expect(errState.incompleteVisible).toBe(true)
    expect(errState.errorText).toContain('503')

    // Tidak ada pembaruan tertunda setelah error
    await page.waitForTimeout(2000)
    const afterErr = await page.evaluate(() => ({
      updatesAfterError: (window as any).__updatesAfterError ?? 0,
      frameChanges: (window as any).__frameChangeLogs?.length ?? 0,
    }))
    console.log(`[i] 2s setelah error: ${JSON.stringify(afterErr)}`)
    expect(afterErr.updatesAfterError).toBe(0)

    // Klik Coba Lagi → stream baru dengan state bersih
    await page.locator('#retry-btn').click()
    await waitDone(page, 60_000)
    const retried = await page.evaluate(() => ({
      errored: (window as any).__errored ?? false,
      frameChanges: (window as any).__frameChangeLogs?.length ?? 0,
    }))
    const bodyChars = await (await activeFrame(page))!.evaluate(
      () => document.body ? document.body.innerHTML.length : 0,
    )
    console.log(`[i] setelah coba lagi: ${JSON.stringify(retried)}, bodyChars=${bodyChars}`)
    expect(retried.errored).toBe(false)
    expect(bodyChars).toBeGreaterThan(0)
  })

  test('error stream: pesan jelas + tombol coba lagi (sse-error)', async ({ page }) => {
    await page.goto(`${BASE}/?mode=after&sseUrl=${encodeURIComponent(BASE + '/sse-error')}`)
    await expect(page.locator('#error-box')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#retry-btn')).toBeVisible()
    await expect(page.locator('#incomplete-label')).toBeVisible()
  })
})
