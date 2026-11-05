import { createRootRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background text-foreground">
      <h1 className="text-4xl font-extrabold tracking-tight mb-2">404</h1>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        Halaman yang Anda cari tidak ditemukan.
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
      >
        Kembali ke Beranda
      </Link>
    </div>
  )
}

/**
 * Kunci boundary per pathname agar fallback error ter-reset saat pindah
 * route (tanpa ini boundary yang sudah error tetap menampilkan fallback di
 * halaman berikutnya).
 */
function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <ErrorBoundary key={pathname}>
      <Outlet />
    </ErrorBoundary>
  )
}
