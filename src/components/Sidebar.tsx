import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api/auth'
import { useTheme } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'
import { LogoIcon, MoonIcon, SunIcon } from '@/components/ui/icons'
import {
  LayoutGrid,
  Plus,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { theme, toggleTheme } = useTheme()

  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  const { data: user } = useQuery({
    queryKey: ['user-me'],
    queryFn: authApi.getMe,
    retry: false,
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    authApi.logout()
    navigate({ to: '/login' })
  }

  const navItems = [
    { label: 'Project Saya', path: '/projects', icon: <LayoutGrid className="size-4" /> },
    { label: 'Buat Website', path: '/projects/new', icon: <Plus className="size-4" /> },
  ]

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        {!collapsed && (
          <Link to="/projects" className="flex items-center gap-2">
            <LogoIcon className="size-7 text-primary" />
            <span className="font-bold text-sm tracking-tight">Pakhir Studio</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="size-8 text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
        >
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-2" aria-label="Navigasi utama">
        {navItems.map((item) => {
          const active =
            item.path === '/projects' ? pathname === '/projects' : pathname.startsWith(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-border p-3">
        <div className="relative" ref={accountMenuRef}>
          <button
            type="button"
            onClick={() => setAccountMenuOpen((v) => !v)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted"
            aria-label="Menu akun"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {(user?.email?.[0] ?? '?').toUpperCase()}
            </span>
            {!collapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{user?.email ?? '…'}</span>
                <span className="block text-[11px] text-muted-foreground">Akun saya</span>
              </span>
            )}
          </button>
          {accountMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl border border-border bg-card p-1 shadow-lg">
              <Link
                to="/settings"
                onClick={() => {
                  setAccountMenuOpen(false)
                  onCloseMobile?.()
                }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-muted"
              >
                <SettingsIcon className="size-3.5" /> Pengaturan
              </Link>
              <button
                type="button"
                onClick={() => {
                  toggleTheme()
                  setAccountMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-muted"
              >
                {theme === 'dark' ? <SunIcon className="size-3.5" /> : <MoonIcon className="size-3.5" />}
                {theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-3.5" /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          'hidden h-full shrink-0 border-r border-border bg-card transition-all md:block',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        {sidebarContent}
      </aside>
      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onCloseMobile} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-card shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
