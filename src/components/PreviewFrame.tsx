import { memo, useMemo, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { withPreviewAnchorFix } from '@/lib/preview-anchors'
import { Monitor, Smartphone } from 'lucide-react'

export type PreviewWidth = 'mobile' | 'desktop'

const WIDTHS: Record<PreviewWidth, { px: string; label: string; icon: React.ReactNode }> = {
  mobile: { px: '375px', label: 'Mobile', icon: <Smartphone className="size-4" /> },
  desktop: { px: '100%', label: 'Desktop', icon: <Monitor className="size-4" /> },
}

interface PreviewFrameProps {
  html: string
  versionNumber: number | null
  /** Jika true, HTML masih dalam proses streaming (versi progresif) */
  streaming?: boolean
}

/**
 * Pratinjau website hasil AI.
 * KEAMANAN: HTML adalah konten tidak tepercaya. Render HANYA di <iframe>
 * dengan sandbox PERSIS "allow-scripts allow-popups" (TANPA allow-same-origin).
 * Jangan pernah menyisipkan html ke DOM aplikasi (innerHTML/dangerouslySetInnerHTML).
 *
 * Dibungkus memo: Workspace me-render ulang tiap detik (timer elapsed /
 * countdown 429) dan tiap flush progres SSE; tanpa memo, iframe ikut
 * di-render ulang padahal `html` tidak berubah.
 *
 * Jika `streaming` (versi progresif), sisipkan style penekan animasi/transisi
 * supaya .rise tidak diputar ulang dan elemen tidak berkedip saat buffer berganti.
 */
function insertProgressiveMotionKill(html: string): string {
  const progressiveStyle =
    '<style data-pakhir-progressive>*{animation:none!important;transition:none!important}</style>'
  const lower = html.toLowerCase()
  const headCloseIdx = lower.indexOf('</head>')
  if (headCloseIdx >= 0) {
    return html.slice(0, headCloseIdx) + progressiveStyle + html.slice(headCloseIdx)
  }
  return html + progressiveStyle
}

export const PreviewFrame = memo(function PreviewFrame({
  html,
  versionNumber,
  streaming = false,
}: PreviewFrameProps) {
  const [width, setWidth] = useState<PreviewWidth>('desktop')
  // Render-only: tautan #fragmen digulir dalam iframe (tanpa ini iframe
  // menavigasi ke URL aplikasi). HTML tersimpan & unduhan TIDAK diubah.
  const srcDoc = useMemo(() => {
    let fixed = withPreviewAnchorFix(html)
    if (streaming) {
      fixed = insertProgressiveMotionKill(fixed)
    }
    return fixed
  }, [html, streaming])

  return (
    <div className="flex flex-col gap-stack h-full">
      <div className="flex items-center justify-between gap-stack-sm flex-wrap">
        <span className="text-hint text-muted-foreground">
          {versionNumber !== null ? `Pratinjau versi ${versionNumber}` : 'Pratinjau'}
        </span>
        <div className="flex items-center gap-stack-sm rounded-lg border border-border p-stack-sm" role="group" aria-label="Lebar pratinjau">
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
      <div className="flex-1 min-h-[420px] overflow-auto rounded-xl border border-border bg-white">
        <iframe
          title="Pratinjau website"
          sandbox="allow-scripts allow-popups"
          srcDoc={srcDoc}
          style={{ width: WIDTHS[width].px, maxWidth: '100%', height: '100%', minHeight: 420, border: 0, margin: '0 auto', display: 'block' }}
        />
      </div>
    </div>
  )
})
