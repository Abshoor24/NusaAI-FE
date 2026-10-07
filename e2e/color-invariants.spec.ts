import { test, expect } from '@playwright/test'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  envelope,
  mockLogin,
  mockWorkspaceApi,
  versionHtml,
  type WorkspaceState,
} from './workspace-helpers'

/**
 * WARNA TIDAK BOLEH BERUBAH (Fase 4.1).
 *
 * Membandingkan getComputedStyle (color, background-color, border-color,
 * outline-color, box-shadow, border-radius) dengan fixture
 * fixtures/color-baseline.json untuk elemen yang SAMA di tema terang dan
 * gelap. Padding/ukuran/line-height TIDAK dibandingkan: perubahan spasi dan
 * tipografi adalah tujuan pekerjaan ini.
 *
 * Kalau dipanggil dengan env UPDATE_COLOR_BASELINE=1, test menulis ulang
 * fixture dari kondisi saat ini (dipakai untuk membuat baseline dari kode
 * yang belum dirapikan).
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURE = resolve(HERE, '../fixtures/color-baseline.json')
const UPDATE = process.env.UPDATE_COLOR_BASELINE === '1'

/** Properti yang tidak boleh berubah satu pun. */
const COLOR_PROPS = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'boxShadow',
  'borderRadius',
] as const

/**
 * Selector stabil (bukan indeks DOM) + label agar kunci fixture tidak
 * bergeser saat jumlah elemen berubah. Selector urut dari paling umum ke
 * paling khas; 4 elemen pertama per selector.
 */
const PROBES: Array<{ sel: string; limit?: number }> = [
  { sel: 'body' },
  { sel: 'main#konten-utama' },
  { sel: 'aside' },
  { sel: 'header' },
  { sel: 'footer' },
  { sel: 'nav[aria-label="Navigasi utama"]' },
  { sel: 'nav[aria-label="Navigasi seluler"]' },
  { sel: 'header a[href="/"]' },
  { sel: 'header nav a' },
  { sel: 'header button[aria-label*="mode"]' },
  { sel: 'aside nav a' },
  { sel: 'aside button[aria-label="Menu akun"]' },
  { sel: 'main a[href*="/projects"]' },
  { sel: 'main h1' },
  { sel: 'main h2' },
  { sel: 'main p' },
  { sel: 'main button' },
  { sel: 'main input' },
  { sel: 'main textarea' },
  { sel: 'main select' },
  { sel: 'main [role="alert"]' },
  { sel: 'main [role="status"]' },
  { sel: 'main [role="switch"]' },
  { sel: 'main [role="radiogroup"] > label' },
  { sel: 'main [role="progressbar"]' },
  { sel: 'main [role="dialog"]' },
  { sel: 'main [role="dialog"] header' },
  { sel: 'main [role="dialog"] button' },
  { sel: 'main label' },
  { sel: 'main li' },
  { sel: 'main ul' },
  { sel: 'main section' },
  { sel: 'main img' },
  { sel: 'main iframe' },
  { sel: 'main .rounded-full' },
  { sel: 'main .sticky' },
]

interface ProbeStyles {
  [k: string]: string
}
export interface ProbeRecord {
  label: string
  styles: ProbeStyles
}
export interface Snapshot {
  route: string
  theme: string
  key: string
  nodes: Record<string, ProbeRecord>
}

const ROUTES: Array<{ key: string; url: string; auth: boolean; openAll?: boolean; list?: 'empty' | 'filled' }> = [
  { key: 'landing', url: '/', auth: false },
  { key: 'login', url: '/login', auth: false },
  { key: 'register', url: '/register', auth: false },
  { key: 'projects-empty', url: '/projects', auth: true, list: 'empty' },
  { key: 'projects-filled', url: '/projects', auth: true, list: 'filled' },
  { key: 'brief-closed', url: '/projects/new', auth: true },
  { key: 'brief-open', url: '/projects/new', auth: true, openAll: true },
  { key: 'workspace', url: '/projects/p1', auth: true },
  { key: 'settings', url: '/settings', auth: true },
  { key: 'notfound', url: '/tidak-ada', auth: true },
]

