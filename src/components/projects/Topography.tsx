import { cn } from '@/lib/utils/cn'

const CONTOURS = [
  'M-90 120C65 22 183 28 310 104s217 73 333-25S873-15 990 70s228 102 370 2 253-72 380 40',
  'M-82 151C57 59 181 58 299 127s220 67 338-24 228-83 351-5 235 95 372 1 253-61 370 48',
  'M-74 182C49 97 175 89 291 150s221 61 341-20 227-74 354-3 241 88 374 1 249-53 360 54',
  'M-66 213C42 135 170 119 284 173s221 56 343-16 226-65 357 0 245 81 376 4 243-45 350 58',
  'M-58 244C35 173 165 149 278 196s221 50 344-12 225-56 359 3 249 74 378 7 237-36 340 62',
  'M-50 275C29 211 161 179 273 219s220 45 345-8 224-47 361 6 251 68 379 10 231-28 330 66',
  'M-42 306C23 249 157 209 268 242s219 40 345-4 223-39 362 9 254 61 380 13 225-19 320 70',
  'M-34 337C17 287 153 239 263 265s217 35 344 0 222-30 363 12 255 55 380 16 219-11 310 74',
  'M-26 368C11 325 149 269 258 288s215 30 343 4 221-21 363 15 256 49 379 19 213-2 300 78',
  'M-18 399C5 363 145 299 253 311s213 25 341 8 220-12 363 18 257 42 378 22 207 6 290 82',
  'M-10 430C-1 401 141 329 248 334s211 20 339 12 219-3 362 21 257 36 376 25 201 15 280 86',
  'M-2 461C-7 439 137 359 243 357s209 15 337 16 218 6 361 24 257 30 374 28 195 23 270 90',
  'M6 492C-13 477 133 389 238 380s207 10 335 20 217 15 359 27 256 23 372 31 189 32 260 94',
  'M14 523C-19 515 129 419 233 403s205 5 333 24 216 24 357 30 255 17 370 34 183 40 250 98',
  'M22 554C-25 553 125 449 228 426s203 0 331 28 215 33 355 33 254 11 368 37 177 49 240 102',
]

export type TopographyProps = {
  miniature?: boolean
  className?: string
}

/**
 * Motif identitas halaman project: garis kontur peta topografi.
 * Netral (mengikuti warna border/muted lewat CSS `.topography`),
 * statis tanpa animasi, selalu disembunyikan dari pembaca layar.
 */
export function Topography({ miniature = false, className }: TopographyProps) {
  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={cn('topography', miniature && 'topography-mini', className)}
    >
      <g>
        {CONTOURS.map((d, index) => (
          <path key={d} d={d} className={(index + 1) % 5 === 0 ? 'index-contour' : undefined} />
        ))}
        <g transform="translate(1510 890) rotate(180) scale(.78)">
          {CONTOURS.slice(0, 11).map((d, index) => (
            <path
              key={`b-${d}`}
              d={d}
              className={(index + 1) % 5 === 0 ? 'index-contour' : undefined}
            />
          ))}
        </g>
      </g>
    </svg>
  )
}
