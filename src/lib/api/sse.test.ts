import { describe, it, expect, vi } from 'vitest'
import { consumeSseStream, streamProject } from './sse'
import { ApiError } from './client'

function textStream(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(enc.encode(c))
      controller.close()
    },
  })
}

async function collect(source: ReadableStream<Uint8Array>, signal?: AbortSignal) {
  const tokens: string[] = []
  const done = await consumeSseStream(source, { onToken: (t) => tokens.push(t) }, signal)
  return { tokens, done }
}

describe('consumeSseStream', () => {
  it('menggabung event yang terpotong di tengah baris antar chunk', async () => {
    const src = textStream([
      'event: to',
      'ken\ndata: {"tok',
      'en":"<h1>Hi"}',
      '\n\nevent: done\ndata: {"project_id":"p","version_id":"v","version_number":1}\n\n',
    ])
    const { tokens, done } = await collect(src)
    expect(tokens).toEqual(['<h1>Hi'])
    expect(done.version_number).toBe(1)
  })

  it('mendukung CRLF', async () => {
    const src = textStream([
      'event: token\r\ndata: {"token":"a"}\r\n\r\nevent: done\r\ndata: {"project_id":"p","version_id":"v","version_number":3}\r\n\r\n',
    ])
    const { tokens, done } = await collect(src)
    expect(tokens).toEqual(['a'])
    expect(done.version_number).toBe(3)
  })

  it('mengabaikan komentar dan heartbeat ": ping"', async () => {
    const src = textStream([
      ': ping\n\n: komentar bebas\n\nevent: token\ndata: {"token":"x"}\n\n: ping\n\nevent: done\ndata: {"project_id":"p","version_id":"v","version_number":1}\n\n',
    ])
    const { tokens, done } = await collect(src)
    expect(tokens).toEqual(['x'])
    expect(done.version_number).toBe(1)
  })

  it('menggabung beberapa baris data dengan newline', async () => {
    const src = textStream([
      'event: done\ndata: {"project_id":"p",\ndata: "version_id":"v", "version_number": 4}\n\n',
    ])
    const { done } = await collect(src)
    expect(done.version_number).toBe(4)
  })

  it('mempertahankan code dan reason pada event error', async () => {
    const src = textStream([
      'event: token\ndata: {"token":"<p>"}\n\n' +
        'event: error\ndata: {"success":false,"error":{"code":"AI_PROVIDER_ERROR","message":"The AI provider returned an error","reason":"OUTPUT_BLOCKED"}}\n\n',
    ])
    const tokens: string[] = []
    const err = await consumeSseStream(src, { onToken: (t) => tokens.push(t) }).catch((e) => e)
    expect(tokens).toEqual(['<p>'])
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).code).toBe('AI_PROVIDER_ERROR')
    expect((err as ApiError).reason).toBe('OUTPUT_BLOCKED')
  })

  it('stream tanpa event terminal → STREAM_INTERRUPTED', async () => {
    const src = textStream(['event: token\ndata: {"token":"abc"}\n\n'])
    const err = await collect(src).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).reason).toBe('STREAM_INTERRUPTED')
  })

  it('memproses sisa buffer tanpa baris kosong penutup', async () => {
    const src = textStream([
      'event: done\ndata: {"project_id":"p","version_id":"v","version_number":7}',
    ])
    const { done } = await collect(src)
    expect(done.version_number).toBe(7)
  })

  it('abort oleh user meneruskan AbortError (bukan error AI)', async () => {
    const ctrl = new AbortController()
    ctrl.abort()
    const src = textStream(['event: token\ndata: {"token":"x"}\n\n'])
    await expect(collect(src, ctrl.signal)).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('tipe event tak dikenal diabaikan', async () => {
    const src = textStream([
      'event: aneh\ndata: "x"\n\nevent: done\ndata: {"project_id":"p","version_id":"v","version_number":2}\n\n',
    ])
    const { done } = await collect(src)
    expect(done.version_number).toBe(2)
  })

  it('meneruskan event status connecting, retrying, dan fallback', async () => {
    const statuses: Array<{ phase: string; attempt: number; elapsed_ms: number }> = []
    const src = textStream([
      'event: status\ndata: {"phase":"connecting","attempt":1,"elapsed_ms":0}\n\n' +
        'event: status\ndata: {"phase":"retrying","attempt":2,"elapsed_ms":1500}\n\n' +
        'event: status\ndata: {"phase":"fallback","attempt":2,"elapsed_ms":2400}\n\n' +
        'event: token\ndata: {"token":"<p>"}\n\n' +
        'event: done\ndata: {"project_id":"p","version_id":"v","version_number":1}\n\n',
    ])
    const tokens: string[] = []
    await consumeSseStream(src, {
      onToken: (t) => tokens.push(t),
      onStatus: (s) => statuses.push(s),
    })
    expect(statuses).toEqual([
      { phase: 'connecting', attempt: 1, elapsed_ms: 0 },
      { phase: 'retrying', attempt: 2, elapsed_ms: 1500 },
      { phase: 'fallback', attempt: 2, elapsed_ms: 2400 },
    ])
    expect(tokens).toEqual(['<p>'])
  })

  it('mengabaikan event status yang tidak valid tanpa mengganggu token', async () => {
    const statuses: string[] = []
    const src = textStream([
      'event: status\ndata: {"phase":"aneh","attempt":1,"elapsed_ms":0}\n\n' +
        'event: status\ndata: bukan-json\n\n' +
        'event: token\ndata: {"token":"x"}\n\n' +
        'event: done\ndata: {"project_id":"p","version_id":"v","version_number":1}\n\n',
    ])
    const tokens: string[] = []
    await consumeSseStream(src, {
      onToken: (t) => tokens.push(t),
      onStatus: (s) => statuses.push(s.phase),
    })
    expect(statuses).toEqual([])
    expect(tokens).toEqual(['x'])
  })

  it('mempertahankan code AI_BUSY dan pesan dari backend', async () => {
    const src = textStream([
      'event: error\ndata: {"success":false,"error":{"code":"AI_BUSY","message":"Server AI sedang ramai. Coba lagi beberapa saat lagi."}}\n\n',
    ])
    const err = await consumeSseStream(src, { onToken: () => {} }).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(503)
    expect((err as ApiError).code).toBe('AI_BUSY')
    expect((err as ApiError).message).toContain('Server AI sedang ramai')
  })

  it('memakai pesan bawaan Indonesia bila AI_BUSY tidak membawa pesan', async () => {
    const src = textStream([
      'event: error\ndata: {"success":false,"error":{"code":"AI_BUSY"}}\n\n',
    ])
    const err = await consumeSseStream(src, { onToken: () => {} }).catch((e) => e)
    expect((err as ApiError).code).toBe('AI_BUSY')
    expect((err as ApiError).message).toBe('Server AI sedang ramai. Coba lagi sebentar lagi.')
  })
})

