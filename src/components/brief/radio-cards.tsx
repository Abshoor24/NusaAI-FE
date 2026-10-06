import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface RadioCardOption<T extends string> {
  value: T
  label: string
  description?: string
  icon?: ReactNode
}

interface RadioCardsProps<T extends string> {
  /** Nama grup input (radio sekelompok bila nilainya sama). */
  name: string
  /** Id elemen yang berisi nama grup (untuk aria-labelledby). */
  legendId: string
  options: Array<RadioCardOption<T>>
  value: T | ''
  onChange: (value: T) => void
  disabled?: boolean
  className?: string
}

/**
 * Kartu pilihan (radio group) yang bisa dipilah dengan panah keyboard.
 *
 * Memakai <input type="radio"> asli (bukan button dengan role=radio) agar
 * navigasi panah, group tab, dan pembaca layar bekerja tanpa JavaScript.
 * Input disembunyikan via sr-only_peer sehingga fokus tetap terlihat lewat
 * cincin pada label.
 */
export function RadioCards<T extends string>({
  name,
  legendId,
  options,
  value,
  onChange,
  disabled = false,
  className,
}: RadioCardsProps<T>) {
  return (
    <fieldset role="radiogroup" aria-labelledby={legendId} disabled={disabled} className={cn('min-w-0', className)}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = value === option.value
          return (
            <label
              key={option.value}
              className={cn(
                'group flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors',
                'hover:border-primary/50',
                'has-[:checked]:border-primary has-[:checked]:bg-primary/5',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                disabled && 'pointer-events-none opacity-60',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                  checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background',
                )}
              >
                {checked && <Check className="size-3" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {option.icon}
                  {option.label}
                </span>
                {option.description && (
                  <span className="mt-0.5 block text-xs text-zinc-600 dark:text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}