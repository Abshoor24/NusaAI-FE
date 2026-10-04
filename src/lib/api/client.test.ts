import { describe, it, expect, vi, afterEach } from 'vitest'
import { api, ApiError, isPublicEndpoint, setUnauthorizedHandler } from './client'
import type { UnauthorizedKind } from './client'

function jsonResponse(body: unknown, status: number, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setUnauthorizedHandler(null)
  })

  it('membuka envelope sukses dan mengembalikan data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ success: true, message: 'ok', data: [{ id: '1' }] }, 200),
      ),
    )
    const res = await api.get<{ success: boolean; message: string; data: Array<{ id: string }> }>(
      '/projects',
    )
    expect(res.data).toEqual([{ id: '1' }])
  })

  it('memetakan VALIDATION_ERROR dengan fields bersarang', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request',
              fields: { 'brief.description': 'must be at least 10 characters' },
            },
          },
          400,
        ),
      ),
    )
    const err = await api.post('/projects', {}).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).code).toBe('VALIDATION_ERROR')
    expect((err as ApiError).fields?.['brief.description']).toContain('10 characters')
  })

  it.each([
    ['Authentication token has expired', 'expired'],
    ['Invalid authentication token', 'invalid'],
    ['Missing authentication token', 'invalid'],
  ] as Array<[string, UnauthorizedKind]>)(
    '401 "%s" → handler dipanggil dengan "%s"',
    async (message, kind) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () =>
          jsonResponse({ success: false, error: { code: 'UNAUTHORIZED', message } }, 401),
        ),
      )
      const seen: UnauthorizedKind[] = []
      setUnauthorizedHandler((k) => seen.push(k))
      await api.get('/projects').catch(() => {})
      expect(seen).toEqual([kind])
    },
  )

  it('401 pada login (skipAuthRedirect) tidak memicu handler global', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } },
          401,
        ),
      ),
    )
    const seen: UnauthorizedKind[] = []
    setUnauthorizedHandler((k) => seen.push(k))
    const err = await api
      .post('/auth/login', { email: 'a@b.c', password: 'x' }, { skipAuthRedirect: true })
      .catch((e) => e)
    expect(seen).toEqual([])
    expect((err as ApiError).message).toBe('Invalid email or password')
  })

  it('409 generate-vs-revise dibedakan via message', async () => {
    for (const message of [
      'A generation is already in progress for this project',
      'Project already has a version, use revise instead',
    ]) {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () =>
          jsonResponse({ success: false, error: { code: 'CONFLICT', message } }, 409),
        ),
      )
      const err = (await api.post('/projects/x/generate', {}).catch((e) => e)) as ApiError
      expect(err.code).toBe('CONFLICT')
      expect(err.message).toBe(message)
    }
  })

  it('429 membaca Retry-After (default 60 bila hilang)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
          429,
          { 'Retry-After': '60' },
        ),
      ),
    )
    const err = (await api.get('/projects').catch((e) => e)) as ApiError
    expect(err.retryAfter).toBe(60)

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('slow', { status: 429 })),
    )
    const err2 = (await api.get('/projects').catch((e) => e)) as ApiError
    expect(err2.retryAfter).toBe(60)
  })

  it('502 mempertahankan reason AI', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          {
            success: false,
            error: { code: 'AI_PROVIDER_ERROR', message: 'boom', reason: 'STREAM_TIMEOUT' },
          },
          502,
        ),
      ),
    )
    const err = (await api.get('/projects').catch((e) => e)) as ApiError
    expect(err.reason).toBe('STREAM_TIMEOUT')
  })

  it('jaringan putus → NETWORK_ERROR berbahasa Indonesia', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )
    const err = (await api.get('/projects').catch((e) => e)) as ApiError
    expect(err.code).toBe('NETWORK_ERROR')
    expect(err.status).toBe(0)
    expect(err.message).toContain('Tidak dapat terhubung')
  })
})

describe('isPublicEndpoint', () => {
  it.each([['/auth/login'], ['/auth/register']])('"%s" adalah publik', (path) => {
    expect(isPublicEndpoint(path)).toBe(true)
  })

  it.each([
    ['/projects/x/auth/login', 'substring di tengah path'],
    ['/auth/login/extra', 'sub-path'],
    ['/auth/log', 'awalan saja'],
    ['/projects', 'endpoint privat'],
    ['/auth/me', 'endpoint auth privat'],
  ])('"%s" (%s) TIDAK publik', (path) => {
    expect(isPublicEndpoint(path)).toBe(false)
  })

  it('query string diabaikan saat pencocokan', () => {
    expect(isPublicEndpoint('/auth/login?next=/projects')).toBe(true)
    expect(isPublicEndpoint('/projects?x=/auth/login')).toBe(false)
  })
})
