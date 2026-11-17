import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { LoadingState } from '@/components/feedback/loading-state'
import { examplesApi, EXAMPLE_BUSY_LABEL, EXAMPLE_LABEL } from '@/lib/api/examples'
import type { ExampleSite } from '@/types/api'

function ExamplePreviewDialog({
  site,
  label,
  onClose,
}: {
  site: ExampleSite | null
  label?: string
  onClose: () => void
}) {
  const slug = site?.slug ?? ''
  const htmlQuery = useQuery({
    queryKey: ['example-html', slug],
    queryFn: () => examplesApi.html(slug),
    enabled: slug.length > 0,
    staleTime: Infinity,
    retry: 1,
  })

  return (
    <Modal
      open={site !== null}
      onClose={onClose}
      title={site?.title ?? EXAMPLE_LABEL}
      description={site ? `${label ?? site.label}. Bukan hasil generate proyek Anda.` : undefined}
      size="xl"
    >
      {htmlQuery.isLoading && <LoadingState label="Memuat contoh..." />}
      {htmlQuery.isError && (
        <p className="text-control text-muted-foreground">
          Contoh tidak bisa dimuat saat ini. Coba lagi nanti.
        </p>
      )}
      {htmlQuery.data && site && (
        <iframe
          title={`Pratinjau ${site.title}`}
          srcDoc={htmlQuery.data}
          sandbox="allow-scripts allow-popups"
          className="h-[65dvh] w-full rounded-md border border-border bg-white"
        />
      )}
    </Modal>
  )
}

export function ExampleGallery({
  examples,
  isLoading = false,
}: {
  examples: ExampleSite[]
  isLoading?: boolean
}) {
  const [selected, setSelected] = useState<ExampleSite | null>(null)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-control">Sambil menunggu</CardTitle>
          <CardDescription>Menyiapkan contoh hasil...</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-stack-sm sm:grid-cols-2">
          <div className="h-24 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
          <div className="h-24 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        </CardContent>
      </Card>
    )
  }

  if (examples.length === 0) return null

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-control">Sambil menunggu, lihat contoh hasil</CardTitle>
          <CardDescription>
            Contoh ini bukan hasil generate proyek Anda. Gunakan sebagai gambaran arah desain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 gap-stack-sm sm:grid-cols-2">
            {examples.map((site) => (
              <li key={site.slug}>
                <button
                  type="button"
                  onClick={() => setSelected(site)}
                  className="group flex h-full w-full flex-col rounded-lg border border-border p-control text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex flex-wrap items-center justify-between gap-stack-sm">
                    <Badge variant="outline">{site.label || EXAMPLE_LABEL}</Badge>
                    <span className="text-hint uppercase tracking-wide text-muted-foreground">
                      {site.category}
                    </span>
                  </span>
                  <span className="mt-stack-sm font-semibold leading-tight">{site.title}</span>
                  <span className="mt-stack-sm line-clamp-2 text-hint text-muted-foreground">
                    {site.description}
                  </span>
                  <span className="mt-stack-sm inline-flex items-center gap-1 text-hint font-medium">
                    Lihat contoh
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <ExamplePreviewDialog site={selected} onClose={() => setSelected(null)} />
    </>
  )
}

export function ExampleFallback({
  site,
  label = EXAMPLE_BUSY_LABEL,
}: {
  site: ExampleSite | null
  label?: string
}) {
  const [open, setOpen] = useState(false)

  if (!site) return null

  return (
    <>
      <Card aria-label={`${label}: ${site.title}`}>
        <CardHeader className="space-y-stack">
          <div className="flex flex-wrap items-center gap-stack-sm">
            <Badge variant="warning">{label}</Badge>
            <span className="text-hint uppercase tracking-wide text-muted-foreground">
              {site.category}
            </span>
          </div>
          <CardTitle className="text-control">{site.title}</CardTitle>
          <CardDescription>{site.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-stack">
          <p className="max-w-prose text-control text-muted-foreground">
            Ini bukan hasil generate proyek Anda. Contoh paling dekat dengan brief ditampilkan
            agar Anda tetap bisa melihat gambaran arah desain.
          </p>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
            Lihat contoh
          </Button>
        </CardContent>
      </Card>
      <ExamplePreviewDialog site={open ? site : null} label={label} onClose={() => setOpen(false)} />
    </>
  )
}