describe('streamProject', () => {
  it('respons non-OK sebelum stream dilempar sebagai ApiError (502 + reason)', async () => {
    const fetchFn = vi.fn(async () =>
      Response.json(
        {
          success: false,
          error: {
            code: 'AI_PROVIDER_ERROR',
            message: 'The AI provider is temporarily overloaded, please try again',
            reason: 'PROVIDER_OVERLOADED',
          },
        },
        { status: 502 },
      ),
    )
    const err = await streamProject({
      projectId: 'p1',
      kind: 'generate',
      jsonBody: {},
      onToken: () => {},
      fetchFn: fetchFn as typeof fetch,
    }).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(502)
    expect((err as ApiError).reason).toBe('PROVIDER_OVERLOADED')
  })

  it('tidak mengulang request otomatis setelah event error AI_BUSY', async () => {
    const fetchFn = vi.fn(async () =>
      new Response(
        'event: error\ndata: {"success":false,"error":{"code":"AI_BUSY","message":"Server AI sedang ramai. Coba lagi beberapa saat lagi."}}\n\n',
        { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
      ),
    )
    const err = await streamProject({
      projectId: 'p1',
      kind: 'generate',
      jsonBody: {},
      onToken: () => {},
      fetchFn: fetchFn as unknown as typeof fetch,
    }).catch((e) => e)
    expect((err as ApiError).code).toBe('AI_BUSY')
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('meneruskan event status ke pemanggil', async () => {
    const seen: string[] = []
    const fetchFn = vi.fn(async () =>
      new Response(
        'event: status\ndata: {"phase":"connecting","attempt":1,"elapsed_ms":0}\n\n' +
          'event: status\ndata: {"phase":"retrying","attempt":2,"elapsed_ms":900}\n\n' +
          'event: done\ndata: {"project_id":"p","version_id":"v","version_number":1}\n\n',
        { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
      ),
    )
    await streamProject({
      projectId: 'p1',
      kind: 'generate',
      jsonBody: {},
      onToken: () => {},
      onStatus: (s) => seen.push(s.phase),
      fetchFn: fetchFn as unknown as typeof fetch,
    })
    expect(seen).toEqual(['connecting', 'retrying'])
  })

  it('mengirim JSON {} tanpa gambar dan tanpa Content-Type manual untuk multipart', async () => {
    const seen: Array<{ url: string; init: RequestInit }> = []
    const fetchFn = vi.fn(async (url: string, init: RequestInit) => {
      seen.push({ url, init })
      return new Response(
        'event: done\ndata: {"project_id":"p","version_id":"v","version_number":1}\n\n',
        { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
      )
    })
    await streamProject({
      projectId: 'p1',
      kind: 'generate',
      jsonBody: {},
      onToken: () => {},
      fetchFn: fetchFn as unknown as typeof fetch,
    })
    expect(seen).toHaveLength(1)
    expect(seen[0].url).toContain('/projects/p1/generate')
    expect(seen[0].init.body).toBe('{}')
    expect((seen[0].init.headers as Record<string, string>)['Content-Type']).toBe(
      'application/json',
    )
  })

  it('memakai multipart dengan field images + instruction + base_version untuk revise', async () => {
    const seen: FormData[] = []
    const fetchFn = vi.fn(async (_url: string, init: RequestInit) => {
      seen.push(init.body as FormData)
      return new Response(
        'event: done\ndata: {"project_id":"p","version_id":"v","version_number":2}\n\n',
        { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
      )
    })
    const file = new File(['isi'], 'logo.png', { type: 'image/png' })
    const done = await streamProject({
      projectId: 'p1',
      kind: 'revise',
      jsonBody: { instruction: 'ubah warna', base_version: 1 },
      images: [file],
      baseVersion: 1,
      onToken: () => {},
      fetchFn: fetchFn as unknown as typeof fetch,
    })
    expect(done.version_number).toBe(2)
    const form = seen[0]
    expect(form.get('instruction')).toBe('ubah warna')
    expect(form.get('base_version')).toBe('1')
    expect((form.getAll('images') as File[]).map((f) => f.name)).toEqual(['logo.png'])
  })
})
