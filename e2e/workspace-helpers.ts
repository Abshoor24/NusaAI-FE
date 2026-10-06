import type { Page } from '@playwright/test'

/** Basis mock API + SSE untuk skenario workspace (tanpa backend/AI). */

export function envelope(data: unknown) {
  return { success: true, message: 'ok', data }
}

export interface MockVersion {
  id: string
  version_number: number
  kind: 'generate' | 'revise'
  prompt: string
  html: string
}

export interface WorkspaceState {
  status: 'draft' | 'generating' | 'ready' | 'failed'
  title: string
  versions: MockVersion[]
}

/** Bangun body SSE: N event token lalu (opsional) event done. */
export function sseBody(tokens: string[], done?: Record<string, unknown>): string {
  let out = ''
  for (const token of tokens) {
    out += `event: token\ndata: ${JSON.stringify({ token })}\n\n`
  }
  if (done) {
    out += `event: done\ndata: ${JSON.stringify(done)}\n\n`
  }
  return out
}

export function doneEvent(projectId: string, versionNumber: number): Record<string, unknown> {
  return {
    project_id: projectId,
    version_id: `v${versionNumber}`,
    version_number: versionNumber,
  }
}

/** Pasang login palsu (token + /auth/me) agar guard lolos. */
export async function mockLogin(page: Page, email = 'e2e@example.com'): Promise<void> {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('nusa_auth_token', 'e2e-token')
    } catch {
      // addInitScript berjalan di SEMUA frame termasuk iframe pratinjau yang
      // di-sandbox (tanpa allow-same-origin): storage tak tersedia di sana.
    }
  })
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      json: envelope({ id: 'u1', email, created_at: '2026-01-01T00:00:00Z' }),
    }),
  )
}

function latestFull(projectId: string, state: WorkspaceState): unknown {
  const latest = state.versions[0] ?? null
  return {
    id: projectId,
    title: state.title,
    status: state.status,
    brief: { description: 'Deskripsi project untuk pengujian E2E workspace.' },
    version_count: state.versions.length,
    latest_version: latest
      ? {
          id: latest.id,
          project_id: projectId,
          version_number: latest.version_number,
          kind: latest.kind,
          prompt: latest.prompt,
          html: latest.html,
          created_at: '2026-01-01T00:00:00Z',
        }
      : null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

/**
 * Mock endpoint workspace yang stateful: detail, versions, satu versi,
 * attachments. Urutan pendaftaran penting (spesifik dulu).
 */
export async function mockWorkspaceApi(
  page: Page,
  projectId: string,
  state: WorkspaceState,
): Promise<void> {
  await page.route(`**/api/v1/projects/${projectId}/versions/*`, (route) => {
    const n = Number(route.request().url().split('/').pop())
    const found = state.versions.find((v) => v.version_number === n)
    if (!found) {
      return route.fulfill({
        status: 404,
        json: { success: false, error: { code: 'NOT_FOUND', message: 'Version not found' } },
      })
    }
    return route.fulfill({
      json: envelope({
        id: found.id,
        project_id: projectId,
        version_number: found.version_number,
        kind: found.kind,
        prompt: found.prompt,
        html: found.html,
        created_at: '2026-01-01T00:00:00Z',
      }),
    })
  })
  await page.route(`**/api/v1/projects/${projectId}/versions`, (route) =>
    route.fulfill({
      json: envelope(
        state.versions.map((v) => ({
          id: v.id,
          project_id: projectId,
          version_number: v.version_number,
          kind: v.kind,
          prompt: v.prompt,
          created_at: '2026-01-01T00:00:00Z',
        })),
      ),
    }),
  )
  await page.route(`**/api/v1/projects/${projectId}/attachments`, (route) =>
    route.fulfill({ json: envelope([]) }),
  )
  await page.route(`**/api/v1/projects/${projectId}`, (route) =>
    route.fulfill({ json: envelope(latestFull(projectId, state)) }),
  )
}

export function versionHtml(n: number): string {
  return `<html><body><h1>Versi ${n}</h1></body></html>`
}
