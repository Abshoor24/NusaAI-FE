import { test, expect } from '@playwright/test'
import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import {
  mockLogin,
  mockWorkspaceApi,
  doneEvent,
  type WorkspaceState,
} from './workspace-helpers'

/**
 * Bukti terukur klaim "render token SSE sudah batch" (C3) dan
 * ketahanan preview HTML besar (C4). Tanpa AI sungguhan.
 */

const TOKEN = '0123456789abcdefghij' // tepat 20 karakter

/** Server SSE lokal: mengalirkan token dengan jeda agar interval batch teruji. */
async function startPacedSseServer(tokens: string[], gapMs: number): Promise<{ server: Server; url: string }> {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': 'http://localhost:5173',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      })
      res.end()
      return
    }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Access-Control-Allow-Origin': 'http://localhost:5173',
    })
    let i = 0
    const timer = setInterval(() => {
      if (i < tokens.length) {
        res.write(`event: token\ndata: {"token":"${tokens[i]}"}\n\n`)
        i += 1
      } else {
        clearInterval(timer)
        res.write(`event: done\ndata: ${JSON.stringify(doneEvent('p1', 1))}\n\n`)
        res.end()
      }
    }, gapMs)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as AddressInfo).port
  return { server, url: `http://127.0.0.1:${port}/sse` }
}

test('C3: 2000 token berkecepatan hanya memicu ratusan pembaruan DOM, bukan ribuan', async ({
  page,
}) => {
  test.setTimeout(120000)
  await mockLogin(page)
  const state: WorkspaceState = { status: 'draft', title: 'Tes', versions: [] }
  await mockWorkspaceApi(page, 'p1', state)

  await page.addInitScript(() => {
    window.__longtasks = []
    const po = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__longtasks.push(e.duration)
    })
    po.observe({ entryTypes: ['longtask'] })
    window.__churn = []
  })

  // 2000 token × 20 karakter = 40.000 karakter, 1 token per 2ms.
  const tokens = Array.from({ length: 2000 }, () => TOKEN)
  const { server, url } = await startPacedSseServer(tokens, 2)
  try {
    await page.route('**/api/v1/projects/p1/generate', (route) =>
      route.continue({ url, method: 'POST' }),
    )

    await page.goto('/projects/p1')
    await expect(page.getByRole('button', { name: 'Buat Website', exact: true })).toBeVisible({
      timeout: 15000,
    })

    await page.evaluate(() => {
      window.__churn = []
      const seen = new Set<string>()
      const mo = new MutationObserver(() => {
        const el = [...document.querySelectorAll('p')].find((p) =>
          p.textContent?.includes('karakter diterima'),
        )
        if (!el) return
        const t = (el.textContent ?? '').trim()
        if (!seen.has(t)) {
          seen.add(t)
          window.__churn.push(t)
        }
      })
      mo.observe(document.body, { childList: true, characterData: true, subtree: true })
      window.__stopChurn = () => mo.disconnect()
    })
    state.status = 'ready'
    state.versions = [
      { id: 'v1', version_number: 1, kind: 'generate', prompt: 'brief', html: '<h1>Halo</h1>' },
    ]
    await page.getByRole('button', { name: 'Buat Website', exact: true }).click()

    await expect(page.getByText('Versi 1 berhasil disimpan.')).toBeVisible({ timeout: 60000 })

    const stats = await page.evaluate(() => {
      window.__stopChurn?.()
      const nums = window.__churn
        .map((t: string) => Number.parseInt(t, 10))
        .filter((n: number) => !Number.isNaN(n))
      return {
        updates: window.__churn.length,
        maxChars: nums.length > 0 ? Math.max(...nums) : 0,
        longtasks: window.__longtasks.length,
        maxLongtask: window.__longtasks.length > 0 ? Math.max(...window.__longtasks) : 0,
      }
    })

    // eslint-disable-next-line no-console
    console.log('[C3]', JSON.stringify(stats))
    // Seluruh 40.000 karakter tiba utuh (toleransi flush terakhir) ...
    expect(stats.maxChars).toBeGreaterThanOrEqual(39000)
    // ... dengan pembaruan DOM orde ratusan (interval ~100ms),
    // bukan ribuan (satu render per token).
    expect(stats.updates).toBeGreaterThan(0)
    expect(stats.updates).toBeLessThan(1000)
    // Tidak ada long task yang membekukan UI.
    expect(stats.maxLongtask).toBeLessThan(1000)
  } finally {
    server.close()
  }
})

test('C4: preview HTML ~500 KB tampil tanpa membekukan UI', async ({ page }) => {
  await mockLogin(page)
  const bigHtml = `<html><body>${'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>'.repeat(8500)}</body></html>`
  expect(bigHtml.length).toBeGreaterThan(450000)
  const state: WorkspaceState = {
    status: 'ready',
    title: 'Besar',
    versions: [{ id: 'v1', version_number: 1, kind: 'generate', prompt: 'brief', html: bigHtml }],
  }
  await mockWorkspaceApi(page, 'p1', state)

  await page.goto('/projects/p1')
  const frame = page.locator('iframe[title="Pratinjau website"]')
  await expect(frame).toBeVisible({ timeout: 15000 })

  // UI tetap responsif: tombol masih bisa diklik dan JS dievaluasi cepat.
  const t0 = Date.now()
  const ping = await page.evaluate(() => 40 + 2)
  const elapsed = Date.now() - t0
  expect(ping).toBe(42)
  expect(elapsed).toBeLessThan(2000)
  // eslint-disable-next-line no-console
  console.log(`[C4] html=${bigHtml.length} byte, respons-eval=${elapsed}ms`)
  await page.getByRole('button', { name: 'Muat Ulang' }).click()
  await expect(frame).toBeVisible({ timeout: 15000 })
})
