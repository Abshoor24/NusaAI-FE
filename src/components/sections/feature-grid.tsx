import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { Card, CardContent } from '@/components/ui/card'

export type FeatureItem = {
  title: string
  description?: string
  icon?: ReactNode
}

export type FeatureGridProps = {
  items: FeatureItem[]
  columns?: 2 | 3
  className?: string
}

export function FeatureGrid({ items, columns = 3, className }: FeatureGridProps) {
  return (
    <div
      className={cn(
        'grid gap-6 sm:grid-cols-2',
        columns === 3 && 'lg:grid-cols-3',
        className,
      )}
    >
      {items.map((item) => (
        <Card
          key={item.title}
          className="transition-shadow hover:shadow-md motion-reduce:transition-none"
        >
          <CardContent className="flex flex-col gap-3 p-6">
            {item.icon && (
              <div className="flex size-10 items-center justify-center rounded-md bg-muted text-foreground">
                {item.icon}
              </div>
            )}
            <h3 className="text-base font-semibold">{item.title}</h3>
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}