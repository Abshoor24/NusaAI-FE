import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        // min-h-11 di layar kecil: target sentuh 44px (WCAG 2.5.8); di layar
        // lebar kembali ke 40px agar tampilan tetap padat.
        'h-10 min-h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:min-h-10',
        className,
      )}
      {...props}
    />
  )
}