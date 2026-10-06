import { expect, type Page } from '@playwright/test'

/**
 * Invarian layout anti "layar kosong" (Fase 1).
 *
 * Bug: input sr-only (position:absolute) di dalam <form> yang static memakai
 * <main id="konten-utama"> (relative) sebagai containing block, sehingga
 * <main> yang overflow-hidden ikut tergulir saat input difokus dan mendorong
 * form keluar layar. Tes ini menjamin <main> tidak pernah bisa digulir.
 */

export interface ErrorHooks {
  pageErrors: string[]
  consoleErrors: string[]
}

/** Pasang SEBELUM page.goto agar error awal ikut tercatat. */
export function installErrorHooks(page: Page): ErrorHooks {
  const hooks: ErrorHooks = { pageErrors: [], consoleErrors: [] }
  page.on('pageerror', (err) => {
    let url = ''
    try {
      url = page.url()
    } catch {
      url = '?'
    }
    hooks.pageErrors.push(`${url} :: ${String((err as Error)?.message ?? err).slice(0, 300)}`)
  })
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    // Tes error-state SENGAJA membalas 500: "Failed to load resource" adalah
    // gema mock tersebut, bukan bug aplikasi (fallback-nya di-assert terpisah).
    if (/^Failed to load resource/.test(text)) return
    hooks.consoleErrors.push(text.slice(0, 300))
  })
  return hooks
}

export interface LayoutSnapshot {
  main: {
    scrollTop: number
    scrollHeight: number
    clientHeight: number
    overflowY: string
    position: string
    boxHeight: number
  }
  formPresent: boolean
  /** form.rect.top - main.rect.top (negatif = form terdorong keluar layar). */
  formTopRelMain: number | null
  /** Elemen di dalam <main> yang bisa digulir vertikal (scrollHeight > clientHeight). */
  scrollers: string[]
  /** Input sr-only yang offsetParent-nya lolos ke luar form (sinyal bug). */
  absEscapees: string[]
  /**
   * Generik (3.2): elemen position:absolute yang offsetParent-nya berada di
   * luar scroll container terdekat SEKALIGUS melebihi batas container itu.
   */
  absOverflows: string[]
}

/** Ukur keadaan layout saat ini di Chromium (jsdom tidak menghitung layout). */
export async function readLayout(page: Page): Promise<LayoutSnapshot> {
  return page.evaluate(() => {
    const main = document.querySelector('main#konten-utama') as HTMLElement | null
    if (!main) return { noMain: true } as unknown as LayoutSnapshot
    const mr = main.getBoundingClientRect()
    const mcs = getComputedStyle(main)
    const form = main.querySelector('form') as HTMLElement | null
    const formTopRelMain = form ? form.getBoundingClientRect().top - mr.top : null
    const scrollers: string[] = []
    for (const el of Array.from(main.querySelectorAll('*'))) {
      if (!(el instanceof HTMLElement)) continue
      const cs = getComputedStyle(el)
      // Hanya wadah scroll sungguhan (overflow auto/scroll): elemen
      // overflow-visible dengan selisih sub-piksel bukan scroll container
      // dan tidak bisa digulir pengguna.
      if (cs.overflowY !== 'auto' && cs.overflowY !== 'scroll') continue
      if (el.scrollHeight <= el.clientHeight + 1) continue
      const r = el.getBoundingClientRect()
      if (r.width < 2 || r.height < 2) continue
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      scrollers.push(`${el.tagName}.${String(el.className || '').split(' ')[0]}`.slice(0, 80))
    }
    const absEscapees: string[] = []
    for (const input of Array.from(main.querySelectorAll('input.sr-only'))) {
      if (!(input instanceof HTMLElement)) continue
      const op = input.offsetParent as HTMLElement | null
      // offsetParent null = di panel accordion yang display:none (wajar).
      if (!op) continue
      if (form && !form.contains(op)) {
        absEscapees.push(
          `${input.tagName}.${String(input.className || '').slice(0, 40)}->${op.tagName}#${op.id}`,
        )
      }
    }
    const absOverflows: string[] = []
    const isScrollContainer = (el: HTMLElement): boolean => {
      const cs = getComputedStyle(el)
      return cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowY === 'auto' || cs.overflowY === 'scroll'
    }
    for (const el of Array.from(main.querySelectorAll('*'))) {
      if (!(el instanceof HTMLElement)) continue
      if (getComputedStyle(el).position !== 'absolute') continue
      const r = el.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) continue
      const op = el.offsetParent as HTMLElement | null
      if (!op) continue
      // Scroll container terdekat (diri sendiri bila ia wadah scroll).
      let sc: HTMLElement | null = null
      let a: HTMLElement | null = el
      while (a && a !== main.parentElement) {
        if (isScrollContainer(a)) {
          sc = a
          break
        }
        a = a.parentElement
      }
      const container = sc ?? main
      if (op === container || container.contains(op)) continue
      const cr = container.getBoundingClientRect()
      const outside =
        r.bottom < cr.top - 1 || r.top > cr.bottom + 1 || r.right < cr.left - 1 || r.left > cr.right + 1
      if (outside) {
        absOverflows.push(
          `${el.tagName}.${String(el.className || '').split(' ')[0]}->${op.tagName}#${op.id}`.slice(0, 90),
        )
      }
    }
    return {
      main: {
        scrollTop: main.scrollTop,
        scrollHeight: main.scrollHeight,
        clientHeight: main.clientHeight,
        overflowY: mcs.overflowY,
        position: mcs.position,
        boxHeight: mr.height,
      },
      formPresent: !!form,
      formTopRelMain,
      scrollers,
      absEscapees,
      absOverflows,
    }
  })
}

