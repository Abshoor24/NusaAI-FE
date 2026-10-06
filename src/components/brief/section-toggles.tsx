import { cn } from '@/lib/utils/cn'

interface SectionToggleItem {
  id: string
  label: string
  description: string
}

interface SectionTogglesProps {
  items: SectionToggleItem[]
  enabled: string[]
  onToggle: (id: string) => void
  max: number
  disabled?: boolean
  legendId: string
  errorId?: string
}

/**
 * Daftar toggle bagian halaman. Setiap toggle adalah role="switch" dengan
 * aria-checked; tombol sentuh minimal 44px. Saat batas 12 tercapai, toggle
 * yang belum menyala dinonaktifkan.
 */
export function SectionToggles({
  items,
  enabled,
  onToggle,
  max,
  disabled = false,
  legendId,
  errorId,
}: SectionTogglesProps) {
  const full = enabled.length >= max

  return (
    <fieldset role="group" aria-labelledby={legendId} aria-describedby={errorId} className="min-w-0">
      <ul className="space-y-2">
        {items.map((item) => {
          const on = enabled.includes(item.id)
          const blocked = full && !on
          return (
            <li key={item.id}>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                disabled={blocked || disabled}
                onClick={() => onToggle(item.id)}
                className={cn(
                  'flex min-h-[44px] w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  on
                    ? 'border-primary/60 bg-primary/5'
                    : 'border-border bg-card hover:border-primary/40',
                  blocked && 'cursor-not-allowed opacity-60',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors',
                    on ? 'bg-primary' : 'bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'block size-4 rounded-full bg-background transition-transform',
                      on ? 'translate-x-4' : 'translate-x-0',
                    )}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-zinc-600 dark:text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}