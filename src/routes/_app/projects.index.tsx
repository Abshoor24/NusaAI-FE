import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api/projects'
import { getErrorMessage } from '@/lib/api/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Container } from '@/components/ui/container'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Modal } from '@/components/ui/modal'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { BRIEF_TEMPLATES } from '@/lib/brief/templates'
import type { ProjectSummary } from '@/types/api'
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react'


export const Route = createFileRoute('/_app/projects/')({
  component: ProjectsPage,
})

const PAGE_SIZE = 20

function LoadingGrid() {
  return (
    <div role="status" aria-live="polite">
      <p className="sr-only">Memuat project…</p>
      <ul aria-hidden="true" className="grid grid-cols-1 gap-stack sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <li
            key={item}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="aspect-[16/9] animate-pulse bg-muted/60" />
            <div className="space-y-stack p-panel">
              <div className="h-5 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProjectsPage() {
  useDocumentTitle('Project Saya | Pakhir Studio')
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
    queryFn: () => projectsApi.listPage(PAGE_SIZE, offset),
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

  const projects = data?.items ?? []
  const hasMore = data?.hasMore ?? false

  // Bila halaman > 1 ternyata kosong (mis. project terakhir dihapus dari
  // tab lain), otomatis kembali ke halaman sebelumnya.
  useEffect(() => {
    if (!isLoading && !isError && projects.length === 0 && offset > 0) {
      setOffset((o) => Math.max(0, o - PAGE_SIZE))
    }
  }, [isLoading, isError, projects.length, offset])

  return (
    // Wadah scroll halaman (bukan <main>): min-h-0 + flex-1 agar menyusut
    // mengikuti <main> yang overflow-clip, lalu menggulir di dalam sendiri.
    <Container className="py-page max-w-wide min-h-0 flex-1 overflow-y-auto">
      <div className="flex items-center justify-between gap-stack-md mb-header">
        <div>
          <h1 className="text-title font-bold tracking-tight">Project Saya</h1>
          <p className="mt-stack-sm text-control text-muted-foreground">
            Kelola website yang kamu buat dengan AI
          </p>
        </div>
        <Button onClick={() => navigate({ to: '/projects/new' })}>
          <Plus className="size-4" aria-hidden="true" /> Buat Website
        </Button>
      </div>

      {actionError && (
        <div role="alert" className="mb-section-sm rounded-lg bg-destructive/10 border border-destructive/20 p-control text-control text-red-700 dark:text-destructive">
          {actionError}
        </div>
      )}

      {isLoading && <LoadingGrid />}

      {isError && (
        <ErrorState
          title="Gagal memuat project"
          description={getErrorMessage(error)}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && projects.length === 0 && (
        <div className="space-y-section-sm">
          <EmptyState
            title="Belum ada website"
            description="Pakhir Studio membantu kamu membuat website profesional dalam hitungan detik. Tulis ide websitemu atau pilih template pintasan di bawah untuk mulai."
            action={
              <Button onClick={() => navigate({ to: '/projects/new' })}>
                <Plus className="size-4" aria-hidden="true" /> Buat Website Pertama
              </Button>
            }
          />
          <div className="rounded-2xl border border-border bg-card p-panel space-y-stack-md">
            <div className="space-y-stack-sm">
              <h2 className="text-control font-semibold tracking-tight">Atau Mulai dari Template Pintasan</h2>
              <p className="text-hint text-muted-foreground">
                Pilih template usaha di bawah untuk langsung mengisi brief website:
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-stack">
              {BRIEF_TEMPLATES.slice(0, 3).map((tpl) => (
                <div
                  key={tpl.id}
                  className="rounded-xl border border-border p-control flex flex-col justify-between gap-stack hover:border-primary/50 transition-colors"
                >
                  <div className="space-y-stack-sm">
                    <h3 className="text-hint font-bold text-foreground">{tpl.label}</h3>
                    <p className="text-hint text-muted-foreground line-clamp-2">{tpl.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate({ to: '/projects/new', search: { template: tpl.id } })}
                    className="w-full"
                  >
                    Gunakan Template <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !isError && projects.length > 0 && (
        <>
          <ul aria-label="Daftar project" className="grid grid-cols-1 gap-stack sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onRename={openRename}
                onDelete={(target) => {
                  setActionError(null)
                  setDeleteTarget(target)
                }}
              />
            ))}
          </ul>

          <nav aria-label="Halaman project" className="flex items-center justify-between gap-stack-sm mt-section-sm">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" /> Sebelumnya
            </Button>
            <span className="text-hint text-muted-foreground">
              Menampilkan {projects.length} project
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
            >
              Berikutnya <ArrowRight className="size-3.5" aria-hidden="true" />
            </Button>
          </nav>
        </>
      )}

      <Modal
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title="Ubah Judul Project"
      >
        <div className="space-y-stack">
          <Input
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            placeholder="Judul project"
            maxLength={200}
            disabled={renameMutation.isPending}
            aria-label="Judul project baru"
          />
          {renameError && <p className="text-hint text-destructive">{renameError}</p>}
          <div className="flex justify-end gap-stack-sm">
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
        <div className="space-y-stack">
          <p className="text-control text-muted-foreground">
            Project <strong className="text-foreground">“{deleteTarget?.title}”</strong> beserta
            seluruh versi dan gambarnya akan dihapus permanen dan tidak bisa dikembalikan.
          </p>
          <div className="flex justify-end gap-stack-sm">
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
