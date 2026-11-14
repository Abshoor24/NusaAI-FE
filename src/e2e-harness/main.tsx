import { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/index.css'
import { PreviewFrame } from '@/components/PreviewFrame'

type Phase = 'idle' | 'preparing' | 'streaming' | 'saving'

const params = new URLSearchParams(location.search)
const SSE_URL = params.get('sseUrl') ?? 'http://127.0.0.1:4328/sse'
const RETRY_URL = params.get('retryUrl')

// ── Instrumentasi (module scope; TIDAK di-reset per render) ──
interface FrameChange {
  time: number
  idx: string
  visible: boolean
}
interface RiseEvent {
  time: number
  name: string
}
const frameChanges: FrameChange[] = []
const riseEvents: RiseEvent[] = []
let phaseValue: Phase = 'preparing'

;(window as any).__frameChanges = frameChanges
;(window as any).__riseEvents = riseEvents
;(window as any).__scrollY = 0
;(window as any).__errored = false
;(window as any).__phase = phaseValue
function Harness() {
  const [phase, setPhase] = useState<Phase>('preparing')
  phaseValue = phase
  ;(window as any).__phase = phase
  const [html, setHtml] = useState('')
  const [finalHtml, setFinalHtml] = useState<string | null>(null)
  const [incomplete, setIncomplete] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const esRef = useRef<EventSource | null>(null)
  const acc = useRef('')
  const startedAtRef = useRef<number | null>(null)

  const streaming = phase !== 'idle'

  // Penghitung "N dtk" saat menunggu token pertama (mirip halaman asli).
  useEffect(() => {
    if (phase !== 'preparing') return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [phase])

  // ── Listener postMessage dari iframe (scroll + rise) ──
  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      if (ev.data?.type === 'pakhir-scroll') {
        ;(window as any).__scrollY = typeof ev.data.y === 'number' ? ev.data.y : 0
        ;(window as any).__atBottom = Boolean(ev.data.atBottom)
      }
      if (ev.data?.type === 'pakhir-rise') {
        riseEvents.push({ time: Date.now(), name: ev.data.name })
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // ── MutationObserver: catat pergantian buffer (iframe style attr) ──
  useEffect(() => {
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'attributes' && m.attributeName === 'style') {
          const el = m.target as HTMLElement
          if (el.tagName !== 'IFRAME') continue
          const visible = el.style.display !== 'none'
          frameChanges.push({
            time: Date.now(),
            idx: el.getAttribute('data-idx') ?? '',
            visible,
          })
        }
      }
    })
    if (document.body) {
      obs.observe(document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ['style'],
      })
    }
    return () => obs.disconnect()
  }, [])

  const startStream = useCallback(
    (url: string) => {
      esRef.current?.close()
      acc.current = ''
      setHtml('')
      setFinalHtml(null)
      setIncomplete(false)
      setErrorText(null)
      setPhase('preparing')
      startedAtRef.current = Date.now()
      ;(window as any).__errored = false

      const es = new EventSource(url)
      esRef.current = es

      es.addEventListener('token', (ev: MessageEvent) => {
        try {
          const d = JSON.parse(ev.data)
          acc.current += d.token || ''
        } catch {
          acc.current += ev.data || ''
        }
        setHtml(acc.current)
        setPhase('streaming')
      })

      es.addEventListener('done', (ev: MessageEvent) => {
        let htmlDone = acc.current
        try {
          const d = JSON.parse(ev.data)
          htmlDone = d.html ?? acc.current
        } catch {}
        es.close()
        esRef.current = null
        setPhase('saving')
        setFinalHtml(htmlDone)
        ;(window as any).__doneHtml = htmlDone
      })

      es.addEventListener('error', (ev: MessageEvent) => {
        let msg = 'Terjadi gangguan saat menulis. Pratinjau belum selesai.'
        try {
          const d = JSON.parse(ev.data)
          if (d?.error?.message) msg = d.error.message
          else if (d?.message) msg = d.message
        } catch {}
        es.close()
        esRef.current = null
        setErrorText(msg)
        setPhase('idle')
        setIncomplete(true)
        ;(window as any).__errored = true
      })

      es.onerror = () => {
        if (esRef.current === null) return // sudah ditutup (mis. setelah done)
        const msg = 'Koneksi AI terputus. Pratinjau setengah jadi.'
        es.close()
        esRef.current = null
        setErrorText(msg)
        setPhase('idle')
        setIncomplete(true)
        ;(window as any).__errored = true
      }
    },
    [],
  )

  useEffect(() => {
    startStream(SSE_URL)
    return () => esRef.current?.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const retry = useCallback(() => {
    startStream(RETRY_URL ?? SSE_URL)
  }, [RETRY_URL, SSE_URL, startStream])

  const elapsed = Math.max(
    0,
    Math.floor((now - (startedAtRef.current ?? now)) / 1000),
  )
  const statusText =
    phase === 'preparing' ? `Menyiapkan rancangan… (${elapsed} dtk)` :
    phase === 'streaming' ? `Menyusun halaman… (${html.length} karakter)` :
    phase === 'saving' ? 'Merapikan…' : incomplete ? 'Belum selesai' : '—'

  return (
    <>
      <div id="status-bar">
        <span id="status-text">{statusText}</span>
        <span id="char-count">{html.length} karakter diterima</span>
      </div>
      {incomplete && <div id="incomplete-label">Belum selesai</div>}
      {errorText && (
        <div id="error-box">
          <span id="error-text">{errorText}</span>
          <button id="retry-btn" onClick={retry}>
            Coba lagi
          </button>
        </div>
      )}
      {finalHtml ? (
        <PreviewFrame html={finalHtml} versionNumber={1} />
      ) : (
        <PreviewFrame
          html={html}
          versionNumber={null}
          streaming={streaming}
          incomplete={incomplete}
          loading={streaming && html.length === 0}
        />
      )}
    </>
  )
}

createRoot(document.getElementById('root')!).render(<Harness />)