export interface InvariantOptions {
  /** Label langkah, muncul di pesan assertion. */
  label: string
  /** Bila true (default di /projects/new): form harus ada & tidak terdorong. */
  formExpected?: boolean
}

/**
 * Assert invarian setelah SETIAP interaksi. Memakai expect.soft agar satu
 * test melaporkan SEMUA titik gagal, bukan berhenti di yang pertama.
 */
export async function expectLayoutInvariants(
  page: Page,
  opts: InvariantOptions,
): Promise<LayoutSnapshot> {
  const tag = `[${opts.label}]`
  const s = await readLayout(page)
  const main = (s as LayoutSnapshot).main
  await expect.soft(main.scrollTop, `${tag} <main> tidak boleh tergulir`).toBe(0)
  await expect.soft(
    main.scrollHeight,
    `${tag} <main> tidak boleh punya overflow scroll (sh=${main.scrollHeight} vs ch=${main.clientHeight})`,
  ).toBeLessThanOrEqual(main.clientHeight + 1)
  await expect.soft(s.scrollers.length, `${tag} scroll vertikal hanya di 1 container: ${s.scrollers.join(', ')}`).toBeLessThanOrEqual(1)
  if (opts.formExpected !== false && s.formPresent && s.formTopRelMain !== null) {
    await expect.soft(
      s.formTopRelMain,
      `${tag} form tidak boleh terdorong keluar <main> (rel=${s.formTopRelMain})`,
    ).toBeGreaterThanOrEqual(-1)
  }
  await expect.soft(s.absEscapees.length, `${tag} input sr-only lolos ke luar form: ${s.absEscapees.slice(0, 3).join('; ')}`).toBe(0)
  await expect.soft(s.absOverflows.length, `${tag} absolute lolos & melebihi wadah scroll: ${s.absOverflows.slice(0, 3).join('; ')}`).toBe(0)
  await expect.soft(main.boxHeight, `${tag} <main> harus punya tinggi`).toBeGreaterThan(0)
  return s
}

/** Tidak boleh ada pageerror / console error selama test. */
export function expectNoPageErrors(hooks: ErrorHooks, label: string): void {
  expect(hooks.pageErrors, `[${label}] pageerror`).toEqual([])
  expect(hooks.consoleErrors, `[${label}] console error`).toEqual([])
}
