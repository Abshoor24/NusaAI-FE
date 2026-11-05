import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { siteConfig } from '@/config/site'

function listSourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === 'mock' || entry === '__tests__') continue
      out.push(...listSourceFiles(full))
    } else if (/\.(tsx?|jsx?|css)$/.test(entry) && !/\.test\.(tsx?|jsx?)$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

function stripComments(content: string): string {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1')
}

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')

describe('branding unit guard', () => {
  it('siteConfig name equals "Nusa AI"', () => {
    expect(siteConfig.name).toBe('Nusa AI')
  })

  it('no non-test source files contain "Pakhir Studio" (outside comments)', () => {
    const srcFiles = listSourceFiles(HERE)
    const extraFiles = [join(ROOT, 'index.html'), join(ROOT, 'README.md')]
    const allFiles = [...srcFiles, ...extraFiles]

    const pattern = /pakhir studio/i
    const violations: string[] = []

    for (const file of allFiles) {
      const raw = readFileSync(file, 'utf8')
      const content = stripComments(raw)
      if (pattern.test(content)) {
        violations.push(file)
      }
    }

    expect(
      violations,
      `Found forbidden "Pakhir Studio" in files: ${violations.join(', ')}`,
    ).toEqual([])
  })
})
