/**
 * Mock backend untuk pengembangan UI (DEV SAJA).
 * Aktif bila VITE_USE_MOCK=true. Jangan dipakai di produksi.
 *
 * Skenario generate/revise dipilih via VITE_MOCK_SCENARIO:
 * - "ok" (default): heartbeat + jeda 5 dtk sebelum token pertama + done.
 * - "pre502": HTTP 502 JSON sebelum stream dibuka.
 * - "err-PROVIDER_OVERLOADED" | "err-STREAM_TIMEOUT" | "err-STREAM_STALLED"
 *   | "err-OUTPUT_TRUNCATED" | "err-OUTPUT_BLOCKED" | "err-INVALID_OUTPUT"
 *   | "err-PROVIDER_ERROR": event error di tengah stream (dengan reason).
 * - "no-terminal": stream selesai TANPA event terminal (→ STREAM_INTERRUPTED).
 * - "conflict-generating": 409 "A generation is already in progress...".
 * - "conflict-revise": 409 "Project already has a version, use revise instead".
 * - "ratelimit": 429 + header Retry-After: 60.
 *
 * CATATAN: file ini hanya dimuat via dynamic import saat flag mock aktif,
 * sehingga tidak pernah dipakai pada build produksi normal.
 */

export const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Contoh Mock</title>
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-slate-900">
<main class="max-w-2xl mx-auto p-8">
<h1 class="text-3xl font-bold">Halo dari Mock!</h1>
<p>Ini HTML contoh untuk uji UI tanpa memanggil Gemini.</p>
</main>
</body>
</html>`

const MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'mock@contoh.id',
  created_at: '2026-01-01T00:00:00Z',
}

interface MockVersion {
  id: string
  project_id: string
  version_number: number
  kind: 'generate' | 'revise'
  prompt: string
  html: string
  created_at: string
}

interface MockProject {
  id: string
  title: string
  status: 'draft' | 'generating' | 'ready' | 'failed'
  brief: Record<string, unknown>
  version_count: number
  created_at: string
  updated_at: string
  latest_version: MockVersion | null
  versions: MockVersion[]
}

function seedProjects(): MockProject[] {
  const v1: MockVersion = {
    id: '00000000-0000-0000-0000-000000000101',
    project_id: '00000000-0000-0000-0000-000000000011',
    version_number: 1,
    kind: 'generate',
    prompt: 'Landing page untuk kedai kopi lokal.',
    html: SAMPLE_HTML,
    created_at: '2026-01-02T00:00:00Z',
  }
  return [
    {
      id: '00000000-0000-0000-0000-000000000011',
      title: 'Contoh Kopi Senja (Mock)',
      status: 'ready',
      brief: {
        description: 'Landing page untuk kedai kopi lokal.',
        website_type: 'landing_page',
        business_name: 'Kopi Senja',
        language: 'id',
      },
      version_count: 1,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
      latest_version: v1,
      versions: [v1],
    },
    {
      id: '00000000-0000-0000-0000-000000000022',
      title: 'Draf Portofolio (Mock)',
      status: 'draft',
      brief: { description: 'Portofolio fotografer dengan galeri dan kontak.', language: 'id' },
      version_count: 0,
      created_at: '2026-01-03T00:00:00Z',
      updated_at: '2026-01-03T00:00:00Z',
      latest_version: null,
      versions: [],
    },
  ]
}

let projects: MockProject[] = seedProjects()

export function resetMock(): void {
  projects = seedProjects()
}

function scenario(): string {
  const fromEnv =
    (typeof import.meta !== 'undefined' && import.meta.env.VITE_MOCK_SCENARIO) || ''
  if (typeof window !== 'undefined') {
    const q = new URLSearchParams(window.location.search).get('mock')
    if (q) return q
  }
  return fromEnv || 'ok'
}

function json(body: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

function envelope(data: unknown, message = 'Request successful'): unknown {
  return { success: true, message, data }
}

function errorEnvelope(code: string, message: string, extra?: Record<string, unknown>): unknown {
  return { success: false, error: { code, message, ...extra } }
}

function stripPrefix(pathname: string): string {
  return pathname.startsWith('/api/v1') ? pathname.slice('/api/v1'.length) || '/' : pathname
}

function sseResponse(pieces: string[], delaysMs: number[]): Response {
  let i = 0
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder()
      const push = () => {
        if (i >= pieces.length) {
          controller.close()
          return
        }
        controller.enqueue(enc.encode(pieces[i]))
        const delay = delaysMs[Math.min(i, delaysMs.length - 1)] ?? 0
        i += 1
        setTimeout(push, delay)
      }
      push()
    },
  })
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

/** Bagi string menjadi potongan kecil (simulasi TCP chunking di tengah baris). */
function chop(text: string, size = 17): string[] {
  const out: string[] = []
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size))
  return out
}

function sseSuccess(): Response {
  const tokens = chop(SAMPLE_HTML, 53).map(
    (token) => `event: token\ndata: ${JSON.stringify({ token })}\n\n`,
  )
  const done =
    `event: done\ndata: ${JSON.stringify({ project_id: 'mock', version_id: 'mock-v', version_number: 99 })}\n\n`
  // Heartbeat dulu, jeda 5 dtk sebelum token pertama (seperti provider sibuk).
  return sseResponse([': ping\n\n', ...tokens, done], [5000, 120, 0])
}

function sseMidError(reason: string): Response {
  const head = chop(SAMPLE_HTML.slice(0, 120), 53).map(
    (token) => `event: token\ndata: ${JSON.stringify({ token })}\n\n`,
  )
  const err =
    `event: error\ndata: ${JSON.stringify({ success: false, error: { code: 'AI_PROVIDER_ERROR', message: 'The AI provider returned an error', reason } })}\n\n`
  return sseResponse([': ping\n\n', ...head, err], [5000, 100, 0])
}

export async function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
  const path = stripPrefix(url.pathname)
  const method = (init?.method ?? 'GET').toUpperCase()
  const sc = scenario()

  // ── Auth ──
  if (method === 'POST' && (path === '/auth/register' || path === '/auth/login')) {
    let body: { email?: string; password?: string } = {}
    try {
      body = JSON.parse(String(init?.body ?? '{}')) as typeof body
    } catch {
      return json(errorEnvelope('BAD_REQUEST', 'Request body is not valid JSON'), 400)
    }
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return json(
        errorEnvelope('VALIDATION_ERROR', 'Invalid request', {
          fields: { email: 'must be a valid email address' },
        }),
        400,
      )
    }
    if (path === '/auth/register' && (!body.password || body.password.length < 8)) {
      return json(
        errorEnvelope('VALIDATION_ERROR', 'Invalid request', {
          fields: { password: 'must be at least 8 characters' },
        }),
        400,
      )
    }
    if (path === '/auth/login' && body.email === 'salah@contoh.id') {
      return json(errorEnvelope('UNAUTHORIZED', 'Invalid email or password'), 401)
    }
    if (path === '/auth/register' && body.email === 'ada@contoh.id') {
      return json(errorEnvelope('CONFLICT', 'An account with this email already exists'), 409)
    }
    return json(
      envelope(
        {
          token: 'mock.jwt.token',
          token_type: 'Bearer',
          expires_in: 86400,
          user: { ...MOCK_USER, email: body.email.toLowerCase() },
        },
        path === '/auth/register' ? 'User registered successfully' : 'Login successful',
      ),
      path === '/auth/register' ? 201 : 200,
    )
  }
  if (method === 'GET' && path === '/auth/me') {
    return json(envelope(MOCK_USER))
  }

  // ── Projects ──
  if (method === 'GET' && path === '/projects') {
    const items = projects.map(({ versions: _v, latest_version: _l, ...rest }) => rest)
    return json(envelope(items))
  }
  if (method === 'POST' && path === '/projects') {
    let body: { title?: string; brief?: { description?: string } } = {}
    try {
      body = JSON.parse(String(init?.body ?? '{}')) as typeof body
    } catch {
      return json(errorEnvelope('BAD_REQUEST', 'Request body is not valid JSON'), 400)
    }
    const desc = (body.brief?.description ?? '').trim()
    if (desc.length < 10) {
      return json(
        errorEnvelope('VALIDATION_ERROR', 'Invalid request', {
          fields: { 'brief.description': 'must be at least 10 characters' },
        }),
        400,
      )
    }
    const id = `mock-${Date.now()}`
    const project: MockProject = {
      id,
      title: (body.title ?? '').trim() || desc.slice(0, 60),
      status: 'draft',
      brief: (body.brief ?? {}) as Record<string, unknown>,
      version_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      latest_version: null,
      versions: [],
    }
    projects.unshift(project)
    const { versions: _v, latest_version: _l, ...rest } = project
    return json(envelope(rest, 'Project created'), 201)
  }

  const projectMatch = /^\/projects\/([^/]+)(\/.*)?$/.exec(path)
  if (projectMatch) {
    const id = projectMatch[1]
    const rest = projectMatch[2] ?? ''
    const project = projects.find((p) => p.id === id)
    if (!project) return json(errorEnvelope('NOT_FOUND', 'Project not found'), 404)

    if (method === 'GET' && rest === '') return json(envelope(project))
    if (method === 'PATCH' && rest === '') {
      project.title = `Judul Mock ${Date.now() % 1000}`
      project.updated_at = new Date().toISOString()
      const { versions: _v, latest_version: _l, ...summary } = project
      return json(envelope(summary, 'Project renamed'))
    }
    if (method === 'DELETE' && rest === '') {
      projects = projects.filter((p) => p.id !== id)
      return json({ success: true, message: 'Project deleted', data: null })
    }
    if (method === 'GET' && rest === '/versions') {
      const items = [...project.versions]
        .sort((a, b) => b.version_number - a.version_number)
        .map(({ html: _h, ...v }) => v)
      return json(envelope(items))
    }
    const versionMatch = /^\/versions\/(\d+)$/.exec(rest)
    if (method === 'GET' && versionMatch) {
      const v = project.versions.find((x) => x.version_number === Number(versionMatch[1]))
      if (!v) return json(errorEnvelope('NOT_FOUND', 'Version not found'), 404)
      return json(envelope(v))
    }
    if (method === 'GET' && rest.startsWith('/export')) {
      return new Response(SAMPLE_HTML, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': 'attachment; filename="website-mock-v1.html"',
        },
      })
    }
    if (method === 'GET' && rest === '/attachments') return json(envelope([]))

    // ── Generate / revise SSE ──
    const streamMatch = /^\/(generate|revise)$/.exec(rest)
    if (method === 'POST' && streamMatch) {
      if (sc === 'pre502') {
        return json(errorEnvelope('AI_PROVIDER_ERROR', 'The AI provider returned an error'), 502)
      }
      if (sc === 'ratelimit') {
        return json(errorEnvelope('RATE_LIMITED', 'Too many requests, please try again later'), 429, {
          'Retry-After': '60',
        })
      }
      if (sc === 'conflict-generating') {
        return json(
          errorEnvelope('CONFLICT', 'A generation is already in progress for this project'),
          409,
        )
      }
      if (sc === 'conflict-revise') {
        return json(
          errorEnvelope('CONFLICT', 'Project already has a version, use revise instead'),
          409,
        )
      }
      if (sc === 'no-terminal') {
        return sseResponse([': ping\n\n', 'event: token\ndata: {"token":"<p>terpotong"}\n\n'], [5000])
      }
      if (sc.startsWith('err-')) {
        return sseMidError(sc.slice('err-'.length))
      }
      return sseSuccess()
    }
  }

  return json(errorEnvelope('NOT_FOUND', 'Resource not found'), 404)
}
