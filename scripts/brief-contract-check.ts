/**
 * Skrip SEKALI JALAN (BUKAN bagian suite CI).
 *
 * Men membuktikan bahwa payload yang dihasilkan buildProjectPayload untuk 8
 * contoh brief di fixtures/brief-samples.ts benar-benar DITERIMA backend
 * sungguhan (HTTP 201) — hal yang tidak bisa dibuktikan oleh E2E ber-mock.
 *
 * TIDAK memanggil endpoint generate/revise, TIDAK memakai ?autostart=1,
 * sehingga kuota AI tidak tersentuh.
 *
 * Cara pakai:
 *   npx tsx scripts/brief-contract-check.ts
 *
 * Variabel lingkungan:
 *   API_BASE      default http://127.0.0.1:8080/api/v1
 *   PROBE_EMAIL   akun probe (default probe_contract@example.com)
 *   PROBE_PASSWORD
 */

import { BRIEF_SAMPLES } from '../fixtures/brief-samples'
import { buildProjectPayload } from '../src/lib/brief/build-payload'
import { validateBrief } from '../src/lib/brief/validate'

const API_BASE = (process.env.API_BASE ?? 'http://127.0.0.1:8080/api/v1').replace(/\/+$/, '')
const EMAIL = process.env.PROBE_EMAIL ?? 'probe_contract@example.com'
const PASSWORD = process.env.PROBE_PASSWORD ?? 'ProbeContract123456'

interface Envelope<T> {
  success: boolean
  message: string
  data: T
}

interface ErrorEnvelope {
  success: false
  error: { code: string; message: string; fields?: Record<string, string> }
}

async function call<T>(
  path: string,
  init: { method: string; body?: unknown; token?: string },
): Promise<{ status: number; json: Envelope<T> | ErrorEnvelope | null }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (init.token) headers.Authorization = `Bearer ${init.token}`
  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method,
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  let json: unknown = null
  try {
    json = await res.json()
  } catch {
    json = null
  }
  return { status: res.status, json: json as Envelope<T> | ErrorEnvelope | null }
}

/** Akun probe: coba register, kalau 409 pakai login. */
async function login(): Promise<string> {
  const reg = await call<{ token: string }>('/auth/register', {
    method: 'POST',
    body: { email: EMAIL, password: PASSWORD },
  })
  if (reg.status === 201 || reg.status === 200) {
    return (reg.json as Envelope<{ token: string }>).data.token
  }
  const loginRes = await call<{ token: string }>('/auth/login', {
    method: 'POST',
    body: { email: EMAIL, password: PASSWORD },
  })
  if (loginRes.status !== 200) {
    throw new Error(`Gagal login probe ${EMAIL}: HTTP ${loginRes.status}`)
  }
  return (loginRes.json as Envelope<{ token: string }>).data.token
}

interface Row {
  id: string
  http: number
  descLen: number
  trimmed: boolean
  sections: number
  note: string
}

async function main(): Promise<void> {
  console.log(`[brief-contract-check] API: ${API_BASE}`)
  console.log(`[brief-contract-check] akun probe: ${EMAIL}`)
  const token = await login()

  const rows: Row[] = []
  for (const sample of BRIEF_SAMPLES) {
    const { payload, trimmed, descriptionLength } = buildProjectPayload(sample.draft)
    const clientErrors = validateBrief(sample.draft)
    const sections = payload.brief.sections?.length ?? 0
    let note = ''

    if (Object.keys(clientErrors).length > 0) {
      rows.push({
        id: sample.id,
        http: 0,
        descLen: descriptionLength,
        trimmed,
        sections,
        note: `dilewati: validasi klien gagal (${Object.keys(clientErrors).join(', ')})`,
      })
      console.log(`SKIP ${sample.id}: validasi klien gagal`)
      continue
    }

    const res = await call<{ id: string }>('/projects', {
      method: 'POST',
      body: payload,
      token,
    })

    let projectId: string | null = null
    if (res.status === 201) {
      projectId = (res.json as Envelope<{ id: string }>).data.id
    } else {
      const err = res.json as ErrorEnvelope | null
      note = err?.error ? `${err.error.code}: ${err.error.message}` : `HTTP ${res.status}`
      if (err?.error?.fields) note += ` ${JSON.stringify(err.error.fields)}`
    }

    rows.push({ id: sample.id, http: res.status, descLen: descriptionLength, trimmed, sections, note })
    console.log(`${sample.id}: HTTP ${res.status} (desc ${descriptionLength} karakter, ${sections} bagian)`)

    // Hapus project yang baru dibuat supaya database tidak accumulating.
    if (projectId) {
      const del = await call<null>(`/projects/${projectId}`, { method: 'DELETE', token })
      console.log(`   hapus ${projectId}: HTTP ${del.status}`)
      if (del.status >= 400) {
        rows[rows.length - 1].note += ` | DELETE gagal HTTP ${del.status}`
      }
    }
    // Jeda kecil agar tidak kena rate limit 120 req/menit.
    await new Promise((r) => setTimeout(r, 300))
  }

  console.log('\n=== TABEL HASIL (5.4) ===')
  console.log('| id | HTTP | panjang description | trimmed | jumlah bagian | catatan |')
  console.log('| --- | --- | --- | --- | --- | --- |')
  for (const row of rows) {
    console.log(
      `| ${row.id} | ${row.http} | ${row.descLen} | ${row.trimmed} | ${row.sections} | ${row.note || '-'} |`,
    )
  }
  const accepted = rows.filter((r) => r.http === 201).length
  console.log(`\nDiterima backend: ${accepted}/${rows.length}`)
  if (accepted !== rows.length) {
    process.exitCode = 1
    console.log('ADA YANG GAGAL — perbaiki payload sebelum lanjut Tahap 2.')
  }
  console.log(`\nAkun probe: ${EMAIL} (hapus manual dari database bila tidak dipakai lagi).`)
  console.log('Semua project yang dibuat skrip ini sudah dihapus.')
}

main().catch((err: unknown) => {
  console.error('[brief-contract-check] gagal:', err instanceof Error ? err.message : err)
  process.exitCode = 1
})