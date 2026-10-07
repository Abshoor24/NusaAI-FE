import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'ctl h-10 min-h-11 w-full rounded-md border border-input bg-transparent px-control text-control text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:min-h-10',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}