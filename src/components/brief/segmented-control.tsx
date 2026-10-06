import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  hint?: string
  icon?: ReactNode
}

/** Nilai aktif boleh string kosong: "biarkan AI/servis yang memilih". */
type SegmentedValue<T extends string> = T | ''

interface SegmentedControlProps<T extends string> {
  name: string
  legendId: string
  options: Array<SegmentedOption<SegmentedValue<T>>>
  value: SegmentedValue<T>
  onChange: (value: SegmentedValue<T>) => void
  disabled?: boolean
  className?: string
}

/**
 * Kontrol tersegmentasi (radio group satu baris) untuk pilihan sedikit,
 * misalnya bahasa. Memakai <input type="radio"> asli agar panah keyboard
 * bekerja otomatis; target sentuh minimal 44px. Label memakai `relative`
 * agar input sr-only terkandung di dalamnya, bukan lolos ke <main>.
 */
export function SegmentedControl<T extends string>({
  name,
  legendId,
  options,
  value,
  onChange,
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  return (
    <fieldset
      role="radiogroup"
      aria-labelledby={legendId}
      disabled={disabled}
      className={cn('min-w-0', className)}
    >
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value === option.value
          return (
            <label
              key={option.value || '__auto'}
              title={option.hint}
              className={cn(
                'relative flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-center text-xs font-medium text-foreground transition-colors',
                'hover:border-primary/50',
                'has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground',
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
              {option.icon}
              <span>{option.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}