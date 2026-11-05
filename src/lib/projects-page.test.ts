import { describe, it, expect } from 'vitest'
import {
  PAGE_SIZE,
  parsePageParam,
  validateProjectsSearch,
  calculateOffset,
} from './projects-page'

describe('parsePageParam', () => {
  it('returns valid positive integers as number', () => {
    expect(parsePageParam(1)).toBe(1)
    expect(parsePageParam(2)).toBe(2)
    expect(parsePageParam(42)).toBe(42)
    expect(parsePageParam(100_000)).toBe(100_000)
  })

  it('accepts numeric string representations of positive integers', () => {
    expect(parsePageParam('1')).toBe(1)
    expect(parsePageParam('2')).toBe(2)
    expect(parsePageParam('99')).toBe(99)
    expect(parsePageParam('100000')).toBe(100_000)
    expect(parsePageParam('  5  ')).toBe(5)
  })

  it('normalizes undefined to 1', () => {
    expect(parsePageParam(undefined)).toBe(1)
  })

  it('normalizes 0 to 1', () => {
    expect(parsePageParam(0)).toBe(1)
    expect(parsePageParam('0')).toBe(1)
  })

  it('normalizes negative numbers to 1', () => {
    expect(parsePageParam(-1)).toBe(1)
    expect(parsePageParam(-3)).toBe(1)
    expect(parsePageParam('-5')).toBe(1)
  })

  it('normalizes decimals to 1', () => {
    expect(parsePageParam(1.5)).toBe(1)
    expect(parsePageParam(3.14)).toBe(1)
    expect(parsePageParam('2.5')).toBe(1)
  })

  it('normalizes NaN and Infinity to 1', () => {
    expect(parsePageParam(Number.NaN)).toBe(1)
    expect(parsePageParam(Number.POSITIVE_INFINITY)).toBe(1)
    expect(parsePageParam(Number.NEGATIVE_INFINITY)).toBe(1)
  })

  it('normalizes alphanumeric strings like "3abc" to 1', () => {
    expect(parsePageParam('3abc')).toBe(1)
    expect(parsePageParam('abc')).toBe(1)
    expect(parsePageParam('12#')).toBe(1)
  })

  it('normalizes arrays and objects to 1', () => {
    expect(parsePageParam([])).toBe(1)
    expect(parsePageParam([2])).toBe(1)
    expect(parsePageParam({})).toBe(1)
    expect(parsePageParam({ page: 2 })).toBe(1)
  })

  it('normalizes values above 100000 to 1', () => {
    expect(parsePageParam(100_001)).toBe(1)
    expect(parsePageParam(999_999)).toBe(1)
    expect(parsePageParam('100001')).toBe(1)
  })
})

describe('validateProjectsSearch', () => {
  it('returns empty object for page 1 or invalid input (omits page param)', () => {
    expect(validateProjectsSearch({})).toEqual({})
    expect(validateProjectsSearch({ page: 1 })).toEqual({})
    expect(validateProjectsSearch({ page: '1' })).toEqual({})
    expect(validateProjectsSearch({ page: 0 })).toEqual({})
    expect(validateProjectsSearch({ page: -3 })).toEqual({})
    expect(validateProjectsSearch({ page: 'abc' })).toEqual({})
  })

  it('returns { page: N } for valid page numbers > 1', () => {
    expect(validateProjectsSearch({ page: 2 })).toEqual({ page: 2 })
    expect(validateProjectsSearch({ page: '3' })).toEqual({ page: 3 })
    expect(validateProjectsSearch({ page: 10 })).toEqual({ page: 10 })
  })
})

describe('calculateOffset', () => {
  it('calculates (page - 1) * PAGE_SIZE correctly', () => {
    expect(calculateOffset(1)).toBe(0)
    expect(calculateOffset(2)).toBe(PAGE_SIZE)
    expect(calculateOffset(3)).toBe(2 * PAGE_SIZE)
    expect(calculateOffset(4)).toBe(3 * PAGE_SIZE)
  })

  it('defaults to offset 0 for invalid page input', () => {
    expect(calculateOffset(0)).toBe(0)
    expect(calculateOffset(-1)).toBe(0)
    expect(calculateOffset(1.5)).toBe(0)
  })
})
