import { createFileRoute, Outlet, redirect, useLocation } from '@tanstack/react-router'
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
  const location = useLocation()

  // Extract active conversation id if present in query param ?c=xxx
  const activeConversationId = new URLSearchParams(location.search).get('c')

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar Component */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        activeConversationId={activeConversationId}
        isMobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header Bar (Only visible on screens < md) */}
        <div className="flex h-12 items-center border-b border-border bg-card px-3 md:hidden shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="size-8 text-muted-foreground hover:text-foreground"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <span className="ml-2 font-bold text-xs tracking-tight text-foreground">nusaAI Platform</span>
        </div>

        {/* Page Content Outlet */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
