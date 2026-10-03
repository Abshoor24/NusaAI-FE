import { ApiError, apiUrl } from './client'
import { getToken } from './token'
import type { SseDoneEvent } from '@/types/api'

// ── Konstanta ───────────────────────────────────────────────────────────────
// Endpoint SSE memakai fetch + ReadableStream, BUKAN EventSource
// (endpoint POST dan butuh header Authorization — api.md §9.2).

export type SseKind = 'generate' | 'revise'

export interface StreamCallbacks {
  onToken: (token: string) => void
}

// ── Parser SSE murni (bisa diuji tanpa jaringan) ────────────────────────────

type ChunkSource = ReadableStream<Uint8Array> | AsyncIterable<string | Uint8Array>

async function* iterateChunks(source: ChunkSource): AsyncGenerator<string> {
  const decoder = new TextDecoder()
  if (Symbol.asyncIterator in Object(source)) {
    for await (const chunk of source as AsyncIterable<string | Uint8Array>) {
      yield typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true })
    }
    yield decoder.decode()
    return
  }
  const reader = (source as ReadableStream<Uint8Array>).getReader()
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      yield decoder.decode(value, { stream: true })
    }
    yield decoder.decode()
  } finally {
    reader.releaseLock()
  }
}

interface ParsedEvent {
  type: string
  dataLines: string[]
}

/** Pecah satu blok event menjadi tipe + baris-baris data. */
function parseBlock(block: string): ParsedEvent | null {
  const lines = block.split(/\r?\n/)
  let type = ''
  const dataLines: string[] = []
  let hasField = false

  for (const line of lines) {
    if (line === '') continue
    // Baris komentar (termasuk heartbeat ": ping") → abaikan.
    if (line.startsWith(':')) {
      hasField = true
      continue
    }
    if (line.startsWith('event:')) {
      type = line.slice('event:'.length).trim()
      hasField = true
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).replace(/^ /, ''))
      hasField = true
    } else if (line.startsWith('data')) {
      // "data" tanpa titik dua → data baris kosong (sesuai spec SSE).
      dataLines.push('')
      hasField = true
    }
    // Baris lain (mis. "id:", "retry:") diabaikan.
  }

  if (!hasField) return null
  // Blok yang hanya berisi komentar → bukan event.
  if (!type && dataLines.length === 0) return null
  return { type, dataLines }
}

function throwSseError(raw: string): never {
  let message = 'Layanan AI mengalami gangguan, coba lagi.'
  let reason: string | undefined
  try {
    const parsed = JSON.parse(raw) as {
      success?: boolean
      error?: { code?: string; message?: string; reason?: string }
    }
    if (parsed.error) {
      message = parsed.error.message || message
      reason = parsed.error.reason
    }
  } catch {
    // Payload bukan JSON → pakai pesan generik.
  }
  throw new ApiError(502, message, 'AI_PROVIDER_ERROR', { reason })
}

/**
 * Konsumsi stream SSE body.
 * - Akumulasi buffer lintas chunk, event dipisah baris kosong (\n\n / \r\n\r\n).
 * - Komentar/heartbeat diabaikan.
 * - Beberapa baris `data:` digabung dengan "\n".
 * - Sisa buffer di akhir diproses.
 * - Tanpa event terminal → ApiError STREAM_INTERRUPTED.
 * - Abort (signal) → DOMException AbortError diteruskan apa adanya
 *   (BUKAN kegagalan AI; pemanggil tidak menampilkannya sebagai error AI).
 */
