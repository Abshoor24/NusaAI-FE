import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { withPreviewAnchorFix } from '@/lib/preview-anchors'
import { buildProgressiveHtml } from '@/lib/streaming-html'
import type { ScrollSnapshot } from '@/lib/streaming-html'
import { Monitor, Smartphone } from 'lucide-react'

export type PreviewWidth = 'mobile' | 'desktop'

const WIDTHS: Record<PreviewWidth, { px: string; label: string; icon: React.ReactNode }> = {
  mobile: { px: '375px', label: 'Mobile', icon: <Smartphone className="size-4" /> },
  desktop: { px: '100%', label: 'Desktop', icon: <Monitor className="size-4" /> },
}

/** Throttle minimum antar-pembaruan buffer (ms). */
const THROTTLE_MS = 800

interface PreviewFrameProps {
  html: string
  versionNumber: number | null
  /** Jika true, HTML masih dalam proses streaming (versi progresif) */
  streaming?: boolean
  /** Jika true, streaming berakhir tidak lengkap (error/abort) */
  incomplete?: boolean
  /** Jika true, tampilkan placeholder loading (generate baru, belum ada HTML) */
  loading?: boolean
}

/**
 * Pratinjau website hasil AI.
 *
 * KEAMANAN: HTML adalah konten tidak tepercaya. Render HANYA di <iframe>
 * dengan sandbox PERSIS "allow-scripts allow-popups" (TANPA allow-same-origin).
 * Jangan pernah menyisipkan html ke DOM aplikasi (innerHTML/dangerouslySetInnerHTML).
 *
 * Dibungkus memo: Workspace me-render ulang tiap detik (timer elapsed /
 * countdown 429) dan tiap flush progres SSE; tanpa memo, iframe ikut
 * di-render ulang padahal `html` tidak berubah.
 *
 * Versi progresif (streaming=true):
 * - Double buffer: dua iframe bergantian. Buffer baru ditampilkan hanya
 *   setelah event load-nya, menghindari kilatan putih.
 * - Throttle 800 ms: hanya satu pembaruan tiap 800 ms saat streaming.
 * - Scroll dipertahankan: iframe melapor posisi ke induk lewat postMessage;
 *   induk menyisipkan posisi ke buffer berikutnya.
 * - Motion kill: animasi/transisi dimatikan pada versi progresif.
 * - .reveal terlihat: karena skrip class "js" dibuang, .js .reveal{opacity:0}
 *   tidak aktif; elemen reveal langsung terlihat.
 *
 * Jalur non-streaming (render final) TIDAK berubah perilakunya.
 */
