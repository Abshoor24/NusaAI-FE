import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/badge'

export type HeroProps = {
  eyebrow?: string
  title: string
  description?: string
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  align?: 'left' | 'center'
  className?: string
}

export function Hero({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  align = 'center',
  className,
}: HeroProps) {
  const centered = align === 'center'

  return (
    <section className={cn('py-16 sm:py-24 lg:py-32', className)}>
      <div
        className={cn(
          'mx-auto flex max-w-3xl animate-fade-up flex-col gap-6 motion-reduce:animate-none',
          centered && 'items-center text-center',
        )}
      >
        {eyebrow && <Badge variant="secondary">{eyebrow}</Badge>}
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
        {description && <p className="text-lg text-muted-foreground">{description}</p>}
        {(primaryAction || secondaryAction) && (
          <div className={cn('flex flex-wrap gap-3', centered && 'justify-center')}>
            {primaryAction}
            {secondaryAction}
          </div>
        )}
      </div>
    </section>
  )
}