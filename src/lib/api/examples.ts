import { api, ApiError, apiUrl } from './client'
import { isAiBusyError } from './errors'
import type { ApiResponse, Brief, ExampleCategory, ExampleSite } from '@/types/api'

export const EXAMPLE_LABEL = 'Contoh hasil'
export const EXAMPLE_BUSY_LABEL = 'Contoh hasil, AI sedang sibuk'

export const examplesApi = {
  /** GET /api/v1/examples — katalog contoh statis (publik). */
  list: async (): Promise<ExampleSite[]> => {
    const res = await api.get<ApiResponse<ExampleSite[]>>('/examples')
    return res.data ?? []
  },

  /** GET /api/v1/examples/{slug} — HTML mentah untuk iframe srcDoc. */
  html: async (slug: string, fetchFn: typeof fetch = fetch): Promise<string> => {
    const res = await fetchFn(apiUrl(`/examples/${encodeURIComponent(slug)}`))
    if (!res.ok) {
      throw new ApiError(res.status, 'Contoh tidak bisa dimuat.', 'NOT_FOUND')
    }
    return res.text()
  },
}

const TYPE_WEIGHTS: Record<string, Partial<Record<ExampleCategory, number>>> = {
  landing_page: { kuliner: 18, acara: 18, jasa: 12, toko: 10, portofolio: 8 },
  portfolio: { portofolio: 70 },
  company_profile: { jasa: 55, portofolio: 18, acara: 8, kuliner: 8, toko: 6 },
  online_store: { toko: 70 },
  blog: { portofolio: 20, acara: 10 },
}

const CATEGORY_KEYWORDS: Record<ExampleCategory, string[]> = {
  kuliner: [
    'kuliner',
    'kopi',
    'kafe',
    'cafe',
    'kedai',
    'restoran',
    'rumah makan',
    'makanan',
    'minuman',
    'bakery',
    'roti',
    'kue',
    'catering',
    'warung',
    'croissant',
  ],
  jasa: [
    'jasa',
    'bengkel',
    'servis',
    'service',
    'salon',
    'perbaikan',
    'konsultan',
    'layanan',
    'tukang',
    'laundry',
    'klinik',
    'dokter',
    'kursus',
    'pendidikan',
    'tune up',
    'ganti oli',
  ],
  toko: [
    'toko',
    'belanja',
    'produk',
    'katalog',
    'fashion',
    'pakaian',
    'sepatu',
    'aksesori',
    'toko online',
    'olshop',
    'butik',
    'peralatan rumah',
  ],
  portofolio: [
    'portofolio',
    'portfolio',
    'karya',
    'desain',
    'fotografi',
    'fotografer',
    'studio',
    'kreatif',
    'arsitek',
    'ilustrasi',
    'seniman',
    'pameran karya',
  ],
  acara: [
    'acara',
    'event',
    'festival',
    'konser',
    'seminar',
    'workshop',
    'wisuda',
    'pernikahan',
    'undangan',
    'pameran',
    'bazaar',
    'bazar',
    'pendaftaran',
    'tiket',
  ],
}

const KEYWORD_WEIGHT = 14

export type ExampleMatchInput = Pick<Brief, 'website_type' | 'description' | 'business_name'> & {
  title?: string
}

function searchableText(input: ExampleMatchInput): string {
  return [input.title, input.business_name, input.description]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(' ')
    .toLowerCase()
}

/** Skor kecocokan satu contoh dengan brief; makin tinggi makin cocok. */
export function exampleScore(site: ExampleSite, input: ExampleMatchInput): number {
  const text = searchableText(input)
  let score = 0

  if (input.website_type) {
    score += TYPE_WEIGHTS[input.website_type]?.[site.category] ?? 0
  }

  for (const keyword of CATEGORY_KEYWORDS[site.category] ?? []) {
    if (text.includes(keyword)) score += KEYWORD_WEIGHT
  }

  return score
}

/**
 * Pilih contoh paling cocok. Urutan katalog dipakai sebagai pemecah seri,
 * jadi brief tanpa petunjuk tetap mendapat contoh pertama yang stabil.
 */
export function pickExample(
  sites: ExampleSite[],
  input: ExampleMatchInput,
): ExampleSite | null {
  let best: ExampleSite | null = null
  let bestScore = -1

  for (const site of sites) {
    const score = exampleScore(site, input)
    if (score > bestScore) {
      best = site
      bestScore = score
    }
  }

  return best
}

/**
 * Hanya kegagalan yang memicu fallback contoh: AI sibuk/kuota habis dan
 * timeout/stream macet. Error validasi atau filter keamanan tidak boleh
 * ditutupi contoh.
 */
export function shouldShowExampleFallback(err: unknown): boolean {
  if (isAiBusyError(err)) return true
  if (!(err instanceof ApiError) || err.code !== 'AI_PROVIDER_ERROR') return false
  return (
    err.reason === 'STREAM_TIMEOUT' ||
    err.reason === 'STREAM_STALLED' ||
    err.reason === 'PROVIDER_OVERLOADED'
  )
}
