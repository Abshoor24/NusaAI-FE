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
 * cincin pada label. Label memakai `relative` agar input (position:absolute)
 * terkandung di dalam kartu, bukan lolos ke <main> (bug layar kosong).
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
      <div className="grid grid-cols-1 gap-stack sm:grid-cols-2">
        {options.map((option) => {
          const checked = value === option.value
          return (
            <label
              key={option.value}
              className={cn(
                'ctl-has-focus group relative flex min-h-control-min cursor-pointer items-start gap-stack rounded-lg border border-border bg-card p-panel-sm text-left transition-colors',
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
                  checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border-control bg-background',
                )}
              >
                {checked && <Check className="size-3" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-stack-sm text-control font-medium text-foreground">
                  {option.icon}
                  {option.label}
                </span>
                {option.description && (
                  <span className="mt-0.5 block text-hint text-zinc-600 dark:text-muted-foreground">
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