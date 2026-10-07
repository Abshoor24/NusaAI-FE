import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/badge'

export type SectionHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: SectionHeaderProps) {
  const centered = align === 'center'

  return (
    <div
      className={cn(
        'flex max-w-2xl flex-col gap-stack',
        centered && 'mx-auto items-center text-center',
        className,
      )}
    >
      {eyebrow && <Badge variant="secondary">{eyebrow}</Badge>}
      <h2 className="text-section-title font-bold tracking-tight">{title}</h2>
      {description && <p className="max-w-prose text-body text-muted-foreground">{description}</p>}
    </div>
  )
}