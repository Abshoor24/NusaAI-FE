import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type ProjectsPagerProps = {
  page: number
  hasMore: boolean
  busy: boolean
  onPrev: () => void
  onNext: () => void
}

/**
 * Komponen pager navigasi halaman project (sebelumnya / berikutnya).
 * Murni presentasional dengan target sentuh minimal 44px dan status aria-live.
 */
export function ProjectsPager({
  page,
  hasMore,
  busy,
  onPrev,
  onNext,
}: ProjectsPagerProps) {
  const isPrevDisabled = page <= 1 || busy
  const isNextDisabled = !hasMore || busy

  return (
    <nav
      aria-label="Navigasi halaman project"
      className="flex items-center justify-between gap-stack-sm mt-section-sm w-full"
    >
      <Button
        variant="outline"
        size="sm"
        disabled={isPrevDisabled}
        onClick={onPrev}
        className="h-11 min-h-11 md:h-11 md:min-h-11 px-3 text-hint font-medium shrink-0"
      >
        <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
        <span>Sebelumnya</span>
      </Button>

      <span
        aria-live="polite"
        className="text-hint font-medium text-muted-foreground select-none whitespace-nowrap"
      >
        Halaman {page}
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={isNextDisabled}
        onClick={onNext}
        className="h-11 min-h-11 md:h-11 md:min-h-11 px-3 text-hint font-medium shrink-0"
      >
        <span>Berikutnya</span>
        <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
      </Button>
    </nav>
  )
}
