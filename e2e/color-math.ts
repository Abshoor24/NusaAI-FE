/**
 * Matematika warna untuk tes kontras (dipakai e2e/contrast-tokens.spec.ts).
 * Mengurai keluaran getComputedStyle apa adanya (rgb(), oklch(), oklab(),
 * koma atau spasi, alpha koma atau garis miring) menjadi triple sRGB.
 */

export type Rgb = [number, number, number]

export function colorTokens(serialized: string): string[] {
  return serialized.match(/(?:rgba?\([^)]+\)|oklch?\([^)]+\)|oklab\([^)]+\))/g) ?? []
}

function withPercent(a: string): number {
  return a.endsWith('%') ? Number(a.slice(0, -1)) / 100 : Number(a)
}

export function parseColor(token: string): { rgb?: Rgb; lab?: Rgb; alpha: number } {
  const rgb = token.match(/rgba?\(([^)]+)\)/)
  if (rgb) {
    const parts = rgb[1].split(/[,\s/]+/).filter(Boolean)
    const triple = parts.slice(0, 3).map(Number) as Rgb
    let alpha = 1
    if (parts.length > 3) alpha = withPercent(parts[3])
    return { rgb: triple, alpha }
  }
  const ok = token.match(/oklab\(\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)(?:\s*\/\s*([\d.]+)%?)?\s*\)/)
  if (ok) {
    return {
      lab: [Number(ok[1]), Number(ok[2]), Number(ok[3])],
      alpha: ok[4] === undefined ? 1 : withPercent(ok[4]),
    }
  }
  const okch = token.match(/oklch\(\s*([\d.]+)(%)?\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)%?)?\s*\)/)
  if (!okch) throw new Error(`format warna tak dikenal: ${token}`)
  const l = okch[2] === '%' ? Number(okch[1]) / 100 : Number(okch[1])
  const c = Number(okch[3])
  const h = (Number(okch[4]) * Math.PI) / 180
  return {
    lab: [l, c * Math.cos(h), c * Math.sin(h)],
    alpha: okch[5] === undefined ? 1 : withPercent(okch[5]),
  }
}

export function labToRgb(l: number, a: number, b: number): Rgb {
  const cube = (x: number): number => x * x * x
  const lp = cube(l + 0.3963377774 * a + 0.2158037573 * b)
  const mp = cube(l - 0.1055613458 * a - 0.0638541728 * b)
  const sp = cube(l - 0.0894841775 * a - 1.291485548 * b)
  const lin: Rgb = [
    4.0767416621 * lp - 3.3077115913 * mp + 0.2309699292 * sp,
    -1.2684380046 * lp + 2.6097574011 * mp - 0.3413193965 * sp,
    -0.0041960863 * lp - 0.7034186147 * mp + 1.707614701 * sp,
  ]
  return lin.map((v) => {
    const clamped = Math.min(1, Math.max(0, v))
    const g = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055
    return Math.round(g * 255)
  }) as Rgb
}

export function resolveTriple(parsed: { rgb?: Rgb; lab?: Rgb }): Rgb {
  if (parsed.lab) return labToRgb(parsed.lab[0], parsed.lab[1], parsed.lab[2])
  return (parsed.rgb ?? [0, 0, 0]).map((v) => Math.round(v)) as Rgb
}

/** Triple sRGB dari sebuah nilai CSS (lapis opak pertama). */
export function toRgbTriple(serialized: string): Rgb {
  for (const t of colorTokens(serialized)) {
    const p = parseColor(t)
    if (p.alpha !== 0) return resolveTriple(p)
  }
  throw new Error(`tidak ada warna opak di: ${serialized}`)
}

export function compositeOver(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  return fg.map((v, i) => Math.round(v * alpha + bg[i] * (1 - alpha))) as Rgb
}

export function hexTriple(hex: string): Rgb {
  const s = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)) as Rgb
}

export function luminance([r, g, b]: Rgb): number {
  const lin = (c: number): number => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function ratioOf(a: Rgb, b: Rgb): number {
  const x = luminance(a)
  const y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
