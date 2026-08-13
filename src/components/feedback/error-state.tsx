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
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-16 text-center', className)}>
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-destructive">
        <AlertCircleIcon className="size-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}