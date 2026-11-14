/**
 * Pembersihan HTML streaming untuk fitur pratinjau progresif.
 *
 * Kontrak:
 * 1. Buang fence markdown di awal (``` atau ```html).
 * 2. Pertahankan <script src="https://cdn.tailwindcss.com"> dan skrip inline
 *    yang memuat "tailwind.config" (keduanya di tempat aslinya).
 * 3. Buang SEMUA skrip inline lain, termasuk skrip penambah class "js" dan
 *    skrip yang belum tertutup. Tanpa class "js", aturan `.js .reveal{opacity:0}`
 *    tidak berlaku sehingga konten tidak tersembunyi selama streaming.
 * 4. Potong sampai karakter ">" lengkap terakhir (jangan render tag separuh).
 * 5. Tahan pembaruan pertama sampai <body> sudah terbuka (opsional).
 * 6. Sisipkan penekan animasi/transisi hanya pada versi progresif.
 */

const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi
const SCRIPT_OPEN_RE = /<script\b/gi

const MOTION_KILL =
  '<style data-pakhir-progressive>*{animation:none!important;transition:none!important}</style>'

const SCROLL_MARKER = 'data-pakhir-stream-scroll'

export interface ScrollSnapshot {
  y: number
  atBottom: boolean
}

function isAllowedScript(attrs: string, body: string): boolean {
  if (/src\s*=\s*["'][^"']*cdn\.tailwindcss\.com/i.test(attrs)) return true
  if (body.includes('tailwind.config')) return true
  return false
}

/** Buang semua <script> yang tidak diizinkan; sisa skrip yang belum tertutup dipotong. */
function stripDisallowedScripts(html: string): string {
  let out = html.replace(SCRIPT_RE, (match: string, attrs: string, body: string) => {
    return isAllowedScript(attrs, body) ? match : ''
  })

  // Skrip yang belum tertutup (streaming berhenti di tengah <script>): buang
  // dari tag pembuka sampai akhir.
  const completeRanges: Array<[number, number]> = []
  SCRIPT_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = SCRIPT_RE.exec(out)) !== null) {
    completeRanges.push([m.index, m.index + m[0].length])
  }

  SCRIPT_OPEN_RE.lastIndex = 0
  let cutAt = -1
  while ((m = SCRIPT_OPEN_RE.exec(out)) !== null) {
    const inside = completeRanges.some(([start, end]) => m!.index >= start && m!.index < end)
    if (!inside) {
      cutAt = m.index
      break
    }
  }
  if (cutAt >= 0) out = out.slice(0, cutAt)
  return out
}

/** Apakah tag <body> pembuka sudah lengkap (diakhiri ">"). */
export function hasStreamingBody(html: string): boolean {
  return /<body\b[^>]*>/i.test(html)
}

/**
 * Bersihkan potongan HTML streaming agar aman dirender di iframe progresif.
 *
 * @param html potongan HTML mentah dari event SSE "token"
 * @param waitForBody bila true, kembalikan string kosong sampai <body> terbuka
 */
export function sanitizeStreamingHtml(html: string, waitForBody = false): string {
  if (!html) return ''

  // 1. Fence markdown di awal (``` atau ```html), boleh didahului spasi.
  let out = html.replace(/^\s*```(?:html)?\s*/i, '')

  // 2-3. Skrip: hanya Tailwind CDN + tailwind.config yang bertahan.
  out = stripDisallowedScripts(out)

  // 4. Potong sampai ">" lengkap terakhir.
  const lastClose = out.lastIndexOf('>')
  if (lastClose === -1) return ''
  out = out.slice(0, lastClose + 1)

  // 5. Tahan sampai <body> terbuka.
  if (waitForBody && !hasStreamingBody(out)) return ''

  // 6. Penekan animasi/transisi (hanya versi progresif). Sisipkan setelah
  //    </head> bila ada; bila dokumen belum punya <head>/<body> (potongan
  //    fragmen murni), jangan tambahkan apa pun agar potongan tetap apa adanya.
  const lower = out.toLowerCase()
  const headCloseIdx = lower.indexOf('</head>')
  if (headCloseIdx >= 0) {
    out = out.slice(0, headCloseIdx) + MOTION_KILL + out.slice(headCloseIdx)
  } else if (lower.includes('<head') || lower.includes('<body')) {
    out += MOTION_KILL
  }

  return out
}

/**
 * Skrip kecil milik kita (bukan dari AI) untuk versi progresif:
 * melapor scrollY + status "di dasar halaman" ke induk lewat postMessage,
 * lalu memulihkan posisi terakhir setelah load. Berjalan di dalam iframe
 * ber-sandbox tanpa allow-same-origin, jadi induk tidak bisa membaca scroll
 * secara langsung.
 */
export function withStreamingScrollScript(html: string, snapshot: ScrollSnapshot): string {
  if (!html) return html
  const y = Number.isFinite(snapshot.y) && snapshot.y > 0 ? Math.round(snapshot.y) : 0
  const atBottom = snapshot.atBottom ? 'true' : 'false'
  const script =
    `<script ${SCROLL_MARKER}>(function(){` +
    `var KEY="pakhir-scroll";` +
    `function report(){try{var se=document.documentElement;` +
    `var bottom=(window.innerHeight+window.scrollY)>=(se.scrollHeight-2);` +
    `window.parent.postMessage({type:KEY,y:window.scrollY,atBottom:bottom},"*")}catch(e){}}` +
    `function restore(){try{if(${atBottom}){window.scrollTo(0,document.documentElement.scrollHeight)}` +
    `else if(${y}>0){window.scrollTo(0,${y})}}catch(e){}}` +
    `document.addEventListener("scroll",report,{passive:true});` +
    `window.addEventListener("load",function(){restore();report()});` +
    `setTimeout(function(){restore();report()},0);` +
    `setTimeout(function(){restore();report()},80);` +
    `window.addEventListener("animationstart",function(e){try{window.parent.postMessage({type:"pakhir-rise",name:e.animationName},"*")}catch(err){}});` +
    `})();</script>`

  const matches = [...html.matchAll(/<\/body\s*>/gi)]
  if (matches.length === 0) return html + script
  const last = matches[matches.length - 1]
  const idx = last.index ?? -1
  if (idx < 0) return html + script
  return html.slice(0, idx) + script + html.slice(idx)
}

/**
 * Gabungkan sanitasi + skrip scroll milik kita. Dipakai PreviewFrame untuk
 * srcDoc progresif. Non-streaming TIDAK memakai fungsi ini.
 */
export function buildProgressiveHtml(
  html: string,
  snapshot: ScrollSnapshot,
  waitForBody = true,
): string {
  const safe = sanitizeStreamingHtml(html, waitForBody)
  if (!safe) return ''
  return withStreamingScrollScript(safe, snapshot)
}
