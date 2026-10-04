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
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <a
        href="#konten-utama"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:m-2 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Lewati ke konten utama
      </a>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        isMobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <div className="flex h-12 items-center border-b border-border bg-card px-3 md:hidden shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground"
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </Button>
          <span className="ml-2 font-bold text-xs tracking-tight text-foreground">Pakhir Studio</span>
        </div>

        <main id="konten-utama" tabIndex={-1} className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
