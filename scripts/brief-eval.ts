/**
 * Skrip EVALUASI user-run dengan AI sungguhan (BUKAN bagian suite CI).
 *
 * Perbandingan "brief lama" (legacy, input novice tanpa panduan) vs
 * "brief baru" (new, payload dari buildProjectPayload). Lihat
 * docs/BRIEF-EVAL.md untuk cara baca hasil.
 *
 * PENTING:
 * - JANGAN dijalankan oleh agen AI. Hanya pemilik yang menjalankan manual
 *   dengan backend menyala dan kuota AI tersedia.
 * - Guard: wajib RUN_REAL_AI=1 DAN --yes. Tanpa keduanya, skrip menolak.
 * - Tidak pernah me-log token, password, nomor telepon, atau alamat.
 *   Log hanya id sampel, status, durasi, dan ukuran.
 * - Memakai ulang modul yang ada tanpa mengubahnya: buildProjectPayload
 *   (payload new), normalizePhoneNumber (digit WhatsApp), consumeSseStream
 *   (parse SSE generate). Transport fetch ditulis di sini seperti
 *   scripts/brief-contract-check.ts (runner yang sama: npx tsx).
 *
 * Definisi varian (didokumentasikan, dengan batasannya):
 * - "legacy" = apa yang dikirim novice tanpa bantuan: kalimat deskripsi
 *   milik sampel, nama brand, website_type, dan language SAJA. Tanpa warna,
 *   style, sections, goal, audience, atau baris kontak. Ini memodelkan
 *   input novice, BUKAN kode pemetaan.
 * - "new" = buildProjectPayload(draft) apa adanya (deskripsi terstruktur
 *   + warna + style + sections + kontak). Ini mengukur efek panduan form,
 *   BUKAN menguji kode pemetaan itu sendiri (pemetaan sudah diuji unit).
 *
 * Cara pakai (PowerShell):
 *   $env:RUN_REAL_AI="1"
 *   npm run eval:brief -- --yes --only kedai-kopi
 *
 * Lihat docs/BRIEF-EVAL.md untuk daftar flag lengkap dan estimasi kuota.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { BRIEF_SAMPLES } from '../fixtures/brief-samples.ts'
import type { BriefSample } from '../fixtures/brief-samples.ts'
import { buildProjectPayload } from '../src/lib/brief/build-payload.ts'
import { normalizePhoneNumber } from '../src/lib/brief/contact.ts'
import { consumeSseStream } from '../src/lib/api/sse.ts'
import { ApiError } from '../src/lib/api/client.ts'
import type { CreateProjectRequest } from '../src/types/api.ts'

// ── Tipe ────────────────────────────────────────────────────────────────────

export type EvalVariant = 'legacy' | 'new'

export interface EvalFlags {
  only: string[] | null
  variants: EvalVariant[]
  repeat: number
  pauseMs: number
  timeoutMs: number
  keep: boolean
  dryRun: boolean
  baseUrl: string
  max: number | null
  yes: boolean
}

export interface EvalDeps {
  fetchFn: typeof fetch
  outDir: string
  sleep: (ms: number) => Promise<void>
  now: () => Date
  generatePassword: () => string
}

export type RunStatus = 'ok' | 'failed' | 'dry-run'

export interface HeuristicResult {
  htmlLang: string | null
  viewportMeta: boolean
  brandPresent: boolean
  waMeOk: boolean | null
  waMeFound: string | null
  phonePresent: boolean | null
  emailPresent: boolean | null
  addressPresent: boolean | null
  hoursPresent: boolean | null
  primaryHexFound: boolean | null
  accentHexFound: boolean | null
  sectionsCovered: number
  sectionsTotal: number
  sectionsMissing: string[]
  hasLorem: boolean
  hasPlaceholder: boolean
  h1Count: number
  imgWithoutAlt: number
  imgTotal: number
  externalScripts: number
  externalImages: number
  formActionHttp: number
  totalBytes: number
}

export interface EvalRunRecord {
  sampleId: string
  variant: EvalVariant
  repeatIndex: number
  status: RunStatus
  durationMs: number
  bytes: number
  payloadBytes: number
  errorCode: string | null
  errorMessage: string | null
  retryAfter: number | null
  heuristics: HeuristicResult | null
  htmlFile: string | null
}

export class EvalStopError extends Error {
  readonly code: string
  readonly retryAfter: number | null
  constructor(message: string, code: string, retryAfter: number | null = null) {
    super(message)
    this.name = 'EvalStopError'
    this.code = code
    this.retryAfter = retryAfter
  }
}

// ── Util ────────────────────────────────────────────────────────────────────

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatStamp(d: Date): string {
  const y = d.getFullYear()
  const m = pad2(d.getMonth() + 1)
  const day = pad2(d.getDate())
  const h = pad2(d.getHours())
  const min = pad2(d.getMinutes())
  const s = pad2(d.getSeconds())
  return `${y}${m}${day}-${h}${min}${s}`
}

function formatProbeDate(d: Date): { yyyymmdd: string; hhmm: string } {
  const y = d.getFullYear()
  const m = pad2(d.getMonth() + 1)
  const day = pad2(d.getDate())
  return { yyyymmdd: `${y}${m}${day}`, hhmm: `${pad2(d.getHours())}${pad2(d.getMinutes())}` }
}

export function defaultGeneratePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%^&*-_=+'
  const all = upper + lower + digits + symbols
  const buf = randomBytes(20)
  const chars: string[] = []
  for (let i = 0; i < 20; i++) {
    const b = buf[i] ?? 0
    chars.push(all[b % all.length] ?? 'A')
  }
  // Pastikan ada satu dari tiap kelas (posisi tetap, tidak mengurangi acak).
  const extra = randomBytes(4)
  chars[0] = upper[(extra[0] ?? 0) % upper.length] ?? 'A'
  chars[1] = lower[(extra[1] ?? 0) % lower.length] ?? 'a'
  chars[2] = digits[(extra[2] ?? 0) % digits.length] ?? '2'
  chars[3] = symbols[(extra[3] ?? 0) % symbols.length] ?? '!'
  return chars.join('')
}

export function resolveBaseUrl(override: string | null): string {
  const raw =
    override ??
    process.env.VITE_API_BASE_URL ??
    process.env.VITE_API_URL ??
    'http://127.0.0.1:8080'
  const trimmed = raw.replace(/\/+$/, '')
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`
}

// ── Argumen ─────────────────────────────────────────────────────────────────

export function parseEvalArgs(argv: string[]): EvalFlags {
  let only: string[] | null = null
  let variants: EvalVariant[] = ['legacy', 'new']
  let variantsSet = false
  let repeat = 1
  let pauseMs = 5000
  let timeoutMs = 120000
  let keep = false
  let dryRun = false
  let baseUrlOverride: string | null = null
  let max: number | null = null
  let yes = false

  const pushOnly = (v: string): void => {
    const ids = v
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    if (ids.length === 0) return
    only = [...(only ?? []), ...ids]
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? ''
    if (a === '--only') {
      const v = argv[i + 1] ?? ''
      i++
      pushOnly(v)
    } else if (a.startsWith('--only=')) {
      pushOnly(a.slice('--only='.length))
    } else if (a === '--variants') {
      const v = argv[i + 1] ?? ''
      i++
      variants = parseVariants(v)
      variantsSet = true
    } else if (a.startsWith('--variants=')) {
      variants = parseVariants(a.slice('--variants='.length))
      variantsSet = true
    } else if (a === '--repeat') {
      repeat = parseInt(argv[i + 1] ?? '', 10)
      i++
    } else if (a.startsWith('--repeat=')) {
      repeat = parseInt(a.slice('--repeat='.length), 10)
    } else if (a === '--pause-ms') {
      pauseMs = parseInt(argv[i + 1] ?? '', 10)
      i++
    } else if (a.startsWith('--pause-ms=')) {
      pauseMs = parseInt(a.slice('--pause-ms='.length), 10)
    } else if (a === '--timeout-ms') {
      timeoutMs = parseInt(argv[i + 1] ?? '', 10)
      i++
    } else if (a.startsWith('--timeout-ms=')) {
      timeoutMs = parseInt(a.slice('--timeout-ms='.length), 10)
    } else if (a === '--keep') {
      keep = true
    } else if (a === '--dry-run') {
      dryRun = true
    } else if (a === '--yes') {
      yes = true
    } else if (a === '--base-url') {
      baseUrlOverride = argv[i + 1] ?? ''
      i++
    } else if (a.startsWith('--base-url=')) {
      baseUrlOverride = a.slice('--base-url='.length)
    } else if (a === '--max') {
      max = parseInt(argv[i + 1] ?? '', 10)
      i++
    } else if (a.startsWith('--max=')) {
      max = parseInt(a.slice('--max='.length), 10)
    } else if (a === '--help' || a === '-h') {
      printHelp()
      throw new EvalStopError('help', 'HELP')
    } else {
      throw new EvalStopError(`Flag tidak dikenal: ${a}. Pakai --help.`, 'BAD_ARGS')
    }
  }

  if (!Number.isFinite(repeat) || repeat < 1) throw new EvalStopError('--repeat harus >= 1.', 'BAD_ARGS')
  if (!Number.isFinite(pauseMs) || pauseMs < 0) throw new EvalStopError('--pause-ms harus >= 0.', 'BAD_ARGS')
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
    throw new EvalStopError('--timeout-ms harus > 0.', 'BAD_ARGS')
  if (max !== null && (!Number.isFinite(max) || max < 1))
    throw new EvalStopError('--max harus >= 1.', 'BAD_ARGS')
  if (!variantsSet) {
    variants = ['legacy', 'new']
  }
  if (variants.length === 0) throw new EvalStopError('--variants tidak boleh kosong.', 'BAD_ARGS')

  return {
    only,
    variants,
    repeat,
    pauseMs,
    timeoutMs,
    keep,
    dryRun,
    baseUrl: resolveBaseUrl(baseUrlOverride),
    max,
    yes,
  }
}

function parseVariants(v: string): EvalVariant[] {
  const parts = v
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0)
  const out: EvalVariant[] = []
  for (const p of parts) {
    if (p !== 'legacy' && p !== 'new') throw new EvalStopError(`Varian tidak dikenal: ${p}.`, 'BAD_ARGS')
    if (!out.includes(p)) out.push(p)
  }
  return out
}

function printHelp(): void {
  console.log('Pakai: npm run eval:brief -- --yes [flag]')
  console.log('Wajib: RUN_REAL_AI=1 dan --yes.')
  console.log('Flag: --only <id[,id]> --variants legacy,new --repeat N --pause-ms N')
  console.log('  --timeout-ms N --keep --dry-run --base-url <url> --max N')
}

// ── Guard ───────────────────────────────────────────────────────────────────

export function checkGuards(flags: EvalFlags, env: NodeJS.ProcessEnv): void {
  if (env.RUN_REAL_AI !== '1' || !flags.yes) {
    throw new EvalStopError(
      'DITOLAK: butuh RUN_REAL_AI=1 DAN --yes. Contoh PowerShell: $env:RUN_REAL_AI="1"; npm run eval:brief -- --yes --only kedai-kopi',
      'GUARD',
    )
  }
}

export function selectedSamples(flags: EvalFlags): BriefSample[] {
  if (!flags.only) return [...BRIEF_SAMPLES]
  const ids = new Set(flags.only)
  const out = BRIEF_SAMPLES.filter((s) => ids.has(s.id))
  const unknown = [...ids].filter((id) => !BRIEF_SAMPLES.some((s) => s.id === id))
  if (unknown.length > 0) throw new EvalStopError(`Id sampel tidak dikenal: ${unknown.join(', ')}`, 'BAD_ARGS')
  return out
}

export function countGenerations(samples: number, flags: EvalFlags): number {
  return samples * flags.variants.length * flags.repeat
}

// ── Payload ─────────────────────────────────────────────────────────────────

export function buildLegacyPayload(sample: BriefSample): CreateProjectRequest {
  const d = sample.draft
  const brief: CreateProjectRequest['brief'] = {
    description: d.description,
  }
  const brand = d.brandName.trim()
  if (brand) brief.business_name = brand.slice(0, 120)
  if (d.websiteType) brief.website_type = d.websiteType
  if (d.language === 'id' || d.language === 'en') brief.language = d.language
  const payload: CreateProjectRequest = { brief }
  const title = d.title.trim()
  if (title) payload.title = title.slice(0, 200)
  return payload
}

export function buildVariantPayload(
  sample: BriefSample,
  variant: EvalVariant,
): { payload: CreateProjectRequest; note: string } {
  if (variant === 'legacy') {
    return { payload: buildLegacyPayload(sample), note: 'legacy: deskripsi+brand+type+lang saja' }
  }
  const built = buildProjectPayload(sample.draft)
  return { payload: built.payload, note: 'new: buildProjectPayload(draft)' }
}

/** Digit WhatsApp ternormalisasi tanpa plus (untuk cek wa.me). */
export function waDigits(sample: BriefSample): string | null {
  const raw = sample.draft.contact.whatsapp.trim()
  if (!raw) return null
  const normalized = normalizePhoneNumber(raw)
  if (!normalized) return null
  return normalized.replace(/^\+/, '')
}

