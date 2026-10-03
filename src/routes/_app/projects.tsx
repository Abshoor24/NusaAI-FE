import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api/projects'
import { getErrorMessage } from '@/lib/api/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/ui/container'
import { LoadingState } from '@/components/feedback/loading-state'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Modal } from '@/components/ui/modal'
import type { ProjectStatus, ProjectSummary } from '@/types/api'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export const Route = createFileRoute('/_app/projects')({
  component: ProjectsPage,
})

const PAGE_SIZE = 20

const STATUS_META: Record<ProjectStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
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

function ProjectsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [offset, setOffset] = useState(0)
  const [renameTarget, setRenameTarget] = useState<ProjectSummary | null>(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [renameError, setRenameError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['projects', offset],
    queryFn: () => projectsApi.list(PAGE_SIZE, offset),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] })
  }

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => projectsApi.rename(id, title),
    onSuccess: () => {
      setRenameTarget(null)
      setRenameTitle('')
      setRenameError(null)
      invalidate()
    },
    onError: (err) => setRenameError(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => {
      setDeleteTarget(null)
      invalidate()
    },
    onError: (err) => setActionError(getErrorMessage(err)),
  })

  const openRename = (project: ProjectSummary) => {
    setRenameTarget(project)
    setRenameTitle(project.title)
    setRenameError(null)
  }

  const submitRename = () => {
    const title = renameTitle.trim()
    if (!title) {
      setRenameError('Judul tidak boleh kosong.')
      return
    }
    if (title.length > 200) {
      setRenameError('Judul maksimal 200 karakter.')
      return
    }
    if (renameTarget) renameMutation.mutate({ id: renameTarget.id, title })
  }

  const projects = data ?? []

  return (
    <Container className="py-8 max-w-5xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Saya</h1>
          <p className="text-sm text-muted-foreground">
            Kelola website yang kamu buat dengan AI
          </p>
        </div>
        <Button onClick={() => navigate({ to: '/projects/new' })}>
          <Plus className="size-4" /> Buat Website
        </Button>
      </div>

      {actionError && (
        <div role="alert" className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
          {actionError}
        </div>
      )}

      {isLoading && <LoadingState label="Memuat project…" />}

      {isError && (
        <ErrorState
          title="Gagal memuat project"
          description={getErrorMessage(error)}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && projects.length === 0 && (
        <EmptyState
          title="Belum ada project"
          description="Ceritakan website impianmu, AI akan membuatnya untukmu."
          action={
            <Button onClick={() => navigate({ to: '/projects/new' })}>
              <Plus className="size-4" /> Buat Website Pertama
            </Button>
          }
        />
      )}

      {!isLoading && !isError && projects.length > 0 && (
        <>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((project) => {
              const meta = STATUS_META[project.status] ?? STATUS_META.draft
              const busy = project.status === 'generating'
              return (
                <li
                  key={project.id}
                  className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: project.id }}
                      className="font-semibold tracking-tight hover:text-primary line-clamp-2"
                    >
                      {project.title}
                    </Link>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {project.brief?.description ?? '—'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{project.version_count} versi</span>
                    <span>{formatDate(project.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      title={busy ? 'Tidak bisa diubah saat AI sedang bekerja' : 'Ubah judul'}
                      onClick={() => openRename(project)}
                    >
                      <Pencil className="size-3.5" /> Judul
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      title={busy ? 'Tidak bisa dihapus saat AI sedang bekerja' : 'Hapus project'}
                      onClick={() => {
                        setActionError(null)
                        setDeleteTarget(project)
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" /> Hapus
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            >
              &larr; Sebelumnya
            </Button>
            <span className="text-xs text-muted-foreground">
              Menampilkan {projects.length} project
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={projects.length < PAGE_SIZE}
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
            >
              Berikutnya &rarr;
            </Button>
          </div>
        </>
      )}

      <Modal
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title="Ubah Judul Project"
      >
        <div className="space-y-3">
          <Input
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            placeholder="Judul project"
            maxLength={200}
            disabled={renameMutation.isPending}
            aria-label="Judul project baru"
          />
          {renameError && <p className="text-[11px] text-destructive">{renameError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRenameTarget(null)}>
              Batal
            </Button>
            <Button
              size="sm"
              onClick={submitRename}
              isLoading={renameMutation.isPending}
              disabled={renameMutation.isPending || renameTitle.trim().length === 0}
            >
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Project?"
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Project <strong className="text-foreground">“{deleteTarget?.title}”</strong> beserta
            seluruh versi dan gambarnya akan dihapus permanen dan tidak bisa dikembalikan.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button
              size="sm"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              isLoading={deleteMutation.isPending}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  )
}
