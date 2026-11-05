import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api/projects'
import { getErrorMessage } from '@/lib/api/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Container } from '@/components/ui/container'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Modal } from '@/components/ui/modal'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectsPager } from '@/components/projects/ProjectsPager'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { BRIEF_TEMPLATES } from '@/lib/brief/templates'
import { PAGE_SIZE, calculateOffset, parsePageParam, validateProjectsSearch } from '@/lib/projects-page'
import type { ProjectSummary } from '@/types/api'
import { ArrowRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export const Route = createFileRoute('/_app/projects/')({
  validateSearch: validateProjectsSearch,
  component: ProjectsPage,
})

function LoadingGrid() {
  return (
    <div role="status" aria-live="polite">
      <p className="sr-only">Memuat project…</p>
      <ul aria-hidden="true" className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-stack">
        {[0, 1, 2].map((item) => (
          <li
            key={item}
            className="flex flex-col h-full rounded-2xl border border-border bg-card dark:bg-secondary p-panel gap-stack"
          >
            <div className="flex items-center justify-between">
              <div className="size-9 animate-pulse rounded-xl bg-muted" />
              <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="space-y-stack-xs py-stack-xs">
              <div className="h-5 w-3/4 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="mt-auto border-t border-border pt-stack flex items-center justify-between">
              <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
              <div className="flex gap-stack-sm">
                <div className="size-8 animate-pulse rounded-md bg-muted" />
                <div className="size-8 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProjectsPage() {
  useDocumentTitle('Project Saya | Nusa AI')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const search = Route.useSearch()
  const page = search.page ?? 1
  const offset = calculateOffset(page)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const isNavigatingToPrevPageRef = useRef(false)

  const [renameTarget, setRenameTarget] = useState<ProjectSummary | null>(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [renameError, setRenameError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isLoading, isError, error, refetch, isPlaceholderData, isFetching } = useQuery({
    queryKey: ['projects', offset],
    queryFn: () => projectsApi.listPage(PAGE_SIZE, offset),
    placeholderData: keepPreviousData,
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
      const wasSingleItemOnPage = projects.length === 1 && page > 1
      setDeleteTarget(null)
      if (wasSingleItemOnPage) {
        isNavigatingToPrevPageRef.current = true
        const prevPage = page - 1
        navigate({
          to: '/projects',
          search: prevPage === 1 ? {} : { page: prevPage },
        })
      }
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

  // A2: Guarded empty-page fallback. Hanya berjalan jika:
  // tidak loading, tidak error, bukan placeholder data, tidak fetching,
  // projects.length === 0 dan page > 1.
  useEffect(() => {
    isNavigatingToPrevPageRef.current = false
  }, [page])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search)
      if (params.has('page')) {
        const raw = params.get('page')
        const parsed = parsePageParam(raw)
        if (parsed <= 1 || raw !== String(parsed)) {
          navigate({
            to: '/projects',
            search: {},
            replace: true,
          })
        }
      }
    }
  }, [navigate])

  useEffect(() => {
    if (isNavigatingToPrevPageRef.current) return
    if (!isLoading && !isError && !isPlaceholderData && !isFetching && projects.length === 0 && page > 1) {
      navigate({
        to: '/projects',
        search: {},
        replace: true,
      })
    }
  }, [isLoading, isError, isPlaceholderData, isFetching, projects.length, page, navigate])

  const handlePageChange = (targetPage: number) => {
    navigate({
      to: '/projects',
      search: targetPage <= 1 ? {} : { page: targetPage },
    })
    const scrollContainer = document.querySelector('.main-scroll')
    if (scrollContainer) {
      scrollContainer.scrollTop = 0
    }
    headingRef.current?.focus()
  }

  return (
    <Container className="relative z-10 py-page max-w-wide">
      <div className="flex items-center justify-between gap-stack-md mb-header">
        <div>
          <div className="flex items-baseline gap-stack-sm">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-title font-bold tracking-tight focus:outline-none"
            >
              Project Saya
            </h1>
            {!isLoading && !isError && projects.length > 0 && (
              <span className="text-hint text-muted-foreground">
                ({projects.length})
              </span>
            )}
          </div>
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
            description="Nusa AI membantu kamu membuat website profesional dalam hitungan detik. Tulis ide websitemu atau pilih template pintasan di bawah untuk mulai."
            action={
              <Button onClick={() => navigate({ to: '/projects/new' })}>
                <Plus className="size-4" aria-hidden="true" /> Buat Website Pertama
              </Button>
            }
          />
          <div className="rounded-2xl border border-border bg-card dark:bg-secondary p-panel space-y-stack-md">
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
          <ul
            aria-label="Daftar project"
            aria-busy={isPlaceholderData}
            className={cn(
              'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-stack transition-opacity motion-safe:duration-150',
              isPlaceholderData && 'opacity-60',
            )}
          >
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

          {(page > 1 || hasMore) && (
            <ProjectsPager
              page={page}
              hasMore={hasMore}
              busy={isPlaceholderData}
              onPrev={() => handlePageChange(page - 1)}
              onNext={() => handlePageChange(page + 1)}
            />
          )}
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
