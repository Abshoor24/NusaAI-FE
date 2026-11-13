import { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/index.css'
import { PreviewFrame } from '@/components/PreviewFrame'

type Phase = 'idle' | 'preparing' | 'streaming' | 'saving'

const params = new URLSearchParams(location.search)
const SSE_URL = params.get('sseUrl') ?? 'http://127.0.0.1:4328/sse'
const RETRY_URL = params.get('retryUrl')

function elapsedSeconds(started: number | null): string {
  if (!started) return '0'
  return Math.floor((Date.now() - started) / 1000).toString()
}

function Harness() {
  const [phase, setPhase] = useState<Phase>('preparing')
  const [html, setHtml] = useState('')
  const [finalHtml, setFinalHtml] = useState<string | null>(null)
  const [incomplete, setIncomplete] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)
  const acc = useRef('')
  const startedAtRef = useRef<number | null>(null)

  const streaming = phase !== 'idle'

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
        ;(window as any).__phase = 'streaming'
        ;(window as any).__charCount = acc.current.length
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
        ;(window as any).__phase = 'saving'
        ;(window as any).__doneHtml = htmlDone
        ;(window as any).__charCount = htmlDone.length
      })

      es.addEventListener('error', (ev: MessageEvent) => {
        let msg = 'Terjadi gangguan saat menulis. Pratinjau belum selesai.'
        try {
          const d = JSON.parse(ev.data)
          if (d && d.message) msg = d.message
        } catch {}
        es.close()
        esRef.current = null
        setErrorText(msg)
        setPhase('idle')
        setIncomplete(true)
        ;(window as any).__phase = 'idle'
        ;(window as any).__incomplete = true
        ;(window as any).__errorText = msg
      })

      es.onerror = () => {
        if (esRef.current === null) return // sudah ditutup (mis. setelah done)
        const msg = 'Koneksi AI terputus. Pratinjau setengah jadi.'
        es.close()
        esRef.current = null
        setErrorText(msg)
        setPhase('idle')
        setIncomplete(true)
        ;(window as any).__phase = 'idle'
        ;(window as any).__incomplete = true
        ;(window as any).__errorText = msg
        ;(window as any).__errored = true
      }
    },
    [],
  )

  useEffect(() => {
    startStream(SSE_URL)
    ;(window as any).__phase = phase
    return () => esRef.current?.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const retry = useCallback(() => {
    startStream(RETRY_URL ?? SSE_URL)
  }, [RETRY_URL, SSE_URL, startStream])

  const statusText =
    phase === 'preparing' ? `Menyiapkan rancangan… (${elapsedSeconds(startedAtRef.current)} dtk)` :
    phase === 'streaming' ? `Menyusun halaman… (${html.length} dtk)` :
    phase === 'saving' ? 'Merapikan…' : incomplete ? 'Belum selesai' : '—'

  // Instrumentasi untuk verifikasi Playwright (diakses via window dari spec).
  ;(window as any).__phase = phase
  ;(window as any).__charCount = html.length
  ;(window as any).__incomplete = incomplete
  ;(window as any).__errorText = errorText
  ;(window as any).__errored = phase === 'idle' && !!errorText
  ;(window as any).__doneHtml = finalHtml
  ;(window as any).__frameChanges = []
  ;(window as any).__riseEvents = []

  // Deteksi pergantian buffer (iframe) via MutationObserver pada style atribut.
  const observerRef = useRef<MutationObserver | null>(null)
  useEffect(() => {
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'style') {
          const el = m.target as HTMLElement
          const visible = el.style.display !== 'none'
          ;(window as any).__frameChanges.push({
            time: Date.now(),
            visible,
            idx: el.getAttribute('data-idx') ?? '',
          })
        }
      }
    })
    observerRef.current = obs
    return () => obs.disconnect()
  }, [])

  // ── Pasang listener postMessage untuk scroll & rise dari iframe ──
  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      if (ev.data?.type === 'pakhir-scroll') {
        ;(window as any).__scrollY = typeof ev.data.y === 'number' ? ev.data.y : 0
        ;(window as any).__atBottom = Boolean(ev.data.atBottom)
      }
      if (ev.data?.type === 'pakhir-rise') {
        ;(window as any).__riseEvents = [
          ...((window as any).__riseEvents ?? []),
          { time: Date.now(), name: ev.data.name },
        ]
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  return (
    <>
      <div id="status-bar">
        <span id="status-text">{statusText}</span>
        <span id="char-count">{html.length} karakter diterima</span>
      </div>
      <div id="incomplete-label">{incomplete ? 'Belum selesai' : ''}</div>
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
