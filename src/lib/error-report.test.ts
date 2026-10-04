import { describe, it, expect } from 'vitest'
import { buildErrorReport, reportError } from './error-report'

describe('buildErrorReport', () => {
  it('memotong pesan/stack dan tidak memuat token atau HTML', () => {
    const secretToken = 'rahasia-token-123'
    const html = '<html><body>data pengguna</body></html>'
    const err = new Error(`${'x'.repeat(600)} ${secretToken}`)
    err.stack = `${'y'.repeat(3000)} ${html}`
    const report = buildErrorReport(err)

    expect(report.message.length).toBeLessThanOrEqual(500)
    expect(report.stack?.length).toBeLessThanOrEqual(2000)
    const blob = JSON.stringify(report)
    // Token/HTML hanya boleh muncul bila masuk 500/2000 char pertama;
    // di sini keduanya ditaruh di ujung sehingga harus terpotong.
    expect(blob).not.toContain(secretToken)
    expect(blob).not.toContain(html)
    expect(report).toHaveProperty('path')
    expect(report).toHaveProperty('at')
  })

  it('error non-Error tetap dilaporkan tanpa melempar', () => {
    const report = buildErrorReport('string mentah')
    expect(report.name).toBe('UnknownError')
    expect(report.message).toBe('string mentah')
  })
})

describe('reportError', () => {
  it('diam bila endpoint tidak dikonfigurasi', () => {
    expect(() => reportError(new Error('boom'))).not.toThrow()
  })
})
