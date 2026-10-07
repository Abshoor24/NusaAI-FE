import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { InboxIcon } from '@/components/ui/icons'

export type EmptyStateProps = {
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title = 'Nothing here yet',
  description = 'There is no content to display at the moment.',
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-stack-md py-section text-center', className)}>
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <InboxIcon className="size-6" />
      </div>
      <div className="space-y-stack-sm">
        <h2 className="text-body font-semibold">{title}</h2>
        <p className="max-w-prose text-control text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}