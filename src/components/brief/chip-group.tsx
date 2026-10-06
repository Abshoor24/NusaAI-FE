import { cn } from '@/lib/utils/cn'

interface ChipGroupProps {
  name: string
  legendId: string
  options: readonly string[]
  selected: string[]
  onToggle: (value: string) => void
  max: number
  disabled?: boolean
  errorId?: string
}

/**
 * Chip multi-pilih dengan batas maksimum. Memakai checkbox asli agar
 * bisa dipakai dengan keyboard (Tab + Spasi) dan dibacascreen reader.
 * Chip yang tidak terpilih dinonaktifkan saat sudah penuh, dengan penjelasan
 * di bawah kelompok.
 */
export function ChipGroup({
  name,
  legendId,
  options,
  selected,
  onToggle,
  max,
  disabled = false,
  errorId,
}: ChipGroupProps) {
  const full = selected.length >= max

  return (
    <fieldset
      role="group"
      aria-labelledby={legendId}
      disabled={disabled}
      aria-describedby={errorId}
      className="min-w-0"
    >
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = selected.includes(option)
          const blocked = full && !checked
          return (
            <label
              key={option}
              className={cn(
                'inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-colors',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                checked
                  ? 'border-primary bg-primary text-primary-foreground'
                  : blocked
                    ? 'cursor-not-allowed border-border bg-muted text-zinc-500 dark:text-zinc-500'
                    : 'border-border bg-card text-foreground hover:border-primary/50',
              )}
            >
              <input
                type="checkbox"
                name={name}
                value={option}
                checked={checked}
                disabled={blocked || disabled}
                onChange={() => onToggle(option)}
                className="peer sr-only"
              />
              {option}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}