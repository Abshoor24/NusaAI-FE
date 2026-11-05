import { useState, useRef, useEffect, type ReactElement, cloneElement } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useLocation } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api/auth'
import { useTheme } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'
import { MoonIcon, SunIcon, XIcon } from '@/components/ui/icons'
import { BrandLogo } from '@/components/BrandLogo'
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

/**
 * Tooltip terapung berbasis portal untuk rail sidebar ciut (collapsed).
 * Ditempatkan di sebelah kanan rail dengan position: fixed agar tidak pernah
 * terpotong oleh overflow sidebar atau kontainer sekitarnya. Muncul saat hover
 * maupun keyboard focus-visible.
 */
interface TooltipTriggerProps {
  onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void
  onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLElement>) => void
}

function RailTooltip({
  label,
  children,
  enabled = true,
}: {
  label: string
  children: ReactElement<TooltipTriggerProps>
  enabled?: boolean
}) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  const updatePosition = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    setCoords({
      top: rect.top + rect.height / 2,
      left: rect.right + 10,
    })
  }

  if (!enabled) return children

  return (
    <>
      {cloneElement(children, {
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          updatePosition(e.currentTarget)
          setVisible(true)
          children.props.onMouseEnter?.(e)
        },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
          setVisible(false)
          children.props.onMouseLeave?.(e)
        },
        onFocus: (e: React.FocusEvent<HTMLElement>) => {
          updatePosition(e.currentTarget)
          setVisible(true)
          children.props.onFocus?.(e)
        },
        onBlur: (e: React.FocusEvent<HTMLElement>) => {
          setVisible(false)
          children.props.onBlur?.(e)
        },
      })}
      {visible &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
            className="pointer-events-none fixed z-[9999] -translate-y-1/2 whitespace-nowrap rounded-lg bg-primary px-2.5 py-1 text-hint font-medium text-primary-foreground shadow-lg transition-opacity animate-fade-in"
          >
            {label}
          </div>,
          document.body,
        )}
    </>
  )
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { resolvedTheme, toggleTheme } = useTheme()

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
    { label: 'Project Saya', path: '/projects', icon: <LayoutGrid className="size-5" /> },
    { label: 'Buat Website', path: '/projects/new', icon: <Plus className="size-5" /> },
  ]

  const isSettingsActive = pathname === '/settings'

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header rail: vertikal terpusat saat collapsed, horizontal saat expanded */}
      {collapsed ? (
        <div className="flex flex-col items-center pt-page pb-stack-sm shrink-0">
          <RailTooltip label="Nusa AI">
            <Link
              to="/projects"
              aria-label="Nusa AI"
              className="flex size-11 items-center justify-center rounded-xl text-primary hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 transition-colors"
            >
              <BrandLogo variant="mark" tone="auto" height={24} />
            </Link>
          </RailTooltip>

          <RailTooltip label="Buka sidebar">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              aria-label="Buka sidebar"
              aria-expanded={false}
              className="mt-3 size-11 rounded-xl text-muted-foreground hover:text-foreground focus-visible:!outline-2 focus-visible:!outline-ring focus-visible:!outline-offset-2 focus-visible:!ring-0 transition-colors"
            >
              <PanelLeft className="size-5" />
            </Button>
          </RailTooltip>
        </div>
      ) : (
        <div className="flex items-center justify-between px-stack pt-page pb-stack-sm shrink-0">
          <Link to="/projects" className="flex items-center gap-stack-sm" aria-label="Nusa AI">
            <BrandLogo variant="full" tone="auto" height={28} />

          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            aria-label="Tutup sidebar"
            aria-expanded={true}
            data-tip="Tutup sidebar"
            className="tip size-8 text-muted-foreground hover:text-foreground"
          >
            <PanelLeftClose className="size-4" />
          </Button>
        </div>
      )}

      {/* Navigasi: bila tinggi layar pendek, area tengah ini boleh scroll mandiri */}
      <nav
        className={cn(
          'flex flex-1 min-h-0 flex-col overflow-y-auto overflow-x-hidden py-stack',
          collapsed ? 'gap-2 items-center px-1' : 'gap-nav-gap px-stack-sm',
        )}
        aria-label="Navigasi utama"
      >
        {navItems.map((item) => {
          const active =
            item.path === '/projects' ? pathname === '/projects' : pathname.startsWith(item.path)

          if (collapsed) {
            return (
              <RailTooltip key={item.path} label={item.label}>
                <Link
                  to={item.path}
                  onClick={onCloseMobile}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'ctl flex size-11 items-center justify-center rounded-xl transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {item.icon}
                </Link>
              </RailTooltip>
            )
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'ctl flex min-h-nav-item items-center gap-stack rounded-lg px-control py-control-y text-control font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {item.icon}
              <span className="whitespace-nowrap transition-opacity duration-150">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer profil: avatar terpusat pada sumbu tengah yang sama dengan ikon */}
      <div
        className={cn(
          'mt-auto shrink-0 border-t border-border',
          collapsed ? 'pt-4 pb-4 px-1 flex flex-col items-center' : 'p-stack',
        )}
      >
        <div className="relative w-full flex justify-center" ref={accountMenuRef}>
          {collapsed ? (
            <RailTooltip label={`${user?.email ?? 'Akun saya'}, Akun saya`}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((v) => !v)}
                className={cn(
                  'ctl flex size-11 items-center justify-center rounded-xl transition-colors hover:bg-muted',
                  isSettingsActive && 'bg-primary/10 text-primary',
                )}
                aria-label="Menu akun"
                aria-expanded={accountMenuOpen}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-hint font-bold text-primary">
                  {(user?.email?.[0] ?? '?').toUpperCase()}
                </span>
              </button>
            </RailTooltip>
          ) : (
            <button
              type="button"
              onClick={() => setAccountMenuOpen((v) => !v)}
              className={cn(
                'ctl flex min-h-nav-item w-full items-center gap-stack-sm rounded-lg px-stack-sm py-stack-sm text-left hover:bg-muted',
                isSettingsActive && 'bg-primary/10 text-primary',
              )}
              aria-label="Menu akun"
              aria-expanded={accountMenuOpen}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-hint font-bold text-primary">
                {(user?.email?.[0] ?? '?').toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 whitespace-nowrap overflow-hidden transition-opacity duration-150">
                <span className="block truncate text-hint font-semibold">{user?.email ?? '…'}</span>
                <span className="block text-hint text-muted-foreground">Akun saya</span>
              </span>
            </button>
          )}

          {accountMenuOpen && (
            <div
              className={cn(
                'absolute z-50 mb-stack-sm w-56 rounded-xl border border-border bg-card p-stack-sm shadow-xl',
                collapsed ? 'bottom-full left-2' : 'bottom-full left-0',
              )}
            >
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
                {resolvedTheme === 'dark' ? <SunIcon className="size-3.5" /> : <MoonIcon className="size-3.5" />}
                {resolvedTheme === 'dark' ? 'Mode terang' : 'Mode gelap'}
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
          'hidden h-[100dvh] shrink-0 border-r border-border bg-card transition-[width] duration-200 ease-in-out md:flex md:flex-col',
          collapsed ? 'w-16' : 'w-[280px]',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
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

