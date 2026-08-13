import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { Card } from '@/components/ui/card'

export type CTAProps = {
  title: string
  description?: string
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  className?: string
}

export function CTA({
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: CTAProps) {
  return (
    <Card className={cn('border-border bg-muted/50', className)}>
      <div className="flex flex-col items-center gap-6 px-6 py-14 text-center sm:px-12">
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          {description && <p className="text-base text-muted-foreground sm:text-lg">{description}</p>}
        </div>
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-wrap justify-center gap-3">
            {primaryAction}
            {secondaryAction}
          </div>
        )}
      </div>
    </Card>
  )
}