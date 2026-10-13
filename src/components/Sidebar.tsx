import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api/auth'
import { useTheme } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'
import { LogoIcon, MoonIcon, SunIcon, XIcon } from '@/components/ui/icons'
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
      <div className="flex items-center justify-between px-stack pt-page pb-stack-sm">
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Perluas menu"
            data-tip="Perluas menu"
            className="tip grid size-8 place-items-center rounded-lg text-primary hover:bg-muted"
          >
            <LogoIcon className="size-7" />
          </button>
        ) : (
          <Link to="/projects" className="flex items-center gap-stack-sm">
            <LogoIcon className="size-7 text-primary" />
            <span className="font-bold text-control tracking-tight">Pakhir Studio</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          data-tip={collapsed ? 'Perluas menu' : 'Ciutkan menu'}
          className="tip size-8 text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? 'Perluas menu' : 'Ciutkan menu'}
        >
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>

      {/* Item navigasi: tinggi minimal 44px (token --space-nav-item) dan
          jarak --space-nav-gap, supaya target sentuh tidak berdempetan. */}
      <nav className="flex flex-col gap-nav-gap px-stack-sm py-stack" aria-label="Navigasi utama">
        {navItems.map((item) => {
          const active =
            item.path === '/projects' ? pathname === '/projects' : pathname.startsWith(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              aria-current={active ? 'page' : undefined}
              data-tip={collapsed ? item.label : undefined}
              className={cn(
                'ctl flex min-h-nav-item items-center gap-stack rounded-lg px-control py-control-y text-control font-medium transition-colors',
                collapsed && 'tip',
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

      <div className="mt-auto border-t border-border p-stack">
        <div className="relative" ref={accountMenuRef}>
          <button
            type="button"
            onClick={() => setAccountMenuOpen((v) => !v)}
            data-tip={collapsed ? 'Akun saya' : undefined}
            className={cn(
              'ctl flex min-h-nav-item w-full items-center gap-stack-sm rounded-lg px-stack-sm py-stack-sm text-left hover:bg-muted',
              collapsed && 'tip',
            )}
            aria-label="Menu akun"
            aria-expanded={accountMenuOpen}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-hint font-bold text-primary">
              {(user?.email?.[0] ?? '?').toUpperCase()}
            </span>
            {!collapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-hint font-semibold">{user?.email ?? '…'}</span>
                <span className="block text-hint text-muted-foreground">Akun saya</span>
              </span>
            )}
          </button>
          {accountMenuOpen && (
            <div className="absolute bottom-full left-0 mb-stack-sm w-56 rounded-xl border border-border bg-card p-stack-sm shadow-lg">
              <Link
                to="/settings"
                onClick={() => {
                  setAccountMenuOpen(false)
                  onCloseMobile?.()
                }}
                className="ctl flex min-h-nav-item items-center gap-stack-sm rounded-lg px-stack-sm text-hint hover:bg-muted"
              >
                <SettingsIcon className="size-3.5" /> Pengaturan
              </Link>
              <button
                type="button"
                onClick={() => {
                  toggleTheme()
                  setAccountMenuOpen(false)
                }}
                className="ctl flex min-h-nav-item w-full items-center gap-stack-sm rounded-lg px-stack-sm text-hint hover:bg-muted"
              >
                {theme === 'dark' ? <SunIcon className="size-3.5" /> : <MoonIcon className="size-3.5" />}
                {theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="ctl flex min-h-nav-item w-full items-center gap-stack-sm rounded-lg px-stack-sm text-hint text-red-700 dark:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-3.5" /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  useEffect(() => {
    if (!isMobileOpen) return
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseMobile?.()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMobileOpen, onCloseMobile])

  return (
    <>
      {/* Desktop */}
      <aside
        aria-label="Navigasi aplikasi"
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
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={onCloseMobile}
            className="absolute inset-0 cursor-default bg-black/50"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            className="absolute left-0 top-0 h-full w-72 bg-card shadow-xl"
          >
            <div className="flex justify-end p-stack-sm md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={onCloseMobile}
                aria-label="Tutup menu"
                className="min-h-control-min min-w-control-min"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
