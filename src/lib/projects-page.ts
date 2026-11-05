export const PAGE_SIZE = 6

export type ProjectsSearch = {
  page?: number
}

/**
 * Pure function to parse and normalize the page parameter.
 * Accepts a number or numeric string that is a positive integer between 1 and 100,000.
 * Anything else returns 1 (e.g. undefined, 0, negative, decimal, NaN, Infinity, '3abc', arrays, objects, > 100000).
 */
export function parsePageParam(raw: unknown): number {
  if (typeof raw === 'number') {
    if (Number.isInteger(raw) && raw >= 1 && raw <= 100_000) {
      return raw
    }
    return 1
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (/^\d+$/.test(trimmed)) {
      const parsed = Number(trimmed)
      if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 100_000) {
        return parsed
      }
    }
    return 1
  }

  return 1
}

/**
 * Normalizer for Route search parameters.
 * Returns {} when page is 1 (or invalid) so page 1 has no 'page' parameter in URL.
 * Returns { page } for positive integers > 1.
 */
export function validateProjectsSearch(search: Record<string, unknown>): ProjectsSearch {
  const page = parsePageParam(search.page)
  if (page <= 1) {
    return {}
  }
  return { page }
}

/**
 * Helper to calculate offset from 1-based page number.
 * offset = (page - 1) * PAGE_SIZE
 */
export function calculateOffset(page: number): number {
  const safePage = parsePageParam(page)
  return (safePage - 1) * PAGE_SIZE
}
