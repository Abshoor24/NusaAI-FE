import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive'

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
}

const baseClasses =
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'border border-border text-foreground',
  // Teks mode terang memakai shade 700 agar kontras >= 4.5:1 (WCAG AA);
  // emerald-600/amber-600/red-600 hanya ~3:1 di atas bg /15 (temuan axe).
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  destructive: 'bg-red-500/15 text-red-700 dark:text-red-300',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return <span className={cn(baseClasses, variantClasses[variant], className)} {...props} />
}