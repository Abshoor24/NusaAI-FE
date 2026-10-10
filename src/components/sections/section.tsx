import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

/** Padding vertikal section dari token --space-section-landing (64 -> 96). */
export function Section({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('py-section-landing', className)} {...props} />
  )
}