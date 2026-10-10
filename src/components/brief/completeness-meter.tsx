import type { CompletenessResult } from '@/lib/brief'

interface CompletenessMeterProps {
  result: CompletenessResult
}

/**
 * Penunjuk kelengkapan "Brief 70% lengkap". Bar + teks, plus satu saran
 * langkah berikutnya. Tidak pernah memblokir submit.
 */
export function CompletenessMeter({ result }: CompletenessMeterProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-control">
      <div className="flex items-baseline justify-between gap-stack-sm">
        <span className="text-control font-medium text-foreground">{result.label}</span>
        <span className="text-hint text-zinc-600 dark:text-muted-foreground">{result.percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="Kelengkapan brief"
        aria-valuenow={result.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={result.label}
        className="mt-stack-sm h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200"
          style={{ width: `${result.percent}%` }}
        />
      </div>
      {result.nextStep && (
        <p className="mt-stack-sm text-hint text-zinc-600 dark:text-muted-foreground">
          Langkah berikutnya: {result.nextStep}
        </p>
      )}
    </div>
  )
}