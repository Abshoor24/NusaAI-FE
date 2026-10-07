import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // Padding tepi dari token --space-page-x (16 -> 24 -> 32).
      className={cn('mx-auto w-full max-w-6xl px-page-x', className)}
      {...props}
    />
  )
}