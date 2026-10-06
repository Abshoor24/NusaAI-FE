import { Coffee, Camera, GraduationCap, Mail, Palette, ShoppingBag } from 'lucide-react'
import { BRIEF_TEMPLATES } from '@/lib/brief/templates'
import { cn } from '@/lib/utils/cn'

const ICONS = {
  coffee: Coffee,
  'shopping-bag': ShoppingBag,
  camera: Camera,
  mail: Mail,
  palette: Palette,
  'graduation-cap': GraduationCap,
} as const

interface TemplatePickerProps {
  selectedId: string
  onSelect: (id: string) => void
  disabled?: boolean
}

/** Kartu "Mulai cepat": memilih template mengisi form, tidak mengunci apa pun. */
export function TemplatePicker({ selectedId, onSelect, disabled = false }: TemplatePickerProps) {
  return (
    <div role="group" aria-label="Mulai cepat" className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {BRIEF_TEMPLATES.map((template) => {
        const Icon = ICONS[template.icon as keyof typeof ICONS] ?? Coffee
        const active = selectedId === template.id
        return (
          <button
            key={template.id}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onSelect(template.id)}
            className={cn(
              'flex min-h-[44px] items-start gap-3 rounded-lg border p-3 text-left transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              active
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/40',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{template.label}</span>
              <span className="mt-0.5 block text-xs text-zinc-600 dark:text-muted-foreground">
                {template.description}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}