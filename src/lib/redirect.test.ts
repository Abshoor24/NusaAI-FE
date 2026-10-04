import { describe, it, expect } from 'vitest'
import { sanitizeRedirect, DEFAULT_POST_LOGIN_REDIRECT } from './redirect'

describe('sanitizeRedirect', () => {
  it.each([
    ['/projects', '/projects'],
    ['/projects/abc-123?autostart=1', '/projects/abc-123?autostart=1'],
    ['/projects/abc-123?autostart=1&withImages=1', '/projects/abc-123?autostart=1&withImages=1'],
    ['/settings', '/settings'],
    ['  /projects  ', '/projects'],
  ])('path internal "%s" dipertahankan', (raw, expected) => {
    expect(sanitizeRedirect(raw)).toBe(expected)
  })

  it.each([
    ['//evil.com', 'protocol-relative'],
    ['https://evil.com', 'skema https'],
    ['http://evil.com/login', 'skema http'],
    ['javascript:alert(1)', 'skema javascript'],
    ['', 'kosong'],
    [null, 'null'],
    [undefined, 'undefined'],
    [123, 'bukan string'],
    ['projects', 'path relatif'],
    ['/login', 'loop login'],
    ['/login?expired=1', 'loop login ber-query'],
    ['/register', 'loop register'],
    ['/REGISTER', 'loop register kapital'],
    ['/\\evil.com', 'backslash'],
    ['/projects dengan spasi', 'spasi'],
  ] as Array<[unknown, string]>)('"%s" (%s) → fallback', (raw) => {
    expect(sanitizeRedirect(raw)).toBe(DEFAULT_POST_LOGIN_REDIRECT)
  })
})