export async function consumeSseStream(
  source: ChunkSource,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<SseDoneEvent> {
  let buffer = ''

  const handleEvent = (evt: ParsedEvent): SseDoneEvent | null => {
    if (evt.type === 'token') {
      const payload = evt.dataLines.join('\n')
      if (payload === '') return null
      try {
        const parsed = JSON.parse(payload) as { token?: string }
        if (typeof parsed.token === 'string' && parsed.token !== '') {
          callbacks.onToken(parsed.token)
        }
      } catch {
        // Token bukan JSON valid → abaikan potongan ini.
      }
      return null
    }
    if (evt.type === 'done') {
      const raw = evt.dataLines.join('\n')
      const parsed = JSON.parse(raw) as SseDoneEvent
      return parsed
    }
    if (evt.type === 'error') {
      throwSseError(evt.dataLines.join('\n'))
    }
    // Tipe event tak dikenal → abaikan.
    return null
  }

  const processBuffer = (flush: boolean): SseDoneEvent | null => {
    for (;;) {
      const sepMatch = /\r?\n\r?\n/.exec(buffer)
      if (!sepMatch || sepMatch.index === undefined) break
      const block = buffer.slice(0, sepMatch.index)
      buffer = buffer.slice(sepMatch.index + sepMatch[0].length)
      const evt = parseBlock(block)
      if (!evt) continue
      const done = handleEvent(evt)
      if (done) return done
    }
    if (flush && buffer.trim() !== '') {
      const evt = parseBlock(buffer)
      buffer = ''
      if (evt) {
        const done = handleEvent(evt)
        if (done) return done
      }
    }
    return null
  }

  for await (const text of iterateChunks(source)) {
    signal?.throwIfAborted()
    buffer += text
    const done = processBuffer(false)
    if (done) return done
  }

  const tail = processBuffer(true)
  if (tail) return tail

  throw new ApiError(
    502,
    'Koneksi AI terputus sebelum selesai.',
    'AI_PROVIDER_ERROR',
    { reason: 'STREAM_INTERRUPTED' },
  )
}

// ── Stream generate / revise ────────────────────────────────────────────────

export interface StreamRequest {
  projectId: string
  kind: SseKind
  /** Body JSON; diabaikan bila `images` (File[]) diberikan. */
  jsonBody?: Record<string, unknown>
  /** File gambar → dikirim sebagai multipart field `images`. */
  images?: File[]
  /** Khusus revise: base_version sebagai string angka (multipart). */
  baseVersion?: number
  signal?: AbortSignal
  onToken: (token: string) => void
  fetchFn?: typeof fetch
}

function buildBody(req: StreamRequest): BodyInit {
  if (req.images && req.images.length > 0) {
    // Multipart: JANGAN set Content-Type manual (browser isi boundary).
    const form = new FormData()
    if (req.kind === 'revise') {
      const body = req.jsonBody ?? {}
      if (typeof body.instruction === 'string') {
        form.append('instruction', body.instruction)
      }
      const base = req.baseVersion ?? (body.base_version as number | undefined)
      if (base !== undefined) form.append('base_version', String(base))
    }
    for (const file of req.images) {
      form.append('images', file, file.name)
    }
    return form
  }
  // Tanpa gambar → selalu JSON (generate: {} / revise: {instruction,...}).
  return JSON.stringify(req.jsonBody ?? {})
}

/**
 * POST /projects/{id}/generate|revise dengan SSE.
 * - Kegagalan SEBELUM stream (non-OK JSON envelope) dilempar sebagai ApiError
 *   dengan bentuk sama seperti error di dalam stream.
 * - Mengembalikan SseDoneEvent saat event `done` tiba.
 */
export async function streamProject(req: StreamRequest): Promise<SseDoneEvent> {
  const fetchFn = req.fetchFn ?? fetch
  const token = getToken()
  const url = apiUrl(`/projects/${req.projectId}/${req.kind}`)
  const body = buildBody(req)
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData

  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!isForm) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetchFn(url, {
      method: 'POST',
      headers,
      body,
      signal: req.signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError(
      0,
      'Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.',
      'NETWORK_ERROR',
    )
  }

  if (!response.ok || !response.body) {
    let message = response.statusText || `HTTP ${response.status}`
    let code = 'INTERNAL_SERVER_ERROR'
    let reason: string | undefined
    let retryAfter: number | undefined
    let fields: Record<string, string> | undefined
    try {
      const errJson = (await response.json()) as {
        success: boolean
        error?: { code?: string; message?: string; fields?: Record<string, string>; reason?: string }
      }
      if (errJson.error) {
        message = errJson.error.message || message
        code = errJson.error.code || code
        fields = errJson.error.fields
        reason = errJson.error.reason
      }
    } catch {
      // Body bukan JSON.
    }
    if (response.status === 429) {
      const parsed = parseInt(response.headers.get('Retry-After') ?? '', 10)
      retryAfter = Number.isNaN(parsed) ? 60 : parsed
      if (code === 'INTERNAL_SERVER_ERROR') code = 'RATE_LIMITED'
    }
    throw new ApiError(response.status, message, code as 'AI_PROVIDER_ERROR', {
      reason,
      retryAfter,
      fields,
    })
  }

  return consumeSseStream(response.body, { onToken: req.onToken }, req.signal)
}
