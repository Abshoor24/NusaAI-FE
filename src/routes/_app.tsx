import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { getToken } from '@/lib/api/token'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

export const Route = createFileRoute('/_app')({
  beforeLoad: ({ location }) => {
    const token = getToken()
    if (!token) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
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
            className="size-8 text-muted-foreground hover:text-foreground"
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </Button>
          <span className="ml-2 font-bold text-xs tracking-tight text-foreground">Pakhir Studio</span>
        </div>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