// ── Heuristik ───────────────────────────────────────────────────────────────

export function analyzeHeuristics(
  html: string,
  sample: BriefSample,
  _variant: EvalVariant,
): HeuristicResult {
  const langMatch = /<html[^>]*\slang\s*=\s*["']([^"']+)["']/i.exec(html)
  const htmlLang = langMatch?.[1] ?? null
  const viewportMeta = /<meta[^>]*name\s*=\s*["']viewport["'][^>]*>/i.test(html)
  const brand = sample.draft.brandName
  const brandPresent = brand ? html.includes(brand) : false

  const digits = waDigits(sample)
  let waMeOk: boolean | null = null
  let waMeFound: string | null = null
  if (digits) {
    const m = /https?:\/\/wa\.me\/(\d+)/i.exec(html)
    waMeFound = m?.[0] ?? null
    waMeOk = html.includes(`wa.me/${digits}`)
  }

  const c = sample.draft.contact
  const phoneDigits = c.phone.trim() ? normalizePhoneNumber(c.phone)?.replace(/^\+/, '') ?? null : null
  const phonePresent = phoneDigits ? html.includes(phoneDigits) : null
  const emailPresent = c.email.trim() ? html.includes(c.email.trim()) : null
  const addressPresent = c.address.trim() ? html.includes(c.address.trim()) : null
  const hoursPresent = c.openingHours.trim() ? html.includes(c.openingHours.trim()) : null

  const primary = sample.draft.primaryColor.trim()
  const accent = sample.draft.accentColor.trim()
  const lower = html.toLowerCase()
  const primaryHexFound = primary ? lower.includes(primary.toLowerCase()) : null
  const accentHexFound = accent ? lower.includes(accent.toLowerCase()) : null

  const sections = sample.draft.sections
  const missing: string[] = []
  for (const s of sections) {
    const needle = s.toLowerCase()
    // Cari sebagai id HTML atau teks heading. Sederhana dan objektif.
    const asId = lower.includes(`id="${needle}"`) || lower.includes(`id='${needle}'`)
    const asText = lower.includes(needle)
    if (!asId && !asText) missing.push(s)
  }

  const hasLorem = /lorem ipsum/i.test(html)
  const hasPlaceholder = /\[placeholder\]/i.test(html)
  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length
  const imgTags = html.match(/<img\b[^>]*>/gi) ?? []
  let imgWithoutAlt = 0
  for (const t of imgTags) {
    if (!/\balt\s*=/i.test(t)) imgWithoutAlt++
  }
  const externalScripts = (html.match(/<script\b[^>]*\bsrc\s*=\s*["']https?:[^"']*["']/gi) ?? []).length
  const externalImages = (html.match(/<img\b[^>]*\bsrc\s*=\s*["']https?:[^"']*["']/gi) ?? []).length
  const formActionHttp = (html.match(/<form\b[^>]*\baction\s*=\s*["']https?:[^"']*["']/gi) ?? []).length

  return {
    htmlLang,
    viewportMeta,
    brandPresent,
    waMeOk,
    waMeFound,
    phonePresent,
    emailPresent,
    addressPresent,
    hoursPresent,
    primaryHexFound,
    accentHexFound,
    sectionsCovered: sections.length - missing.length,
    sectionsTotal: sections.length,
    sectionsMissing: missing,
    hasLorem,
    hasPlaceholder,
    h1Count,
    imgWithoutAlt,
    imgTotal: imgTags.length,
    externalScripts,
    externalImages,
    formActionHttp,
    totalBytes: Buffer.byteLength(html, 'utf8'),
  }
}

// ── HTTP (fetch langsung, bentuk envelope sama seperti backend) ──────────────

interface Envelope<T> {
  success: boolean
  message: string
  data: T
}

interface ErrorBody {
  success: false
  error: { code: string; message: string; reason?: string; fields?: Record<string, string> }
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function retryAfterOf(res: Response): number | null {
  const h = res.headers.get('Retry-After')
  if (!h) return null
  const n = parseInt(h, 10)
  return Number.isNaN(n) ? null : n
}

async function postJson(
  fetchFn: typeof fetch,
  baseUrl: string,
  path: string,
  body: unknown,
  token: string | null,
  signal?: AbortSignal,
): Promise<{ status: number; json: unknown; retryAfter: number | null }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetchFn(`${baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  })
  return { status: res.status, json: await readJson(res), retryAfter: retryAfterOf(res) }
}

async function getJson(
  fetchFn: typeof fetch,
  baseUrl: string,
  path: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<{ status: number; json: unknown; retryAfter: number | null; headers: Headers }> {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetchFn(`${baseUrl}${path}`, { method: 'GET', headers, signal })
  return { status: res.status, json: await readJson(res), retryAfter: retryAfterOf(res), headers: res.headers }
}

async function deleteProject(
  fetchFn: typeof fetch,
  baseUrl: string,
  id: string,
  token: string | null,
): Promise<void> {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  try {
    await fetchFn(`${baseUrl}/projects/${id}`, { method: 'DELETE', headers })
  } catch {
    // DELETE best-effort; jangan menutupi hasil utama.
  }
}

function throwIfRateLimited(status: number, json: unknown, retryAfter: number | null): void {
  const code = (json as ErrorBody | null)?.error?.code
  if (status === 429 || code === 'RATE_LIMITED') {
    throw new EvalStopError(
      `STOP 429${retryAfter !== null ? ` (Retry-After: ${retryAfter})` : ''}. Tulis laporan parsial, keluar non-nol, tanpa retry.`,
      'RATE_LIMITED',
      retryAfter,
    )
  }
}

function errorCodeOf(json: unknown, status: number): string {
  const code = (json as ErrorBody | null)?.error?.code
  if (typeof code === 'string' && code) return code
  return `HTTP_${status}`
}

// ── Satu item ───────────────────────────────────────────────────────────────

async function runOne(
  sample: BriefSample,
  variant: EvalVariant,
  repeatIndex: number,
  payload: CreateProjectRequest,
  flags: EvalFlags,
  token: string,
  deps: EvalDeps,
  sampleDir: string,
  fileBase: string,
): Promise<EvalRunRecord> {
  const started = Date.now()
  const baseUrl = flags.baseUrl
  const fetchFn = deps.fetchFn
  let projectId: string | null = null
  try {
    // POST /projects
    const created = await postJson(fetchFn, baseUrl, '/projects', payload, token)
    throwIfRateLimited(created.status, created.json, created.retryAfter)
    if (created.status !== 201) {
      const code = errorCodeOf(created.json, created.status)
      if (code === 'AI_PROVIDER_ERROR') {
        throw new ApiError(created.status, 'AI provider error', code)
      }
      return {
        sampleId: sample.id,
        variant,
        repeatIndex,
        status: 'failed',
        durationMs: Date.now() - started,
        bytes: 0,
        payloadBytes: Buffer.byteLength(JSON.stringify(payload), 'utf8'),
        errorCode: code,
        errorMessage: `POST /projects HTTP ${created.status}`,
        retryAfter: created.retryAfter,
        heuristics: null,
        htmlFile: null,
      }
    }
    projectId = (created.json as Envelope<{ id: string }>).data.id

    // POST /projects/{id}/generate (SSE) dengan timeout.
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), flags.timeoutMs)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetchFn(`${baseUrl}/projects/${projectId}/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
        signal: ctrl.signal,
      })
      const retryAfter = retryAfterOf(res)
      if (res.status === 429) {
        const j = await readJson(res)
        throwIfRateLimited(res.status, j, retryAfter)
      }
      if (!res.ok || !res.body) {
        const j = await readJson(res)
        const code = errorCodeOf(j, res.status)
        if (code === 'AI_PROVIDER_ERROR' || code === 'RATE_LIMITED') {
          if (code === 'RATE_LIMITED') throwIfRateLimited(res.status, j, retryAfter)
          throw new ApiError(res.status, 'AI provider error', code)
        }
        return {
          sampleId: sample.id,
          variant,
          repeatIndex,
          status: 'failed',
          durationMs: Date.now() - started,
          bytes: 0,
          payloadBytes: Buffer.byteLength(JSON.stringify(payload), 'utf8'),
          errorCode: code,
          errorMessage: `POST generate HTTP ${res.status}`,
          retryAfter,
          heuristics: null,
          htmlFile: null,
        }
      }
      try {
        await consumeSseStream(res.body as ReadableStream<Uint8Array>, { onToken: () => undefined }, ctrl.signal)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return {
            sampleId: sample.id,
            variant,
            repeatIndex,
            status: 'failed',
            durationMs: Date.now() - started,
            bytes: 0,
            payloadBytes: Buffer.byteLength(JSON.stringify(payload), 'utf8'),
            errorCode: 'TIMEOUT',
            errorMessage: `Generate timeout ${flags.timeoutMs} ms`,
            retryAfter: null,
            heuristics: null,
            htmlFile: null,
          }
        }
        throw err
      }
    } finally {
      clearTimeout(timer)
    }

    // GET /projects/{id}/versions/1 (HTML)
    const ver = await getJson(fetchFn, baseUrl, `/projects/${projectId}/versions/1`, token)
    throwIfRateLimited(ver.status, ver.json, ver.retryAfter)
    if (ver.status !== 200) {
      const code = errorCodeOf(ver.json, ver.status)
      return {
        sampleId: sample.id,
        variant,
        repeatIndex,
        status: 'failed',
        durationMs: Date.now() - started,
        bytes: 0,
        payloadBytes: Buffer.byteLength(JSON.stringify(payload), 'utf8'),
        errorCode: code,
        errorMessage: `GET version HTTP ${ver.status}`,
        retryAfter: ver.retryAfter,
        heuristics: null,
        htmlFile: null,
      }
    }
    const html = (ver.json as Envelope<{ html?: string }>).data.html ?? ''
    const heuristics = analyzeHeuristics(html, sample, variant)
    const htmlFile = `${fileBase}.html`
    await writeFile(join(sampleDir, htmlFile), html, 'utf8')
    return {
      sampleId: sample.id,
      variant,
      repeatIndex,
      status: 'ok',
      durationMs: Date.now() - started,
      bytes: Buffer.byteLength(html, 'utf8'),
      payloadBytes: Buffer.byteLength(JSON.stringify(payload), 'utf8'),
      errorCode: null,
      errorMessage: null,
      retryAfter: null,
      heuristics,
      htmlFile,
    }
  } catch (err) {
    if (err instanceof EvalStopError) throw err
    if (err instanceof ApiError && (err.code === 'AI_PROVIDER_ERROR' || err.code === 'RATE_LIMITED')) {
      if (err.code === 'RATE_LIMITED') {
        throw new EvalStopError('STOP 429. Tulis laporan parsial, keluar non-nol.', 'RATE_LIMITED', err.retryAfter ?? null)
      }
      // STREAM_INTERRUPTED (stream tanpa done) dicatat gagal dan lanjut,
      // tidak dihitung untuk stop 2x berurutan (spesifikasi Phase 4).
      if (err.reason === 'STREAM_INTERRUPTED') {
        return {
          sampleId: sample.id,
          variant,
          repeatIndex,
          status: 'failed',
          durationMs: Date.now() - started,
          bytes: 0,
          payloadBytes: Buffer.byteLength(JSON.stringify(payload), 'utf8'),
          errorCode: 'STREAM_INTERRUPTED',
          errorMessage: 'STREAM_INTERRUPTED',
          retryAfter: null,
          heuristics: null,
          htmlFile: null,
        }
      }
      // AI_PROVIDER_ERROR lain dilempar ke pemanggil untuk hitung consecutive.
      throw err
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        sampleId: sample.id,
        variant,
        repeatIndex,
        status: 'failed',
        durationMs: Date.now() - started,
        bytes: 0,
        payloadBytes: Buffer.byteLength(JSON.stringify(payload), 'utf8'),
        errorCode: 'TIMEOUT',
        errorMessage: `Generate timeout ${flags.timeoutMs} ms`,
        retryAfter: null,
        heuristics: null,
        htmlFile: null,
      }
    }
    const msg = err instanceof Error ? err.message : String(err)
    return {
      sampleId: sample.id,
      variant,
      repeatIndex,
      status: 'failed',
      durationMs: Date.now() - started,
      bytes: 0,
      payloadBytes: Buffer.byteLength(JSON.stringify(payload), 'utf8'),
      errorCode: 'ERROR',
      errorMessage: msg.slice(0, 200),
      retryAfter: null,
      heuristics: null,
      htmlFile: null,
    }
  } finally {
    if (projectId && !flags.keep) {
      await deleteProject(fetchFn, baseUrl, projectId, token)
    }
  }
}

