import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { LogoIcon, MenuIcon, MoonIcon, SunIcon, XIcon } from '@/components/ui/icons'
import { useTheme } from '@/hooks/use-theme'
import { isAuthenticated } from '@/lib/api/auth'

const LANDING_NAV_ITEMS = [
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Tentang', href: '#tentang' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const authed = isAuthenticated()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between gap-stack">
          <Link
            to="/"
            className="ctl flex items-center gap-stack-sm text-body font-bold text-foreground hover:opacity-80 transition-opacity"
          >
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <LogoIcon className="size-4" />
            </div>
            <span className="tracking-tight">Pakhir Studio</span>
          </Link>

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-stack-md md:flex"
          >
            {LANDING_NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="ctl inline-flex min-h-nav-item items-center text-control font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-stack">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
              className="min-h-control-min min-w-control-min rounded-xl"
            >
              {theme === 'dark' ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
            </Button>

            {authed ? (
              <Button
                asChild
                variant="primary"
                size="sm"
                className="hidden sm:inline-flex rounded-xl px-4"
              >
                <Link to="/projects">Buka Aplikasi</Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="primary"
                size="sm"
                className="hidden sm:inline-flex rounded-xl px-4"
              >
                <Link to="/login">Masuk</Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden min-h-control-min min-w-control-min rounded-xl"
              onClick={() => setMobileOpen((value) => !value)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            >
              {mobileOpen ? <XIcon className="size-4" /> : <MenuIcon className="size-4" />}
            </Button>
          </div>
        </div>
      </Container>

      {mobileOpen && (
        <nav
          aria-label="Navigasi seluler"
          className="border-t border-border bg-background md:hidden"
        >
          <Container className="flex flex-col gap-stack-sm py-stack">
            {LANDING_NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="ctl flex min-h-nav-item items-center rounded-lg px-control text-control font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-stack border-t border-border">
              {authed ? (
                <Link
                  to="/projects"
                  onClick={() => setMobileOpen(false)}
                  className="ctl flex min-h-nav-item w-full items-center justify-center rounded-xl bg-primary px-4 text-control font-semibold text-primary-foreground shadow-xs"
                >
                  Buka Aplikasi
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="ctl flex min-h-nav-item w-full items-center justify-center rounded-xl bg-primary px-4 text-control font-semibold text-primary-foreground shadow-xs"
                >
                  Masuk
                </Link>
              )}
            </div>
          </Container>
        </nav>
      )}
    </header>
  )
}
