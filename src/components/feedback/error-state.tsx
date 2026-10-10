import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { AlertCircleIcon } from '@/components/ui/icons'

export type ErrorStateProps = {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Terjadi kesalahan',
  description = 'Terjadi kesalahan tak terduga. Silakan coba lagi.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-stack-md py-section text-center', className)}>
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-destructive">
        <AlertCircleIcon className="size-6" />
      </div>
      <div className="space-y-stack-sm">
        <h2 className="text-body font-semibold">{title}</h2>
        <p className="max-w-prose text-control text-muted-foreground">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Coba Lagi
        </Button>
      )}
    </div>
  )
}