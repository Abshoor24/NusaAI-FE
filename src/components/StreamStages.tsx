import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { StreamStage } from '@/lib/stream-status'

const markerClasses: Record<StreamStage['state'], string> = {
  done: 'border-primary bg-primary text-primary-foreground',
  active: 'border-primary text-primary',
  pending: 'border-border text-muted-foreground',
}

const labelClasses: Record<StreamStage['state'], string> = {
  done: 'text-foreground',
  active: 'text-foreground',
  pending: 'text-muted-foreground',
}

export function StreamStages({ stages }: { stages: StreamStage[] }) {
  return (
    <ol className="space-y-stack-sm">
      {stages.map((stage, index) => (
        <li
          key={stage.id}
          aria-current={stage.state === 'active' ? 'step' : undefined}
          className="flex items-start gap-stack-sm"
        >
          <span
            aria-hidden="true"
            className={cn(
              'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold',
              markerClasses[stage.state],
            )}
          >
            {stage.state === 'done' ? <Check className="size-3" /> : index + 1}
          </span>
          <div className="min-w-0">
            <p className={cn('text-control font-medium', labelClasses[stage.state])}>
              {stage.label}
            </p>
            <p className="text-hint text-muted-foreground">{stage.description}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