// ── Runner ──────────────────────────────────────────────────────────────────

export interface EvalSummary {
  outDir: string
  probeEmail: string
  records: EvalRunRecord[]
  stoppedEarly: string | null
}

export async function runEval(
  flags: EvalFlags,
  env: NodeJS.ProcessEnv,
  deps: EvalDeps,
  samplesOverride?: BriefSample[],
): Promise<EvalSummary> {
  checkGuards(flags, env)
  const samples = samplesOverride ?? selectedSamples(flags)
  if (samples.length === 0) throw new EvalStopError('Tidak ada sampel terpilih.', 'BAD_ARGS')
  const total = countGenerations(samples.length, flags)
  const cap = flags.max ?? 16
  if (total > cap) {
    throw new EvalStopError(
      `DITOLAK: ${total} generasi melebihi batas ${cap}. Kurangi --only/--variants/--repeat atau tambah --max N.`,
      'CAP',
    )
  }

  // Rencana (tanpa data sensitif).
  const estSec = Math.round((total * 40 + ((total - 1) * flags.pauseMs) / 1000))
  console.log(`[eval] rencana: ${samples.length} sampel x ${flags.variants.length} varian x ${flags.repeat} ulang = ${total} generasi`)
  console.log(`[eval] estimasi durasi: ${estSec}s (25-60s per generasi + jeda ${flags.pauseMs}ms)`)
  console.log('[eval] peringatan kuota: tiap generasi memakai kuota AI. Jangan loop retry.')

  // Dry-run: nol panggilan jaringan.
  if (flags.dryRun) {
    await mkdir(deps.outDir, { recursive: true })
    const records: EvalRunRecord[] = []
    for (const s of samples) {
      const sampleDir = join(deps.outDir, s.id)
      await mkdir(sampleDir, { recursive: true })
      for (const v of flags.variants) {
        const { payload } = buildVariantPayload(s, v)
        const bytes = Buffer.byteLength(JSON.stringify(payload), 'utf8')
        console.log(`[dry-run] ${s.id}/${v}: payload ${bytes} byte`)
        await writeFile(join(sampleDir, `payload-${v}.json`), `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
        records.push({
          sampleId: s.id,
          variant: v,
          repeatIndex: 1,
          status: 'dry-run',
          durationMs: 0,
          bytes: 0,
          payloadBytes: bytes,
          errorCode: null,
          errorMessage: null,
          retryAfter: null,
          heuristics: null,
          htmlFile: null,
        })
      }
    }
    await writeOutputs(deps.outDir, samples, flags, records, 'dry-run', 'dry-run@example.com')
    return { outDir: deps.outDir, probeEmail: 'dry-run@example.com', records, stoppedEarly: null }
  }

  // Akun probe (password acak, tidak disimpan, tidak di-log).
  const stamp = formatProbeDate(deps.now())
  const probeEmail = `probe_${stamp.yyyymmdd}_${stamp.hhmm}@example.com`
  const password = deps.generatePassword()

  const reg = await postJson(deps.fetchFn, flags.baseUrl, '/auth/register', { email: probeEmail, password }, null)
  let token: string | null = null
  if (reg.status === 201 || reg.status === 200) {
    token = (reg.json as Envelope<{ token: string }>).data.token
  } else if (reg.status === 409) {
    const login = await postJson(deps.fetchFn, flags.baseUrl, '/auth/login', { email: probeEmail, password }, null)
    if (login.status !== 200) throw new EvalStopError(`Gagal login probe (HTTP ${login.status}).`, 'AUTH')
    token = (login.json as Envelope<{ token: string }>).data.token
  } else {
    throwIfRateLimited(reg.status, reg.json, reg.retryAfter)
    throw new EvalStopError(`Gagal register probe (HTTP ${reg.status}).`, 'AUTH')
  }
  if (!token) throw new EvalStopError('Token probe kosong.', 'AUTH')

  await mkdir(deps.outDir, { recursive: true })
  const records: EvalRunRecord[] = []
  let consecutiveAiErrors = 0
  let stoppedEarly: string | null = null

  // Tulis payload dulu (untuk inspeksi) sebelum network generate.
  for (const s of samples) {
    const sampleDir = join(deps.outDir, s.id)
    await mkdir(sampleDir, { recursive: true })
    for (const v of flags.variants) {
      const { payload } = buildVariantPayload(s, v)
      await writeFile(join(sampleDir, `payload-${v}.json`), `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
    }
  }

  let done = 0
  try {
    for (const s of samples) {
      const sampleDir = join(deps.outDir, s.id)
      for (const v of flags.variants) {
        const { payload } = buildVariantPayload(s, v)
        for (let r = 1; r <= flags.repeat; r++) {
          const fileBase = r === 1 ? v : `${v}-${r}`
          let rec: EvalRunRecord
          try {
            rec = await runOne(s, v, r, payload, flags, token, deps, sampleDir, fileBase)
          } catch (err) {
            if (err instanceof EvalStopError) throw err
            if (err instanceof ApiError && err.code === 'AI_PROVIDER_ERROR') {
              consecutiveAiErrors++
              rec = {
                sampleId: s.id,
                variant: v,
                repeatIndex: r,
                status: 'failed',
                durationMs: 0,
                bytes: 0,
                payloadBytes: Buffer.byteLength(JSON.stringify(payload), 'utf8'),
                errorCode: 'AI_PROVIDER_ERROR',
                errorMessage: 'AI provider error',
                retryAfter: null,
                heuristics: null,
                htmlFile: null,
              }
              records.push(rec)
              console.log(`[${s.id}/${v}#${r}] failed AI_PROVIDER_ERROR (${rec.bytes} byte)`)
              if (consecutiveAiErrors >= 2) {
                throw new EvalStopError('STOP: 2 AI_PROVIDER_ERROR berurutan. Tulis laporan parsial.', 'AI_ERRORS')
              }
              continue
            }
            throw err
          }
          records.push(rec)
          // Log hanya id, status, durasi, ukuran.
          console.log(`[${s.id}/${v}#${r}] ${rec.status} ${rec.durationMs}ms ${rec.bytes}b`)
          if (rec.status === 'ok') {
            consecutiveAiErrors = 0
          } else if (rec.errorCode === 'AI_PROVIDER_ERROR') {
            consecutiveAiErrors++
            if (consecutiveAiErrors >= 2) {
              throw new EvalStopError('STOP: 2 AI_PROVIDER_ERROR berurutan. Tulis laporan parsial.', 'AI_ERRORS')
            }
          } else {
            consecutiveAiErrors = 0
          }
          done++
          if (done < total) await deps.sleep(flags.pauseMs)
        }
      }
    }
  } catch (err) {
    if (err instanceof EvalStopError && (err.code === 'RATE_LIMITED' || err.code === 'AI_ERRORS')) {
      stoppedEarly = err.code === 'RATE_LIMITED' ? `429${err.retryAfter !== null ? ` Retry-After ${err.retryAfter}` : ''}` : '2x AI_PROVIDER_ERROR'
      console.log(`[eval] ${err.message}`)
      await writeOutputs(deps.outDir, samples, flags, records, stoppedEarly, probeEmail)
      throw err
    }
    throw err
  }

  // Meta per sampel.
  for (const s of samples) {
    const sampleDir = join(deps.outDir, s.id)
    const forSample = records.filter((r) => r.sampleId === s.id)
    const meta: Record<string, unknown> = {}
    for (const v of flags.variants) {
      const runs = forSample.filter((r) => r.variant === v)
      meta[v] = runs.map((r) => ({ status: r.status, durationMs: r.durationMs, bytes: r.bytes, file: r.htmlFile }))
    }
    await writeFile(join(sampleDir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`, 'utf8')
  }

  await writeOutputs(deps.outDir, samples, flags, records, stoppedEarly, probeEmail)
  console.log(`[eval] selesai. Hapus akun probe manual: ${probeEmail}`)
  return { outDir: deps.outDir, probeEmail, records, stoppedEarly }
}

// ── Output ──────────────────────────────────────────────────────────────────

async function writeOutputs(
  outDir: string,
  samples: BriefSample[],
  flags: EvalFlags,
  records: EvalRunRecord[],
  stoppedEarly: string | null,
  probeEmail: string,
): Promise<void> {
  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'results.json'), `${JSON.stringify({ stoppedEarly, records }, null, 2)}\n`, 'utf8')
  await writeFile(join(outDir, 'report.md'), buildReportMd(samples, flags, records, stoppedEarly, probeEmail), 'utf8')
  await writeFile(join(outDir, 'scoring.md'), buildScoringMd(samples), 'utf8')
  await writeFile(join(outDir, 'index.html'), buildIndexHtml(samples, records), 'utf8')
  // Meta per sampel bila belum ditulis (jalur stop dini).
  for (const s of samples) {
    const sampleDir = join(outDir, s.id)
    await mkdir(sampleDir, { recursive: true })
    try {
      const forSample = records.filter((r) => r.sampleId === s.id)
      const meta: Record<string, unknown> = {}
      for (const v of flags.variants) {
        const runs = forSample.filter((r) => r.variant === v)
        meta[v] = runs.map((r) => ({ status: r.status, durationMs: r.durationMs, bytes: r.bytes, file: r.htmlFile }))
      }
      await writeFile(join(sampleDir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`, 'utf8')
    } catch {
      // Best-effort.
    }
  }
}

export function buildReportMd(
  samples: BriefSample[],
  flags: EvalFlags,
  records: EvalRunRecord[],
  stoppedEarly: string | null,
  probeEmail: string,
): string {
  const lines: string[] = []
  lines.push('# Laporan Evaluasi Brief (legacy vs new)')
  lines.push('')
  lines.push('Hasil heuristik di bawah bersifat OBJEKTIF dan BUKAN skor kualitas.')
  lines.push('Penilaian kualitas memakai scoring.md (skala 1-5, diisi manual).')
  lines.push('')
  lines.push(`Sampel: ${samples.map((s) => s.id).join(', ')}`)
  lines.push(`Varian: ${flags.variants.join(', ')} (legacy = input novice: deskripsi+brand+type+lang saja; new = buildProjectPayload(draft). Batasan: mengukur efek panduan form, bukan kode pemetaan.)`)
  lines.push(`Ulang: ${flags.repeat}. Jeda: ${flags.pauseMs}ms. Timeout: ${flags.timeoutMs}ms.`)
  if (stoppedEarly) lines.push(`Berhenti dini: ${stoppedEarly}`)
  lines.push(`Akun probe (hapus manual): ${probeEmail}`)
  lines.push('')
  lines.push('| sampel | varian | ulang | status | durasi_ms | byte |')
  lines.push('| --- | --- | --- | --- | --- | --- |')
  for (const r of records) {
    lines.push(`| ${r.sampleId} | ${r.variant} | ${r.repeatIndex} | ${r.status} | ${r.durationMs} | ${r.bytes} |`)
  }
  lines.push('')
  lines.push('## Heuristik per varian (cek objektif)')
  lines.push('')
  lines.push('legenda: lang=atribut html lang; viewport=meta viewport ada; brand=nama brand muncul; wa=tautan wa.me cocok digit; hex=hex primer/aksen persis (AI boleh memakai varian, jadi Tidak belum tentu salah); sections=cakupan bagian; h1=jumlah h1; imgAlt=gambar tanpa alt; js/cssExt=skrip/gambar luar; form=jumlah form action http; byte=total byte.')
  lines.push('')
  for (const r of records) {
    const h = r.heuristics
    if (!h) {
      lines.push(`- ${r.sampleId}/${r.variant}#${r.repeatIndex}: ${r.status} (${r.errorCode ?? ''})`)
      continue
    }
    lines.push(`- ${r.sampleId}/${r.variant}#${r.repeatIndex}: lang=${h.htmlLang ?? '-'} viewport=${h.viewportMeta ? 'Ya' : 'Tidak'} brand=${h.brandPresent ? 'Ya' : 'Tidak'} wa=${h.waMeOk === null ? 'N/A' : h.waMeOk ? 'Ya' : 'Tidak'} hex=${h.primaryHexFound === null ? '-' : h.primaryHexFound ? 'Ya' : 'Tidak'}/${h.accentHexFound === null ? '-' : h.accentHexFound ? 'Ya' : 'Tidak'} sections=${h.sectionsCovered}/${h.sectionsTotal} h1=${h.h1Count} imgAlt=${h.imgWithoutAlt}/${h.imgTotal} jsExt=${h.externalScripts} imgExt=${h.externalImages} form=${h.formActionHttp} byte=${h.totalBytes}`)
  }
  lines.push('')
  return `${lines.join('\n')}\n`
}

export function buildScoringMd(samples: BriefSample[]): string {
  const lines: string[] = []
  lines.push('# Lembar Skor Manual (isi dengan 1-5 + catatan)')
  lines.push('')
  lines.push('Kriteria dari docs/BRIEF-EVAL.md: A warna, B kelengkapan bagian, C kontak, D teks Indonesia, E keterbacaan, F tujuan.')
  lines.push('Skala: 1=gagal, 2=kurang, 3=cukup, 4=baik, 5=sangat baik. Heuristik di report.md BUKAN skor.')
  lines.push('')
  for (const s of samples) {
    lines.push(`## ${s.id}`)
    lines.push('')
    lines.push('| kriteria | legacy (1-5) | new (1-5) | catatan |')
    lines.push('| --- | --- | --- | --- |')
    lines.push('| A kesesuaian warna | | | |')
    lines.push('| B kelengkapan bagian | | | |')
    lines.push('| C ketepatan kontak | | | |')
    lines.push('| D teks Indonesia | | | |')
    lines.push('| E keterbacaan | | | |')
    lines.push('| F sesuai tujuan | | | |')
    lines.push('')
  }
  lines.push('## Sinyal keputusan (dari BRIEF-EVAL.md bagian 6)')
  lines.push('')
  lines.push('- [ ] S1 hasil jelas lebih baik (mayoritas brief, new lebih baik di >=3 dari 6 kategori A-F).')
  lines.push('- [ ] S2 user ingin mengedit brief lama.')
  lines.push('- [ ] S3 deskripsi sering 3000-4000 (trimmed=true di >=3 dari 8 brief).')
  lines.push('')
  return `${lines.join('\n')}\n`
}

/**
 * Galeri lokal. Sengaja minimal (alat dev, bukan produk): tanpa gradien,
 * tanpa klaim, tanpa dekorasi. iframe memakai sandbox="allow-scripts" SAJA,
 * tidak pernah allow-same-origin, agar skrip hasil tidak menyentuh origin
 * alat ini. Semua string disisipkan lewat escapeHtml.
 */
export function buildIndexHtml(samples: BriefSample[], records: EvalRunRecord[]): string {
  const parts: string[] = []
  parts.push('<!doctype html>')
  parts.push('<html lang="id">')
  parts.push('<head><meta charset="utf-8">')
  parts.push('<meta name="viewport" content="width=device-width, initial-scale=1">')
  parts.push('<title>Galeri Evaluasi Brief</title>')
  parts.push('<style>body{font-family:system-ui,sans-serif;margin:24px;line-height:1.5} .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px} iframe{width:100%;height:480px;border:1px solid #ccc} table{border-collapse:collapse;margin-top:8px} th,td{border:1px solid #ccc;padding:4px 8px;text-align:left} @media(max-width:800px){.grid{grid-template-columns:1fr}}</style>')
  parts.push('</head><body>')
  parts.push('<h1>Galeri Evaluasi Brief (heuristik, bukan skor)</h1>')
  parts.push('<p>Setiap iframe memakai sandbox allow-scripts saja. Buka di tab baru untuk interaksi penuh.</p>')
  for (const s of samples) {
    parts.push(`<h2>${escapeHtml(s.id)}</h2>`)
    parts.push('<div class="grid">')
    for (const v of ['legacy', 'new'] as const) {
      const rec = records.find((r) => r.sampleId === s.id && r.variant === v && r.repeatIndex === 1)
      const file = rec?.htmlFile ?? `${v}.html`
      const src = `${escapeHtml(s.id)}/${escapeHtml(file)}`
      parts.push('<div>')
      parts.push(`<h3>${escapeHtml(v)}</h3>`)
      parts.push(`<iframe src="${src}" sandbox="allow-scripts" title="${escapeHtml(s.id)} ${escapeHtml(v)}"></iframe>`)
      parts.push(`<p><a href="${src}" target="_blank" rel="noopener noreferrer">Buka ${escapeHtml(s.id)} ${escapeHtml(v)} di tab baru</a></p>`)
      parts.push('</div>')
    }
    parts.push('</div>')
    parts.push('<table><tr><th>varian</th><th>status</th><th>lang</th><th>viewport</th><th>brand</th><th>wa</th><th>hex</th><th>sections</th><th>h1</th><th>byte</th></tr>')
    for (const v of ['legacy', 'new'] as const) {
      const rec = records.find((r) => r.sampleId === s.id && r.variant === v && r.repeatIndex === 1)
      const h = rec?.heuristics
      if (!h || !rec) {
        parts.push(`<tr><td>${escapeHtml(v)}</td><td>${escapeHtml(rec?.status ?? 'tidak-ada')}</td><td colspan="8">-</td></tr>`)
        continue
      }
      parts.push(
        `<tr><td>${escapeHtml(v)}</td><td>${escapeHtml(rec.status)}</td><td>${escapeHtml(h.htmlLang ?? '-')}</td><td>${escapeHtml(h.viewportMeta ? 'Ya' : 'Tidak')}</td><td>${escapeHtml(h.brandPresent ? 'Ya' : 'Tidak')}</td><td>${escapeHtml(h.waMeOk === null ? 'N/A' : h.waMeOk ? 'Ya' : 'Tidak')}</td><td>${escapeHtml((h.primaryHexFound ? 'Ya' : 'Tidak') + '/' + (h.accentHexFound ? 'Ya' : 'Tidak'))}</td><td>${escapeHtml(`${h.sectionsCovered}/${h.sectionsTotal}`)}</td><td>${escapeHtml(String(h.h1Count))}</td><td>${escapeHtml(String(h.totalBytes))}</td></tr>`,
      )
    }
    parts.push('</table>')
  }
  parts.push('</body></html>')
  return `${parts.join('\n')}\n`
}

// ── Entrypoint CLI ──────────────────────────────────────────────────────────

async function cli(): Promise<void> {
  let flags: EvalFlags
  try {
    flags = parseEvalArgs(process.argv.slice(2))
  } catch (err) {
    if (err instanceof EvalStopError && err.code === 'HELP') return
    throw err
  }
  const samples = selectedSamples(flags)
  const total = countGenerations(samples.length, flags)
  const cap = flags.max ?? 16
  if (total > cap) {
    console.log(`DITOLAK: ${total} generasi melebihi batas ${cap}.`)
    process.exitCode = 1
    return
  }
  const stamp = formatStamp(new Date())
  const outDir = join('eval-output', stamp)
  const deps: EvalDeps = {
    fetchFn: fetch,
    outDir,
    sleep: (ms: number) => new Promise((r) => setTimeout(r, ms)),
    now: () => new Date(),
    generatePassword: defaultGeneratePassword,
  }
  try {
    await runEval(flags, process.env, deps)
  } catch (err) {
    if (err instanceof EvalStopError) {
      if (err.code === 'GUARD' || err.code === 'CAP' || err.code === 'BAD_ARGS') {
        console.log(err.message)
        process.exitCode = 1
        return
      }
      // RATE_LIMITED / AI_ERRORS sudah menulis laporan parsial.
      console.log(err.message)
      process.exitCode = 1
      return
    }
    throw err
  }
}

const invokedAsScript = (process.argv[1] ?? '').replace(/\\/g, '/').endsWith('scripts/brief-eval.ts') || (process.argv[1] ?? '').replace(/\\/g, '/').endsWith('brief-eval.ts')

if (invokedAsScript) {
  cli().catch((err: unknown) => {
    console.error('[brief-eval] gagal:', err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
}