export const PreviewFrame = memo(function PreviewFrame({
  html,
  versionNumber,
  streaming = false,
  incomplete = false,
  loading = false,
}: PreviewFrameProps) {
  const [width, setWidth] = useState<PreviewWidth>('desktop')

  // ── State yang memicu re-render ──
  const [shownFirst, setShownFirst] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)

  // ── Refs internal streaming (tidak memicu re-render) ──
  const iframeARef = useRef<HTMLIFrameElement | null>(null)
  const iframeBRef = useRef<HTMLIFrameElement | null>(null)
  const scrollRef = useRef<ScrollSnapshot>({ y: 0, atBottom: false })
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestHtmlRef = useRef('')
  const streamingRef = useRef(streaming)
  const shownFirstRef = useRef(false)
  const activeIdxForPush = useRef(0)
  const swapCountRef = useRef(0)

  useEffect(() => {
    activeIdxForPush.current = activeIdx
  }, [activeIdx])

  // Expose swap counter for Playwright verification (module-free debug).
  useEffect(() => {
    ;(window as any).__swapCount = swapCountRef.current
  }, [activeIdx])

  // ── Pasang listener postMessage untuk scroll dari iframe ──
  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      const aWin = iframeARef.current?.contentWindow
      const bWin = iframeBRef.current?.contentWindow
      if (ev.source !== aWin && ev.source !== bWin) return
      if (ev.data?.type !== 'pakhir-scroll') return
      scrollRef.current = {
        y: typeof ev.data.y === 'number' ? ev.data.y : 0,
        atBottom: Boolean(ev.data.atBottom),
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // ── Core: push HTML ke buffer non-aktif ──
  const pushToBufferFn = useRef<((h: string) => void) | null>(null)
  useEffect(() => {
    pushToBufferFn.current = (htmlToPush: string) => {
      if (!streamingRef.current) return

      const docHtml = buildProgressiveHtml(
        htmlToPush,
        scrollRef.current,
        !shownFirstRef.current,
      )
      if (!docHtml) return

      const nextIdx = activeIdxForPush.current === 0 ? 1 : 0
      const target = nextIdx === 0 ? iframeARef.current : iframeBRef.current
      if (!target) return

      const onLoad = () => {
        target.removeEventListener('load', onLoad)
        if (!streamingRef.current) return
        swapCountRef.current += 1
        activeIdxForPush.current = nextIdx
        setActiveIdx(nextIdx)
        if (!shownFirstRef.current) {
          shownFirstRef.current = true
          setShownFirst(true)
        }
      }
      target.addEventListener('load', onLoad)
      target.setAttribute('srcdoc', docHtml)
    }
  }, [])

  // ── Efek streaming: throttle pembaruan ──
  useEffect(() => {
    streamingRef.current = streaming

    if (!streaming) {
      // Bersihkan timer saat streaming selesai (sukses/error/abort)
      if (throttleTimerRef.current !== null) {
        clearTimeout(throttleTimerRef.current)
        throttleTimerRef.current = null
      }
      return
    }

    latestHtmlRef.current = html

    if (html === '') {
      // Reset state saat generate baru dimulai
      shownFirstRef.current = false
      setShownFirst(false)
      activeIdxForPush.current = 0
      setActiveIdx(0)
      iframeARef.current?.setAttribute('srcdoc', '')
      iframeBRef.current?.setAttribute('srcdoc', '')
    }

    if (throttleTimerRef.current !== null) return

    throttleTimerRef.current = setTimeout(() => {
      throttleTimerRef.current = null
      pushToBufferFn.current?.(latestHtmlRef.current)
    }, THROTTLE_MS)
  }, [html, streaming])

  // Bersihkan saat unmount
  useEffect(() => {
    return () => {
      if (throttleTimerRef.current !== null) {
        clearTimeout(throttleTimerRef.current)
        throttleTimerRef.current = null
      }
    }
  }, [])

  // ── Render ──
  const progressiveActive = streaming || (incomplete && html.length > 0)
  const srcDoc = useMemo(() => {
    if (!html) return undefined
    return withPreviewAnchorFix(html)
  }, [html])

  const showPlaceholder = loading && !shownFirst && !html

  return (
    <div className="flex flex-col gap-stack h-full">
      <div className="flex items-center justify-between gap-stack-sm flex-wrap">
        <span className="text-hint text-muted-foreground">
          {versionNumber !== null ? `Pratinjau versi ${versionNumber}` : 'Pratinjau'}
          {streaming && ' · Menyusun halaman…'}
          {incomplete && (
            <span className="ml-2 text-amber-600 dark:text-amber-400">· Belum selesai</span>
          )}
        </span>
        <div
          className="flex items-center gap-stack-sm rounded-lg border border-border p-stack-sm"
          role="group"
          aria-label="Lebar pratinjau"
        >
          {(Object.keys(WIDTHS) as PreviewWidth[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setWidth(key)}
              title={WIDTHS[key].label}
              aria-label={`Pratinjau ${WIDTHS[key].label}`}
              aria-pressed={width === key}
              className={cn(
                'ctl flex min-h-control-min min-w-control-min items-center justify-center rounded-md px-stack-sm transition-colors md:min-h-0 md:min-w-0 md:p-1.5',
                width === key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {WIDTHS[key].icon}
            </button>
          ))}
        </div>
      </div>

      {showPlaceholder && (
        <div className="flex-1 min-h-[420px] flex items-center justify-center rounded-xl border border-border bg-muted">
          <div className="text-center space-y-stack">
            <div
              className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            <p className="text-control text-muted-foreground">Menyiapkan pratinjau…</p>
          </div>
        </div>
      )}

      {incomplete && !showPlaceholder && (
        <div
          role="status"
          className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-control text-control text-amber-700 dark:text-amber-400"
        >
          Pratinjau setengah jadi karena streaming terputus.
        </div>
      )}

      {/* Area pratinjau */}
      {!showPlaceholder && (
        <div className="flex-1 min-h-[420px] overflow-auto rounded-xl border border-border bg-white relative">
          {/* Versi non-streaming: iframe tunggal (final render) */}
          {!progressiveActive && (
            <iframe
              title="Pratinjau website"
              sandbox="allow-scripts allow-popups"
              srcDoc={srcDoc}
              style={{
                width: WIDTHS[width].px,
                maxWidth: '100%',
                height: '100%',
                minHeight: 420,
                border: 0,
                margin: '0 auto',
                display: 'block',
              }}
            />
          )}

          {/* Versi progresif: double buffer */}
          {progressiveActive && (
            <>
              <iframe
                ref={iframeARef}
                title="Pratinjau website"
                data-idx="0"
                sandbox="allow-scripts allow-popups"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: WIDTHS[width].px,
                  maxWidth: '100%',
                  height: '100%',
                  minHeight: 420,
                  border: 0,
                  margin: '0 auto',
                  display: activeIdx === 0 ? 'block' : 'none',
                }}
              />
              <iframe
                ref={iframeBRef}
                title="Pratinjau website"
                data-idx="1"
                sandbox="allow-scripts allow-popups"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: WIDTHS[width].px,
                  maxWidth: '100%',
                  height: '100%',
                  minHeight: 420,
                  border: 0,
                  margin: '0 auto',
                  display: activeIdx === 1 ? 'block' : 'none',
                }}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
})
