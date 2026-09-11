import { cn } from '@/lib/utils/cn'

export type ScrollAreaProps = React.ComponentPropsWithoutRef<'div'> & {
  children: React.ReactNode
}

export function ScrollArea({ className, children, ...props }: ScrollAreaProps) {
  return (
    <div
      className={cn('scroll-area', className)}
      {...props}
    >
      {children}
    </div>
  )
}