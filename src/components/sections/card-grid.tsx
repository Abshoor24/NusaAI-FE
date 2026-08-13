import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export type CardGridItem = {
  title: string
  description?: string
  badge?: string
}

export type CardGridProps = {
  items: CardGridItem[]
  columns?: 2 | 3 | 4
  className?: string
}

export type CardGridColumns = 2 | 3 | 4

const columnClasses: Record<CardGridColumns, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export function CardGrid({ items, columns = 3, className }: CardGridProps) {
  return (
    <div className={cn('grid gap-6', columnClasses[columns], className)}>
      {items.map((item) => (
        <Card
          key={item.title}
          className="transition-shadow hover:shadow-md motion-reduce:transition-none"
        >
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle>{item.title}</CardTitle>
              {item.badge && <Badge variant="secondary">{item.badge}</Badge>}
            </div>
            {item.description && <CardDescription>{item.description}</CardDescription>}
          </CardHeader>
          <CardContent></CardContent>
        </Card>
      ))}
    </div>
  )
}