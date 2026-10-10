import { cn } from '@/lib/utils/cn'
import { Spinner } from '@/components/ui/spinner'

export type LoadingStateProps = {
  label?: string
  className?: string
}

export function LoadingState({ label = 'Memuat...', className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-stack-md py-section text-center',
        className,
      )}
    >
      <Spinner className="size-6 text-muted-foreground" />
      <p className="text-control text-muted-foreground">{label}</p>
    </div>
  )
}