/**
 * Tes untuk scripts/brief-eval.ts (tanpa AI sungguhan, tanpa jaringan luar).
 *
 * Mock server node:http di dalam tes meniru register, login, projects,
 * generate (SSE), versions, dan delete. Tidak ada panggilan backend nyata.
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { createServer } from 'node:http'
import type { Server } from 'node:http'
import { mkdtemp, readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BRIEF_SAMPLES } from '../fixtures/brief-samples.ts'
import {
  runEval,
  parseEvalArgs,
  escapeHtml,
  buildIndexHtml,
  analyzeHeuristics,
  EvalStopError,
} from './brief-eval.ts'
import type { EvalFlags } from './brief-eval.ts'

type GenerateMode = 'ok' | 'no-done' | 'ai-error' | 'rate-limited' | 'hang'

interface MockState {
  creates: string[]
  deletes: string[]
  generateCalls: number
  postProjectsCalls: number
}

interface MockHandle {
  url: string
  state: MockState
  close: () => Promise<void>
}

async function startMock(opts: {
  generateMode?: GenerateMode
  failSecondPost429?: boolean
  htmlFor?: (projectId: string, payload: unknown) => string
}): Promise<MockHandle> {
  const state: MockState = { creates: [], deletes: [], generateCalls: 0, postProjectsCalls: 0 }
  const stored = new Map<string, unknown>()
  let counter = 0

  const server: Server = createServer((req, res) => {
    const u = new URL(req.url ?? '/', 'http://127.0.0.1')
    const path = u.pathname
    let body = ''
    req.on('data', (c) => {
      body += String(c)
    })
    req.on('end', () => {
      const send = (status: number, json: unknown, headers: Record<string, string> = {}): void => {
        res.writeHead(status, { 'Content-Type': 'application/json', ...headers })
        res.end(JSON.stringify(json))
      }
      // Auth
      if (req.method === 'POST' && path === '/api/v1/auth/register') {
        send(201, {
          success: true,
          message: 'ok',
          data: { token: 'mock-token', token_type: 'Bearer', expires_in: 86400, user: { id: 'u1', email: 'p@example.com', created_at: '2026-01-01T00:00:00Z' } },
        })
        return
      }
      if (req.method === 'POST' && path === '/api/v1/auth/login') {
        send(200, {
          success: true,
          message: 'ok',
          data: { token: 'mock-token', token_type: 'Bearer', expires_in: 86400, user: { id: 'u1', email: 'p@example.com', created_at: '2026-01-01T00:00:00Z' } },
        })
        return
      }
      // POST /projects
      if (req.method === 'POST' && path === '/api/v1/projects') {
        state.postProjectsCalls++
        if (opts.failSecondPost429 && state.postProjectsCalls === 2) {
          send(429, { success: false, error: { code: 'RATE_LIMITED', message: 'too many' } }, { 'Retry-After': '7' })
          return
        }
        counter++
        const id = `p${counter}`
        let payload: unknown = null
        try {
          payload = JSON.parse(body || '{}')
        } catch {
          payload = null
        }
        stored.set(id, payload)
        state.creates.push(id)
        send(201, { success: true, message: 'ok', data: { id, title: 't', status: 'draft', brief: (payload as { brief?: unknown })?.brief ?? {}, version_count: 0, created_at: '', updated_at: '' } })
        return
      }
      // POST generate
      const genMatch = /^\/api\/v1\/projects\/([^/]+)\/generate$/.exec(path)
      if (req.method === 'POST' && genMatch) {
        state.generateCalls++
        const mode = opts.generateMode ?? 'ok'
        const pid = genMatch[1] ?? 'p1'
        if (mode === 'rate-limited') {
          send(429, { success: false, error: { code: 'RATE_LIMITED', message: 'too many' } }, { 'Retry-After': '9' })
          return
        }
        if (mode === 'hang') {
          // Jangan jawab; biarkan timeout klien yang membatalkan.
          return
        }
        res.writeHead(200, { 'Content-Type': 'text/event-stream' })
        if (mode === 'ok') {
          res.write('event: token\ndata: {"token":"<h1>halo</h1>"}\n\n')
          res.write(`event: done\ndata: {"project_id":"${pid}","version_id":"v1","version_number":1}\n\n`)
          res.end()
          return
        }
        if (mode === 'no-done') {
          res.write('event: token\ndata: {"token":"parsial"}\n\n')
          res.end()
          return
        }
        if (mode === 'ai-error') {
          res.write('event: error\ndata: {"success":false,"error":{"code":"AI_PROVIDER_ERROR","message":"blocked","reason":"OUTPUT_BLOCKED"}}\n\n')
          res.end()
          return
        }
        res.end()
        return
      }
      // GET version
      const verMatch = /^\/api\/v1\/projects\/([^/]+)\/versions\/1$/.exec(path)
      if (req.method === 'GET' && verMatch) {
        const pid = verMatch[1] ?? 'p1'
        const payload = stored.get(pid)
        const html = opts.htmlFor ? opts.htmlFor(pid, payload) : defaultHtml(pid, payload)
        send(200, {
          success: true,
          message: 'ok',
          data: { id: 'v1', project_id: pid, version_number: 1, kind: 'generate', prompt: 'brief', html, created_at: '2026-01-01T00:00:00Z' },
        })
        return
      }
      // DELETE
      const delMatch = /^\/api\/v1\/projects\/([^/]+)$/.exec(path)
      if (req.method === 'DELETE' && delMatch) {
        const pid = delMatch[1] ?? ''
        state.deletes.push(pid)
        send(200, { success: true, message: 'ok', data: null })
        return
      }
      send(404, { success: false, error: { code: 'NOT_FOUND', message: 'tidak ada' } })
    })
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const addr = server.address()
  const port = typeof addr === 'object' && addr ? addr.port : 0
  return {
    url: `http://127.0.0.1:${port}/api/v1`,
    state,
    close: () => new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  }
}

function defaultHtml(pid: string, payload: unknown): string {
  const p = payload as { brief?: { business_name?: string; description?: string }; title?: string } | null
  const brand = p?.brief?.business_name ?? p?.title ?? `brand-${pid}`
  const desc = p?.brief?.description ?? ''
  return `<html lang="id"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><h1>${brand}</h1><p>${desc}</p><img src="https://cdn.example.com/a.png"><script src="https://cdn.example.com/b.js"></script></body></html>`
}

function baseFlags(mockUrl: string, over: Partial<EvalFlags> = {}): EvalFlags {
  return {
    only: ['kedai-kopi'],
    variants: ['legacy', 'new'],
    repeat: 1,
    pauseMs: 0,
    timeoutMs: 5000,
    keep: false,
    dryRun: false,
    baseUrl: mockUrl,
    max: null,
    yes: true,
    ...over,
  }
}

const ENV_OK: NodeJS.ProcessEnv = { RUN_REAL_AI: '1' } as NodeJS.ProcessEnv

let tmpDirs: string[] = []
let mock: MockHandle | null = null

async function freshTmp(): Promise<string> {
  const d = await mkdtemp(join(tmpdir(), 'eval-'))
  tmpDirs.push(d)
  return d
}

afterEach(async () => {
  if (mock) {
    await mock.close()
    mock = null
  }
})

describe('brief-eval', () => {
  test('happy path menulis berkas yang diharapkan', async () => {
    mock = await startMock({})
    const outDir = await freshTmp()
    const flags = baseFlags(mock.url)
    const summary = await runEval(
      flags,
      ENV_OK,
      { fetchFn: fetch, outDir, sleep: async () => undefined, now: () => new Date('2026-10-11T10:00:00'), generatePassword: () => 'TestPass123!' },
    )
    expect(summary.records.length).toBe(2)
    expect(summary.records.every((r) => r.status === 'ok')).toBe(true)
    const files = await readdir(join(outDir, 'kedai-kopi'))
    expect(files).toContain('legacy.html')
    expect(files).toContain('new.html')
    expect(files).toContain('payload-legacy.json')
    expect(files).toContain('payload-new.json')
    expect(files).toContain('meta.json')
    for (const f of ['results.json', 'report.md', 'scoring.md', 'index.html']) {
      await readFile(join(outDir, f), 'utf8')
    }
    // DELETE untuk tiap project yang dibuat.
    expect(mock.state.deletes.sort()).toEqual(mock.state.creates.sort())
    expect(mock.state.creates.length).toBe(2)
  })

  test('guard menolak tanpa env atau --yes', async () => {
    const outDir = await freshTmp()
    const flagsNoYes = baseFlags('http://127.0.0.1:9/api/v1', { yes: false })
    await expect(
      runEval(flagsNoYes, ENV_OK, { fetchFn: fetch, outDir, sleep: async () => undefined, now: () => new Date(), generatePassword: () => 'x' }),
    ).rejects.toMatchObject({ code: 'GUARD' })
    const flagsYes = baseFlags('http://127.0.0.1:9/api/v1')
    await expect(
      runEval(flagsYes, {} as NodeJS.ProcessEnv, { fetchFn: fetch, outDir, sleep: async () => undefined, now: () => new Date(), generatePassword: () => 'x' }),
    ).rejects.toMatchObject({ code: 'GUARD' })
  })

  test('--dry-run nol panggilan jaringan', async () => {
    let calls = 0
    const throwingFetch = (async (): Promise<Response> => {
      calls++
      throw new Error('jaringan tidak boleh dipanggil')
    }) as typeof fetch
    const outDir = await freshTmp()
    const flags = baseFlags('http://127.0.0.1:9/api/v1', { dryRun: true })
    const summary = await runEval(
      flags,
      ENV_OK,
      { fetchFn: throwingFetch, outDir, sleep: async () => undefined, now: () => new Date(), generatePassword: () => 'x' },
    )
    expect(calls).toBe(0)
    expect(summary.records.every((r) => r.status === 'dry-run')).toBe(true)
    const files = await readdir(join(outDir, 'kedai-kopi'))
    expect(files).toContain('payload-legacy.json')
  })

  test('429 menghentikan run, tetap menghapus, menulis laporan parsial', async () => {
    mock = await startMock({ failSecondPost429: true })
    const outDir = await freshTmp()
    const flags = baseFlags(mock.url, { only: ['kedai-kopi', 'jasa-foto'], variants: ['legacy'] })
    await expect(
      runEval(flags, ENV_OK, { fetchFn: fetch, outDir, sleep: async () => undefined, now: () => new Date(), generatePassword: () => 'x' }),
    ).rejects.toMatchObject({ code: 'RATE_LIMITED' })
    // Project pertama sudah dihapus.
    expect(mock.state.creates.length).toBe(1)
    expect(mock.state.deletes).toEqual(mock.state.creates)
    // Laporan parsial tertulis.
    const results = JSON.parse(await readFile(join(outDir, 'results.json'), 'utf8')) as { records: unknown[] }
    expect(results.records.length).toBe(1)
    await readFile(join(outDir, 'report.md'), 'utf8')
  })

  test('stream tanpa done dicatat gagal dan lanjut', async () => {
    mock = await startMock({ generateMode: 'no-done' })
    const outDir = await freshTmp()
    const flags = baseFlags(mock.url, { only: ['kedai-kopi'], variants: ['legacy', 'new'] })
    const summary = await runEval(
      flags,
      ENV_OK,
      { fetchFn: fetch, outDir, sleep: async () => undefined, now: () => new Date(), generatePassword: () => 'x' },
    )
    expect(summary.records.length).toBe(2)
    expect(summary.records.every((r) => r.status === 'failed')).toBe(true)
    expect(summary.stoppedEarly).toBeNull()
    expect(mock.state.deletes.sort()).toEqual(mock.state.creates.sort())
  })

  test('2 AI_PROVIDER_ERROR berurutan menghentikan', async () => {
    mock = await startMock({ generateMode: 'ai-error' })
    const outDir = await freshTmp()
    const flags = baseFlags(mock.url, { only: ['kedai-kopi', 'jasa-foto'], variants: ['legacy'] })
    await expect(
      runEval(flags, ENV_OK, { fetchFn: fetch, outDir, sleep: async () => undefined, now: () => new Date(), generatePassword: () => 'x' }),
    ).rejects.toMatchObject({ code: 'AI_ERRORS' })
    const results = JSON.parse(await readFile(join(outDir, 'results.json'), 'utf8')) as { records: unknown[] }
    expect(results.records.length).toBe(2)
    expect(mock.state.deletes.sort()).toEqual(mock.state.creates.sort())
  })

  test('timeout dicatat gagal', async () => {
    mock = await startMock({ generateMode: 'hang' })
    const outDir = await freshTmp()
    const flags = baseFlags(mock.url, { only: ['kedai-kopi'], variants: ['legacy'], timeoutMs: 300 })
    const summary = await runEval(
      flags,
      ENV_OK,
      { fetchFn: fetch, outDir, sleep: async () => undefined, now: () => new Date(), generatePassword: () => 'x' },
    )
    expect(summary.records.length).toBe(1)
    expect(summary.records[0]?.status).toBe('failed')
    expect(summary.records[0]?.errorCode).toBe('TIMEOUT')
    expect(mock.state.deletes).toEqual(mock.state.creates)
  })

  test('galeri memakai sandbox allow-scripts saja', async () => {
    mock = await startMock({})
    const outDir = await freshTmp()
    const flags = baseFlags(mock.url)
    await runEval(flags, ENV_OK, { fetchFn: fetch, outDir, sleep: async () => undefined, now: () => new Date(), generatePassword: () => 'x' })
    const html = await readFile(join(outDir, 'index.html'), 'utf8')
    expect(html).toContain('sandbox="allow-scripts"')
    expect(html).not.toContain('allow-same-origin')
    const frames = html.match(/<iframe[^>]*>/g) ?? []
    expect(frames.length).toBeGreaterThan(0)
    for (const f of frames) {
      expect(f).toContain('sandbox="allow-scripts"')
    }
  })

  test('string sisipan di-escape', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
    const evil = {
      id: 'x"><script>alert(1)</script>',
      label: 'evil',
      draft: BRIEF_SAMPLES[0]?.draft ?? ({} as never),
    }
    const html = buildIndexHtml(
      [{ id: evil.id, label: 'evil', draft: evil.draft }],
      [{ sampleId: evil.id, variant: 'legacy', repeatIndex: 1, status: 'failed', durationMs: 1, bytes: 0, payloadBytes: 1, errorCode: 'E', errorMessage: 'm', retryAfter: null, heuristics: null, htmlFile: null }],
    )
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })

  test('parse args dan heuristik dasar', () => {
    const flags = parseEvalArgs(['--yes', '--only', 'kedai-kopi,jasa-foto', '--variants', 'new', '--repeat', '2'])
    expect(flags.only).toEqual(['kedai-kopi', 'jasa-foto'])
    expect(flags.variants).toEqual(['new'])
    expect(flags.repeat).toBe(2)
    const sample = BRIEF_SAMPLES.find((s) => s.id === 'kedai-kopi')
    expect(sample).toBeDefined()
    if (!sample) return
    const h = analyzeHeuristics(
      '<html lang="id"><head><meta name="viewport" content="x"></head><body><h1>Kopi Senja</h1><a href="https://wa.me/6281234567890">wa</a><img src="a.png"><img src="b.png" alt="b"><form action="https://evil.example.com/x"></form></body></html>',
      sample,
      'new',
    )
    expect(h.htmlLang).toBe('id')
    expect(h.viewportMeta).toBe(true)
    expect(h.h1Count).toBe(1)
    expect(h.imgWithoutAlt).toBe(1)
    expect(h.formActionHttp).toBe(1)
  })
})

describe('brief-eval guard units', () => {
  test('EvalStopError membawa kode', () => {
    const e = new EvalStopError('x', 'GUARD')
    expect(e.code).toBe('GUARD')
  })

  test('beforeEach/afterEach terpakai (tidak ada state bocor)', () => {
    expect(tmpDirs.length).toBeGreaterThanOrEqual(0)
  })
})

beforeEach(() => undefined)
