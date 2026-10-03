import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Guard keamanan otomatis: gagal bila source frontend mengandung pola
 * berbahaya untuk HTML hasil AI, dan memastikan komponen preview memakai
 * sandbox persis "allow-scripts allow-popups".
 */

function listSourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      // Lewati mock & test (mock hanya berisi HTML contoh untuk dev).
      if (entry === 'mock') continue
      out.push(...listSourceFiles(full))
    } else if (/\.(tsx?|jsx?)$/.test(entry) && !/\.test\.(tsx?|jsx?)$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

const SRC_DIR = dirname(fileURLToPath(import.meta.url))
const FORBIDDEN: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /allow-same-origin/, label: 'allow-same-origin' },
  { pattern: /dangerouslySetInnerHTML/, label: 'dangerouslySetInnerHTML' },
  { pattern: /v-html/, label: 'v-html' },
]

/** Hapus komentar agar penyebutan di dokumentasi tidak dihitung pelanggaran. */
function stripComments(content: string): string {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1')
}

describe('guard keamanan preview', () => {
  const files = listSourceFiles(SRC_DIR)

  it('tidak mengandung pola render HTML berbahaya (di luar komentar)', () => {
    const violations: string[] = []
    for (const file of files) {
      const content = stripComments(readFileSync(file, 'utf8'))
      for (const { pattern, label } of FORBIDDEN) {
        if (pattern.test(content)) violations.push(`${file}: ${label}`)
      }
      // innerHTML sebagai assignment (properti DOM), bukan sekadar kata.
      if (/\.innerHTML\s*=/.test(content)) violations.push(`${file}: innerHTML assignment`)
    }
    expect(violations).toEqual([])
  })

  it('PreviewFrame memakai sandbox persis "allow-scripts allow-popups"', () => {
    const raw = readFileSync(join(SRC_DIR, 'components', 'PreviewFrame.tsx'), 'utf8')
    expect(raw).toContain('sandbox="allow-scripts allow-popups"')
    expect(stripComments(raw)).not.toContain('allow-same-origin')
    expect(raw).toContain('srcDoc')
  })

  it('token SSE hanya ditampilkan sebagai teks biasa', () => {
    const content = readFileSync(
      join(SRC_DIR, 'routes', '_app', 'projects.$projectId.tsx'),
      'utf8',
    )
    // Panel progres memakai <pre> (node teks), bukan render HTML.
    expect(content).toContain('<pre')
  })
})
