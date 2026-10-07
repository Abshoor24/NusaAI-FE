import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { getToken } from '@/lib/api/token'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    const token = getToken()
    if (!token) {
      // window.location dipakai (bukan `location` dari konteks) karena
      // search belum terurai saat beforeLoad parent berjalan — memakai
      // location.href/searchStr menghilangkan query (?autostart=1, ...).
      // Selalu internal (path + query + hash halaman ini sendiri).
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}${window.location.hash}`
          : '/projects'
      throw redirect({
        to: '/login',
        search: { redirect: redirectTo },
      })
    }
  },
  component: AppLayoutRoute,
})

function AppLayoutRoute() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    // overflow-clip (bukan hidden) pada kerangka: <main> dan pembungkusnya
    // TIDAK BOLEH menjadi scroll container — overflow:hidden masih bisa
    // digulir lewat fokus keyboard/scrollIntoView dan pernah mendorong form
    // keluar layar (bug layar kosong). Scroll vertikal hanya di form/area
    // konten yang sengaja (overflow-y-auto). min-h-0 dipertahankan karena
    // overflow-clip tidak membuat flex item minimum-size menjadi 0.
    <div className="flex h-screen w-full overflow-clip bg-background text-foreground">
      <a
        href="#konten-utama"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:m-2 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-control focus:font-medium focus:text-primary-foreground"
      >
        Lewati ke konten utama
      </a>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        isMobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col min-w-0 h-full overflow-clip">
        <div className="flex h-12 items-center border-b border-border bg-card px-stack md:hidden shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="min-h-control-min min-w-control-min text-muted-foreground hover:text-foreground"
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </Button>
          <span className="ml-stack-sm font-bold text-hint tracking-tight text-foreground">Pakhir Studio</span>
        </div>

        <main id="konten-utama" tabIndex={-1} className="flex-1 flex flex-col min-h-0 overflow-clip relative">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
