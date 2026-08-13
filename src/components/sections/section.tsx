import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export function Section({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('py-12 sm:py-16 lg:py-20', className)} {...props} />
  )
}