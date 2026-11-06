import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api/projects'
import { streamProject } from '@/lib/api/sse'
import { getMockFetch } from '@/lib/mock-hook'
import { ApiError } from '@/lib/api/client'
import { canRetryError, getErrorMessage, isAlreadyGenerating, isUseReviseInstead } from '@/lib/api/errors'
import { takePendingImages } from '@/lib/pending-images'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/ui/container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/feedback/loading-state'
import { ErrorState } from '@/components/feedback/error-state'
import { EmptyState } from '@/components/feedback/empty-state'
import { PreviewFrame } from '@/components/PreviewFrame'
import { ImagePicker, type PickedImage } from '@/components/ImagePicker'
import { useDocumentTitle } from '@/hooks/use-document-title'
import type { ProjectStatus, Version } from '@/types/api'
import { Check, Copy, Download, History, Image as ImageIcon, RefreshCw, Square, Wand2 } from 'lucide-react'


export const Route = createFileRoute('/_app/projects/$projectId')({
  // Catatan: parseSearch bawaan TanStack me-JSON-parse nilai query, sehingga
  // "?autostart=1" tiba sebagai ANGKA 1 (bukan string '1'). Terima keduanya
  // agar tidak menjadi undefined (yang membuat router membuang query dari URL
  // saat full load — merusak autostart & redirect pasca-login).
  validateSearch: (search: Record<string, unknown>): { autostart?: string; withImages?: string } => ({
    autostart: search.autostart === '1' || search.autostart === 1 ? '1' : undefined,
    withImages: search.withImages === '1' || search.withImages === 1 ? '1' : undefined,
  }),
  component: WorkspacePage,
})

type StreamPhase = 'idle' | 'preparing' | 'streaming' | 'saving'

interface StreamUi {
  phase: StreamPhase
  kind: 'generate' | 'revise'
  startedAt: number
  tokenChars: number
  tokenTail: string
  firstTokenAt: number | null
}

const INITIAL_STREAM_UI: StreamUi = {
  phase: 'idle',
  kind: 'generate',
  startedAt: 0,
  tokenChars: 0,
  tokenTail: '',
  firstTokenAt: null,
}

const POLL_INTERVAL_MS = 4000
const POLL_TIMEOUT_MS = 5 * 60 * 1000

const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: 'Draf',
  generating: 'Membuat…',
  ready: 'Siap',
  failed: 'Gagal',
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

