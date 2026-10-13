import { Link } from '@tanstack/react-router'
import { ArrowRight, Layers, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Topography } from './Topography'
import type { ProjectStatus, ProjectSummary } from '@/types/api'

const STATUS_META: Record<
  ProjectStatus,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }
> = {
  draft: { label: 'Draf', variant: 'secondary' },
  generating: { label: 'Membuat…', variant: 'warning' },
  ready: { label: 'Siap', variant: 'success' },
  failed: { label: 'Gagal', variant: 'destructive' },
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export type ProjectCardProps = {
  project: ProjectSummary
  onRename: (project: ProjectSummary) => void
  onDelete: (project: ProjectSummary) => void
}

/**
 * Kartu project: thumbnail inisial di atas motif topografi, judul
 * sebagai link, badge status fungsional, meta versi dan tanggal,
 * lalu aksi Buka, Ubah judul, dan Hapus. Kartu sendiri tidak bisa
 * diklik supaya kontrol di dalamnya tetap jelas untuk keyboard.
 */
export function ProjectCard({ project, onRename, onDelete }: ProjectCardProps) {
  const meta = STATUS_META[project.status] ?? STATUS_META.draft
  const busy = project.status === 'generating'
  const initial = (project.title.trim().charAt(0) || '?').toUpperCase()

  return (
    <li className="flex flex-col rounded-2xl border border-border bg-card transition-colors hover:border-primary/40">
      <div className="relative aspect-[16/9] overflow-hidden rounded-t-2xl border-b border-border bg-muted/40">
        <Topography miniature className="absolute inset-0 h-full w-full" />
        <span
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center text-display font-bold tracking-tight text-foreground/70"
        >
          {initial}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-stack p-panel">
        <div className="flex items-start justify-between gap-stack-sm">
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id }}
            className="ctl inline-flex min-h-control-min items-start font-semibold tracking-tight hover:text-primary line-clamp-2"
          >
            {project.title}
          </Link>
          <Badge variant={meta.variant} className="shrink-0">
            {meta.label}
          </Badge>
        </div>

        <p className="text-control text-muted-foreground line-clamp-2">
          {project.brief?.description ?? 'Deskripsi belum diisi'}
        </p>

        <div className="flex items-center justify-between text-hint text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Layers className="size-3.5" aria-hidden="true" />
            {project.version_count} versi
          </span>
          <time dateTime={project.updated_at}>{formatDate(project.updated_at)}</time>
        </div>

        <div className="mt-auto flex items-center justify-between gap-stack-sm border-t border-border pt-stack">
          <Button size="sm" asChild>
            <Link to="/projects/$projectId" params={{ projectId: project.id }}>
              Buka <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
          <div className="flex items-center gap-stack-sm">
            <Button
              variant="outline"
              size="icon"
              disabled={busy}
              title={busy ? 'Tidak bisa diubah saat AI sedang bekerja' : 'Ubah judul'}
              aria-label={`Ubah judul ${project.title}`}
              data-tip="Ubah judul"
              onClick={() => onRename(project)}
              className="tip tip-top min-h-control-min min-w-control-min"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={busy}
              title={busy ? 'Tidak bisa dihapus saat AI sedang bekerja' : 'Hapus project'}
              aria-label={`Hapus ${project.title}`}
              data-tip="Hapus"
              onClick={() => onDelete(project)}
              className="tip tip-top min-h-control-min min-w-control-min text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </li>
  )
}
