import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const Route = createRootRoute({
  component: RootComponent,
})

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