function projectItem(id: string, title: string, status: string) {
  return {
    id,
    title,
    status,
    brief: { description: 'Deskripsi project untuk pengujian.' },
    version_count: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

async function installMocks(page: import('@playwright/test').Page, list?: 'empty' | 'filled'): Promise<void> {
  await mockLogin(page)
  const state: WorkspaceState = {
    status: 'ready',
    title: 'Kedai Kopi',
    versions: [
      { id: 'v1', version_number: 1, kind: 'generate', prompt: 'brief', html: versionHtml(1) },
    ],
  }
  await mockWorkspaceApi(page, 'p1', state)
  await page.route('**/api/v1/projects?*', (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    const items =
      list === 'empty'
        ? []
        : [
            projectItem('p1', 'Kedai Kopi', 'ready'),
            projectItem('p2', 'Toko Roti', 'generating'),
            projectItem('p3', 'Kafe Aroma', 'failed'),
          ]
    return route.fulfill({ json: envelope(items) })
  })
}

async function openEverything(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForTimeout(700)
  for (const b of await page.locator('button[aria-expanded]').all()) {
    if ((await b.getAttribute('aria-expanded')) === 'false') {
      await b.scrollIntoViewIfNeeded()
      await b.click()
      await page.waitForTimeout(220)
    }
  }
  for (const s of await page.locator('details > summary').all()) {
    const isOpen = await s.evaluate((el) => (el.parentElement as HTMLDetailsElement | null)?.open ?? false)
    if (!isOpen) {
      await s.scrollIntoViewIfNeeded()
      await s.click()
      await page.waitForTimeout(150)
    }
  }
  await page.waitForTimeout(600)
}

async function snapshot(
  page: import('@playwright/test').Page,
  theme: string,
  route: string,
  key: string,
): Promise<Snapshot> {
  const nodes = await page.evaluate(
    ({ probes, props }) => {
      const out: Record<string, { label: string; styles: Record<string, string> }> = {}
      for (const { sel, limit } of probes) {
        const els = Array.from(document.querySelectorAll(sel)).filter(
          (el) => el instanceof HTMLElement && getComputedStyle(el).display !== 'none',
        )
        const seen = new Map<string, number>()
        for (const el of els) {
          const cs = getComputedStyle(el)
          const aria = el.getAttribute('aria-label') ?? el.getAttribute('role') ?? ''
          const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 28)
          let label = `${sel}${aria ? `[${aria}]` : ''}${text ? ` "${text}"` : ''}`
          const n = seen.get(label) ?? 0
          seen.set(label, n + 1)
          if (n > 0) label += `#${n}`
          if (limit && Object.keys(out).filter((k) => k.startsWith(`${sel}${aria ? `[${aria}]` : ''}`)).length >= limit) continue
          const styles: Record<string, string> = {}
          for (const p of props) styles[p] = cs[p as keyof CSSStyleDeclaration] as string
          out[label] = { label, styles }
          if (Object.keys(out).filter((k) => k.startsWith(`${sel}${aria ? `[${aria}]` : ''}`)).length >= (limit ?? 4)) break
        }
      }
      return out
    },
    { probes: PROBES.map((p) => ({ sel: p.sel, limit: p.limit ?? 4 })), props: [...COLOR_PROPS] },
  )
  return { route, theme, key, nodes }
}

test.describe('warna tidak berubah (Fase 4.1)', () => {
  test('proses rekaman warna di semua rute dan dua tema', async () => {
    test.setTimeout(600_000)
    const snapshots: Snapshot[] = []
    const { chromium } = await import('playwright')
    const browser = await chromium.launch()
    try {
      for (const theme of ['light', 'dark'] as const) {
        for (const r of ROUTES) {
          const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
          const page = await ctx.newPage()
          await page.addInitScript((t) => {
            window.localStorage.setItem('theme', t)
          }, theme)
          if (r.auth) await installMocks(page, r.list)
          await page.goto(r.url, { waitUntil: 'networkidle' })
          await page.waitForTimeout(700)
          if (r.openAll) await openEverything(page)
          snapshots.push(await snapshot(page, theme, r.url, r.key))
          await ctx.close()
        }
      }
    } finally {
      await browser.close()
    }

    if (UPDATE) {
      writeFileSync(FIXTURE, JSON.stringify(snapshots, null, 1))
      test.info().annotations.push({ type: 'color-baseline', description: `ditulis: ${snapshots.length} snapshot` })
      return
    }

    expect(existsSync(FIXTURE), `fixture ${FIXTURE} harus ada`).toBe(true)
    const baseline = JSON.parse(readFileSync(FIXTURE, 'utf-8')) as Snapshot[]

    const byKey = new Map(baseline.map((s) => [`${s.theme}|${s.key}`, s]))
    const diffs: string[] = []
    const added: string[] = []
    const removed: string[] = []

    for (const snap of snapshots) {
      const base = byKey.get(`${snap.theme}|${snap.key}`)
      if (!base) {
        diffs.push(`${snap.theme}/${snap.key}: tidak ada di baseline`)
        continue
      }
      if (base.route !== snap.route) {
        diffs.push(`${snap.theme}/${snap.key}: route berubah ${base.route} -> ${snap.route}`)
      }
      for (const [label, rec] of Object.entries(snap.nodes)) {
        const b = base.nodes[label]
        if (!b) {
          added.push(`${snap.theme}/${snap.key} ${label}`)
          continue
        }
        for (const prop of COLOR_PROPS) {
          if (b.styles[prop] !== rec.styles[prop]) {
            diffs.push(
              `${snap.theme}/${snap.key} ${label} :: ${prop} ${b.styles[prop]} -> ${rec.styles[prop]}`,
            )
          }
        }
      }
      for (const label of Object.keys(base.nodes)) {
        if (!snap.nodes[label]) removed.push(`${snap.theme}/${snap.key} ${label}`)
      }
    }
    for (const b of baseline) {
      if (!snapshots.find((s) => `${s.theme}|${s.key}` === `${b.theme}|${b.key}`)) {
        diffs.push(`${b.theme}/${b.key}: hilang di run ini`)
      }
    }

    test.info().annotations.push(
      { type: 'elemen-baru', description: added.join('\n') || '(tidak ada)' },
      { type: 'elemen-hilang', description: removed.join('\n') || '(tidak ada)' },
    )
    expect(diffs, `perubahan warna terdeteksi:\n${diffs.join('\n')}`).toEqual([])
    if (added.length || removed.length) {
      // Dicatat satu per satu, bukan digagalkan: perubahan struktur UI yang
      // disengaja tidak boleh diam-diam.
      console.log(`[warna] elemen baru (${added.length}):\n${added.join('\n')}`)
      console.log(`[warna] elemen hilang (${removed.length}):\n${removed.join('\n')}`)
    }
  })
})
