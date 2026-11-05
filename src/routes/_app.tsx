import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { getToken } from '@/lib/api/token'
import { Sidebar } from '@/components/Sidebar'
import { Topography } from '@/components/projects/Topography'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/BrandLogo'
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
    // Kerangka dashboard bersama: sidebar tetap setinggi 100dvh,
    // area main mengisi seluruh sisa lebar hingga tepi kanan jendela.
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      <a
        href="#konten-utama"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:m-2 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-control focus:font-medium focus:text-primary-foreground"
      >
        Lewati ke konten utama
      </a>

      {/* Latar motif topografi untuk seluruh halaman aplikasi:
          fixed di bawah konten, menutupi seluruh viewport hingga tepi kanan,
          dan tetap (statis) saat konten digulir. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <Topography className="absolute inset-0 h-full w-full opacity-70" />
      </div>

      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        isMobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="relative z-10 flex flex-1 flex-col min-w-0 h-[100dvh] overflow-hidden">
        {/* Header mobile */}
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
          <span className="ml-stack-sm flex items-center">
            <BrandLogo variant="full" tone="auto" height={24} />

          </span>
        </div>

        {/* <main> tetap overflow-clip untuk menjaga invarian layout anti-layar-kosong.
            main-scroll di dalamnya adalah SATU-SATUNYA elemen scroll vertikal di seluruh shell dashboard,
            dengan sisi kanannya menempel tepat di tepi kanan jendela (rect.right === window.innerWidth). */}
        <main
          id="konten-utama"
          tabIndex={-1}
          className="relative flex-1 flex flex-col min-h-0 overflow-clip focus:outline-none"
        >
          <div className="main-scroll relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden focus:outline-none">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
