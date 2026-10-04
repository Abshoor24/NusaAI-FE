import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { useDocumentTitle } from '@/hooks/use-document-title'

export const Route = createFileRoute('/_app/$')({
  component: NotFoundPage,
})

function NotFoundPage() {
  useDocumentTitle('Halaman Tidak Ditemukan — Pakhir Studio')
  return (
    <Container className="flex min-h-[60vh] items-center justify-center py-16">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          404
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Halaman Tidak Ditemukan</h1>
        <p className="text-muted-foreground">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <Button asChild>
          <Link to="/projects">Kembali ke Project</Link>
        </Button>
      </div>
    </Container>
  )
}
