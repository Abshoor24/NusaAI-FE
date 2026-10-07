import { useId } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface AccordionItem {
  id: string
  title: string
  /** Ringkasan singkat di kanan judul, mis. "3/3 terisi". */
  hint?: string
  content: ReactNode
}

interface BriefAccordionProps {
  items: AccordionItem[]
  /** Id yang terbuka; controlled agar bisa dibuka dari error server. */
  openIds: string[]
  onToggle: (id: string) => void
}

/**
 * Accordion form. Tombol memakai aria-expanded + aria-controls; panel memakai
 * role="region" dan aria-labelledby. Animasi memakai grid-rows sehingga
 * otomatis dimatikan kill-switch prefers-reduced-motion di index.css.
 */
export function BriefAccordion({ items, openIds, onToggle }: BriefAccordionProps) {
  const baseId = useId()

  return (
    <div className="space-y-stack">
      {items.map((item) => {
        const open = openIds.includes(item.id)
        const buttonId = `${baseId}-${item.id}-button`
        const panelId = `${baseId}-${item.id}-panel`
        return (
          <div
            key={item.id}
            className={cn(
              'overflow-hidden rounded-lg border bg-card',
              open ? 'border-primary/50' : 'border-border',
            )}
          >
            <h3 className="m-0">
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => onToggle(item.id)}
                className="ctl flex min-h-control-min w-full items-center justify-between gap-stack px-control py-control-y text-left transition-colors hover:bg-accent"
              >
                <span className="min-w-0">
                  <span className="block text-control font-semibold text-foreground">{item.title}</span>
                  {item.hint && (
                    <span className="mt-0.5 block text-hint text-zinc-600 dark:text-muted-foreground">
                      {item.hint}
                    </span>
                  )}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                    open && 'rotate-180',
                  )}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!open}
              // Kerapatan "nyaman" pada Brief: 24 vertikal, bukan 32, supaya
              // tinggi total form tidak naik >15% dari baseline.
              className="border-t border-border px-control py-field"
            >
              {item.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}