function AttachmentThumb({ projectId, attachmentId, fileName }: { projectId: string; attachmentId: string; fileName: string }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    projectsApi
      .attachmentBlobUrl(projectId, attachmentId)
      .then((u) => {
        if (cancelled) {
          URL.revokeObjectURL(u)
          return
        }
        objectUrl = u
        setUrl(u)
      })
      .catch(() => {
        // Tampilkan placeholder bila gagal dimuat.
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [projectId, attachmentId])
  if (!url) {
    return <div className="h-16 w-16 rounded-lg bg-muted" aria-label={`Memuat ${fileName}`} />
  }
  return <img src={url} alt={fileName} className="h-16 w-16 rounded-lg object-cover border border-border" />
}

function WorkspacePage() {
  const { projectId } = Route.useParams()
  const search = Route.useSearch()
  const queryClient = useQueryClient()

  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [streamUi, setStreamUi] = useState<StreamUi>(INITIAL_STREAM_UI)
  const [streamError, setStreamError] = useState<ApiError | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [pollExpired, setPollExpired] = useState(false)
  const [exportingVersion, setExportingVersion] = useState<number | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [copyNotice, setCopyNotice] = useState<string | null>(null)

  // Panel revisi

  const [instruction, setInstruction] = useState('')
  const [baseVersion, setBaseVersion] = useState<string>('latest')
  const [reviseImages, setReviseImages] = useState<PickedImage[]>([])
  const focusInstruction = () => {
    document.getElementById('instruction')?.focus()
  }

  const abortRef = useRef<AbortController | null>(null)
  const tokenBufferRef = useRef('')
  const autostartedRef = useRef(false)
  const pollStartRef = useRef<number | null>(null)

  const streaming = streamUi.phase !== 'idle'

  // ── Queries ──
  const detailQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'generating' && !streaming && !pollExpired) return POLL_INTERVAL_MS
      return false
    },
  })

  const versionsQuery = useQuery({
    queryKey: ['versions', projectId],
    queryFn: () => projectsApi.listVersions(projectId),
  })

  const attachmentsQuery = useQuery({
    queryKey: ['attachments', projectId],
    queryFn: () => projectsApi.listAttachments(projectId),
  })

  const detail = detailQuery.data ?? null
  const versions = versionsQuery.data ?? []
  const latestNumber = versions.length > 0 ? versions[0].version_number : null
  useDocumentTitle(detail ? `${detail.title} | Nusa AI` : 'Workspace | Nusa AI')

  // HTML versi yang dipilih: cache react-query per nomor versi.
  const effectiveVersion = selectedVersion ?? latestNumber
  const isLatestSelected = effectiveVersion === null || effectiveVersion === detail?.latest_version?.version_number
  const explicitVersionQuery = useQuery({
    queryKey: ['version', projectId, effectiveVersion],
    queryFn: () =>
      effectiveVersion !== null ? projectsApi.getVersion(projectId, effectiveVersion) : Promise.resolve(null),
    enabled: effectiveVersion !== null && !isLatestSelected,
    staleTime: Infinity,
  })

  const displayVersion: Version | null =
    (isLatestSelected ? detail?.latest_version : (explicitVersionQuery.data as Version | null)) ??
    null
  const displayHtml = displayVersion?.html ?? null

  // ── Timer (elapsed + countdown 429) ──
  useEffect(() => {
    if (!streaming && rateLimitedUntil === null) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [streaming, rateLimitedUntil])

  // Reset hitung mundur 429 saat waktunya habis.
  useEffect(() => {
    if (rateLimitedUntil !== null && now >= rateLimitedUntil) setRateLimitedUntil(null)
  }, [now, rateLimitedUntil])

  // Batas polling saat generating tanpa stream lokal.
  useEffect(() => {
    if (detail?.status === 'generating' && !streaming) {
      if (pollStartRef.current === null) pollStartRef.current = Date.now()
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) setPollExpired(true)
    } else {
      pollStartRef.current = null
      setPollExpired(false)
    }
  }, [detail?.status, streaming])

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    queryClient.invalidateQueries({ queryKey: ['versions', projectId] })
    queryClient.invalidateQueries({ queryKey: ['attachments', projectId] })
  }, [queryClient, projectId])

  // ── Konfirmasi sebelum pergi saat stream aktif ──
  useEffect(() => {
    if (!streaming) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [streaming])

  // ── Inti stream ──
  const runStream = useCallback(
    async (kind: 'generate' | 'revise', opts: { jsonBody: Record<string, unknown>; images: File[]; baseVersion?: number }) => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      tokenBufferRef.current = ''
      setStreamError(null)
      setNotice(null)
      setStreamUi({ phase: 'preparing', kind, startedAt: Date.now(), tokenChars: 0, tokenTail: '', firstTokenAt: null })

      // Ekor progres di-throttle (±10x/detik, maks ~40 baris / 4 KB).
      const tailTimer = setInterval(() => {
        const buf = tokenBufferRef.current
        const tail = buf.slice(-4096)
        const lines = tail.split('\n')
        const trimmed = lines.slice(-40).join('\n')
        setStreamUi((prev) =>
          prev.phase === 'idle'
            ? prev
            : { ...prev, tokenChars: buf.length, tokenTail: trimmed },
        )
      }, 100)

      try {
        const fetchFn = await getMockFetch()
        const done = await streamProject({
          projectId,
          kind,
          jsonBody: opts.jsonBody,
          images: opts.images,
          baseVersion: opts.baseVersion,
          signal: ctrl.signal,
          fetchFn,
          onToken: (token) => {
            tokenBufferRef.current += token
            setStreamUi((prev) =>
              prev.phase === 'preparing'
                ? { ...prev, phase: 'streaming', firstTokenAt: Date.now() }
                : prev,
            )
          },
        })
        clearInterval(tailTimer)
        setStreamUi((prev) => ({ ...prev, phase: 'saving' }))
        // HTML final SELALU dari GET /versions/{n} setelah done.
        const version = await projectsApi.getVersion(projectId, done.version_number)
        queryClient.setQueryData(['version', projectId, done.version_number], version)
        setSelectedVersion(done.version_number)
        refreshAll()
        setStreamUi(INITIAL_STREAM_UI)
        setNotice(`Versi ${done.version_number} berhasil disimpan.`)
      } catch (err) {
        clearInterval(tailTimer)
        if (err instanceof DOMException && err.name === 'AbortError') {
          // Batal oleh user: BUKAN kegagalan AI.
          setStreamUi(INITIAL_STREAM_UI)
          setNotice('Dibatalkan. Memuat status terbaru…')
          refreshAll()
          return
        }
        if (err instanceof ApiError) {
          if (err.status === 429) {
            setRateLimitedUntil(Date.now() + (err.retryAfter ?? 60) * 1000)
          }
          if (isAlreadyGenerating(err)) {
            setNotice('Proses AI sedang berjalan untuk project ini. Menunggu hingga selesai…')
            refreshAll()
            setStreamUi(INITIAL_STREAM_UI)
            return
          }
          if (isUseReviseInstead(err)) {
            setNotice('Project ini sudah punya versi. Beralih ke mode revisi.')
            setStreamUi(INITIAL_STREAM_UI)
            focusInstruction()
            return
          }
          setStreamError(err)
        } else {
          setStreamError(
            new ApiError(0, 'Terjadi kesalahan tak terduga.', 'INTERNAL_SERVER_ERROR'),
          )
        }
        setStreamUi(INITIAL_STREAM_UI)
        refreshAll()
      } finally {
        abortRef.current = null
      }
    },
    [projectId, queryClient, refreshAll],
  )

  const startGenerate = useCallback(
    (images: File[]) => runStream('generate', { jsonBody: {}, images }),
    [runStream],
  )

  const startRevise = useCallback(() => {
    const text = instruction.trim()
    if (!text) {
      setStreamError(new ApiError(400, 'Instruksi revisi wajib diisi.', 'VALIDATION_ERROR'))
      return
    }
    const jsonBody: Record<string, unknown> = { instruction: text }
    let base: number | undefined
    if (baseVersion !== 'latest') {
      base = parseInt(baseVersion, 10)
      if (Number.isNaN(base) || base < 1) {
        setStreamError(new ApiError(400, 'Versi dasar tidak valid.', 'VALIDATION_ERROR'))
        return
      }
      jsonBody.base_version = base
    }
    void runStream('revise', {
      jsonBody,
      images: reviseImages.map((img) => img.file),
      baseVersion: base,
    })
  }, [instruction, baseVersion, reviseImages, runStream])

  const cancelStream = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  // ── Autostart setelah POST /projects ──
  useEffect(() => {
    if (autostartedRef.current) return
    if (!detail || search.autostart !== '1') return
    if (detail.status !== 'draft' && detail.status !== 'failed') return
    if (streaming) return
    autostartedRef.current = true
    const pending = takePendingImages(projectId)
    if (search.withImages === '1' && (!pending || pending.length === 0)) {
      setNotice(
        'Gambar referensi tidak terbawa (halaman dimuat ulang). Pilih ulang gambar bila perlu, lalu tekan "Buat Website".',
      )
      return
    }
    void startGenerate(pending ?? [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.id, detail?.status])

  const handleExport = async (versionNumber?: number) => {
    const target = versionNumber ?? undefined
    setExportingVersion(target ?? -1)
    try {
      const fetchFn = await getMockFetch()
      const { blob, filename } = await projectsApi.exportHtml(projectId, target, fetchFn)
      downloadBlob(blob, filename)
    } catch (err) {
      setNotice(getErrorMessage(err))
    } finally {
      setExportingVersion(null)
    }
  }

  const handleCopyHtml = async () => {
    if (!displayHtml) return
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(displayHtml)
      } else {
        throw new Error('Clipboard API tidak tersedia')
      }
      setCopySuccess(true)
      setCopyNotice('HTML berhasil disalin ke clipboard.')
      setTimeout(() => {
        setCopySuccess(false)
        setCopyNotice(null)
      }, 2500)
    } catch {
      setCopyNotice('Gagal menyalin HTML ke clipboard. Silakan coba lagi atau salin secara manual.')

      setTimeout(() => setCopyNotice(null), 5000)
    }
  }

  // ── Render ──
  if (detailQuery.isLoading) {
    return (
      <Container className="py-page max-w-6xl">
        <LoadingState label="Memuat project…" />
      </Container>
    )
  }

  if (detailQuery.isError || !detail) {
    return (
      <Container className="py-page max-w-6xl">
        <ErrorState
          title="Gagal memuat project"
          description={getErrorMessage(detailQuery.error)}
          onRetry={() => detailQuery.refetch()}
        />
      </Container>
    )
  }

  const busy = detail.status === 'generating' || streaming
  const rateWait = rateLimitedUntil !== null ? Math.max(0, Math.ceil((rateLimitedUntil - now) / 1000)) : 0
  const rateLimited = rateWait > 0

  const elapsedSec = streaming ? Math.floor((now - streamUi.startedAt) / 1000) : 0

  return (
    // Spas lega hanya pada panel kontrol & riwayat versi (kolom kiri);
    // area pratinjau (kolom kanan) tidak dikecilkan.
    <Container className="py-page max-w-6xl">
      <div className="flex items-center justify-between gap-stack flex-wrap mb-header">
        <div className="min-w-0">
          <Link to="/projects" className="ctl inline-flex min-h-control-min items-center text-hint text-muted-foreground hover:text-foreground">
            &larr; Project Saya
          </Link>
          <div className="flex items-center gap-stack-sm mt-stack-sm">
            <h1 className="text-title font-bold tracking-tight truncate">{detail.title}</h1>
            <Badge variant={detail.status === 'ready' ? 'success' : detail.status === 'failed' ? 'destructive' : detail.status === 'generating' ? 'warning' : 'secondary'}>
              {STATUS_LABEL[detail.status]}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-stack-sm">
          {detail.status === 'ready' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleCopyHtml()}
                disabled={!displayHtml || streaming}
              >
                {copySuccess ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copySuccess ? 'Tersalin' : 'Salin HTML'}
              </Button>
              <Button size="sm" onClick={() => handleExport()} disabled={exportingVersion !== null || streaming}>
                <Download className="size-3.5" /> Unduh
              </Button>
            </>
          )}
        </div>
      </div>

      {notice && (
        <div role="status" className="mb-section-sm rounded-lg bg-primary/10 border border-primary/20 p-control text-control">
          {notice}
        </div>
      )}

      {copyNotice && (
        <div role="status" aria-live="polite" className="mb-section-sm rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-control text-control text-emerald-700 dark:text-emerald-400">
          {copyNotice}
        </div>
      )}

      {rateLimited && (
        <div role="alert" className="mb-section-sm rounded-lg bg-amber-500/10 border border-amber-500/20 p-control text-control">
          Terlalu banyak permintaan. Tombol aktif lagi dalam {rateWait} detik. Permintaan generate tidak diulang otomatis agar tidak menghabiskan kuota.
        </div>
      )}

      {streamError && (
        <div role="alert" className="mb-section-sm rounded-lg bg-destructive/10 border border-destructive/20 p-control text-control text-red-700 dark:text-destructive flex items-center justify-between gap-stack flex-wrap">
          <div>
            <p className="font-semibold">{getErrorMessage(streamError)}</p>
            {canRetryError(streamError) && (
              <p className="mt-stack-sm text-muted-foreground">
                Tekan “Coba lagi” untuk mengulang proses.
              </p>
            )}
          </div>
          {canRetryError(streamError) && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy || rateLimited}
              onClick={() => {
                setStreamError(null)
                if (versions.length === 0 || detail?.status === 'failed' || detail?.status === 'draft') {
                  void startGenerate([])
                } else {
                  startRevise()
                }
              }}
            >
              <RefreshCw className="size-3.5" /> Coba Lagi
            </Button>
          )}
        </div>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-5 gap-section-sm">
        {/* Kolom kiri: aksi + progres + revisi (spas lega di sini) */}
        <div className="lg:col-span-2 space-y-section-sm">
          {/* Aksi generate */}
          {(detail.status === 'draft' || detail.status === 'failed') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-control">
                  {detail.status === 'failed' ? 'Generate Gagal: Coba Lagi' : 'Buat Website'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-stack">
                <p className="max-w-prose text-control text-muted-foreground">
                  Brief: {detail.brief?.description ?? 'Deskripsi belum diisi'}
                </p>
                <Button
                  className="w-full"
                  disabled={busy || rateLimited}
                  onClick={() => void startGenerate([])}
                >
                  <Wand2 className="size-4" />
                  {detail.status === 'failed' ? 'Coba Lagi' : 'Buat Website'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Progres stream */}
          {streaming && (
            <Card aria-busy="true">
              <CardHeader>
                {/* aria-live hanya pada judul fase (jarang berubah), BUKAN
                    pada ekor token yang diperbarui ~10x/detik. */}
                <CardTitle className="text-control" aria-live="polite" aria-atomic="true">
                  {streamUi.phase === 'preparing' && `Menyiapkan AI… (${elapsedSec} dtk)`}
                  {streamUi.phase === 'streaming' && 'AI sedang menulis…'}
                  {streamUi.phase === 'saving' && 'Menyimpan versi…'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-stack">
                {streamUi.phase === 'preparing' && (
                  <p className="max-w-prose text-control text-muted-foreground">
                    Jeda puluhan detik sebelum tulisan pertama muncul adalah hal normal saat layanan AI sibuk. Mohon tunggu.
                  </p>
                )}
                {streamUi.phase !== 'preparing' && (
                  <>
                    <p className="text-control text-muted-foreground">
                      {streamUi.tokenChars} karakter diterima
                    </p>
                    {/* Teks biasa (node teks), BUKAN render HTML. */}
                    <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-control text-hint whitespace-pre-wrap break-all">
                      {streamUi.tokenTail}
                    </pre>
                  </>
                )}
                <Button variant="outline" size="sm" className="w-full" onClick={cancelStream}>
                  <Square className="size-3.5" /> Batalkan
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Generating tanpa stream lokal → polling */}
          {detail.status === 'generating' && !streaming && (
            <Card>
              <CardContent className="pt-panel space-y-stack text-center">
                <LoadingState label="Sedang diproses…" />
                <p className="max-w-prose text-control text-muted-foreground">
                  Mengecek status otomatis tiap beberapa detik.
                  {pollExpired && ' Pengecekan otomatis berhenti. Muat ulang halaman ini.'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Panel revisi */}
          {detail.status === 'ready' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-control">Revisi Website</CardTitle>
              </CardHeader>
              <CardContent className="space-y-field">
                <div className="space-y-label">
                  <div className="flex items-center justify-between gap-stack-sm">
                    <Label htmlFor="instruction">Instruksi Revisi *</Label>
                    <span className="text-hint text-muted-foreground">
                      {instruction.trim().length}/4000
                    </span>
                  </div>
                  <Textarea
                    id="instruction"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="cth. Ganti warna hero menjadi biru tua dan tambahkan bagian testimoni"
                    rows={4}
                    maxLength={4000}
                    disabled={busy || rateLimited}
                  />
                </div>
                <div className="space-y-label">
                  <Label htmlFor="base_version">Dasar Revisi</Label>
                  <Select
                    id="base_version"
                    value={baseVersion}
                    onChange={(e) => setBaseVersion(e.target.value)}
                    disabled={busy || rateLimited}
                  >
                    <option value="latest">
                      Versi terbaru{latestNumber !== null ? ` (v${latestNumber})` : ''}
                    </option>
                    {versions.map((v) => (
                      <option key={v.id} value={String(v.version_number)}>
                        Versi {v.version_number} ({v.kind})
                      </option>
                    ))}
                  </Select>
                </div>
                <ImagePicker images={reviseImages} onChange={setReviseImages} disabled={busy || rateLimited} />
                <Button
                  className="w-full"
                  disabled={busy || rateLimited || instruction.trim().length === 0}
                  onClick={startRevise}
                >
                  <Wand2 className="size-4" /> Kirim Revisi
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Riwayat versi */}
          <Card>
            <CardHeader>
              <CardTitle className="text-control flex items-center gap-stack-sm">
                <History className="size-4" /> Riwayat Versi ({versions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {versionsQuery.isLoading && <LoadingState label="Memuat versi…" />}
              {versionsQuery.isError && (
                <p className="text-hint text-destructive">{getErrorMessage(versionsQuery.error)}</p>
              )}
              {!versionsQuery.isLoading && !versionsQuery.isError && versions.length === 0 && (
                <p className="text-control text-muted-foreground">Belum ada versi.</p>
              )}
              <ul className="space-y-stack">
                {versions.map((v) => {
                  const active = effectiveVersion === v.version_number
                  return (
                    <li
                      key={v.id}
                      className={`rounded-lg border p-control text-hint ${active ? 'border-primary/50 bg-primary/5' : 'border-border'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">
                          Versi {v.version_number}{' '}
                          <Badge variant={v.kind === 'generate' ? 'default' : 'secondary'}>
                            {v.kind === 'generate' ? 'buat' : 'revisi'}
                          </Badge>
                        </span>
                        {active && <span className="text-primary font-semibold">ditampilkan</span>}
                      </div>
                      {/* zinc-600 di terang (bukan muted) agar kontras >= 4.5:1
                          di atas tint bg-primary/5 pada item aktif (temuan axe). */}
                      <p className="mt-stack-sm line-clamp-2 text-control text-zinc-600 dark:text-muted-foreground">{v.prompt}</p>
                      <div className="mt-stack flex flex-wrap gap-stack-sm">
                        {!active && (
                          <Button size="sm" variant="outline" onClick={() => setSelectedVersion(v.version_number)}>
                            Lihat
                          </Button>
                        )}
                        {detail.status === 'ready' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy || rateLimited}
                            onClick={() => {
                              setBaseVersion(String(v.version_number))
                              setSelectedVersion(v.version_number)
                              focusInstruction()
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                          >
                            Revisi dari versi ini
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={exportingVersion !== null}
                          onClick={() => void handleExport(v.version_number)}
                        >
                          <Download className="size-3.5" /> Unduh
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-control flex items-center gap-stack-sm">
                <ImageIcon className="size-4" /> Gambar Referensi ({attachmentsQuery.data?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attachmentsQuery.isLoading && <LoadingState label="Memuat gambar…" />}
              {!attachmentsQuery.isLoading && (attachmentsQuery.data?.length ?? 0) === 0 && (
                <p className="text-control text-muted-foreground">Belum ada gambar referensi.</p>
              )}
              <ul className="grid grid-cols-4 gap-stack-sm">
                {(attachmentsQuery.data ?? []).map((att) => (
                  <li key={att.id} title={`${att.file_name} (${Math.round(att.file_size / 1024)} KB)`}>
                    <AttachmentThumb projectId={projectId} attachmentId={att.id} fileName={att.file_name} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Kolom kanan: preview */}
        <div className={`lg:col-span-3 min-h-[480px]${displayHtml ? ' order-first lg:order-none' : ''}`}>
          {displayHtml ? (
            <PreviewFrame html={displayHtml} versionNumber={displayVersion?.version_number ?? null} />
          ) : (
            <EmptyState
              title={detail.status === 'ready' ? 'Memuat pratinjau…' : 'Belum ada website'}
              description={
                detail.status === 'ready'
                  ? 'Pratinjau sedang disiapkan.'
                  : 'Tekan "Buat Website" untuk meminta AI membuatkan website dari brief.'
              }
            />
          )}
        </div>
      </div>
    </Container>
  )
}
