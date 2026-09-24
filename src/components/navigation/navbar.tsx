import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { LogoIcon, MenuIcon, MoonIcon, SunIcon, XIcon } from '@/components/ui/icons'
import { siteConfig } from '@/config/site'
import { useTheme } from '@/hooks/use-theme'
import { isAuthenticated, authApi } from '@/lib/api/auth'
import { cn } from '@/lib/utils/cn'

const linkClasses =
  'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
const activeLinkClasses = 'text-foreground'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const authed = isAuthenticated()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = () => {
    authApi.logout()
    navigate({ to: '/login' })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>

      <Container>
        <div className="flex h-14 items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <LogoIcon className="size-5" />
            <span>{siteConfig.name}</span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-1 md:flex"
          >
            {siteConfig.navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={linkClasses}
                activeOptions={{ exact: item.exact }}
                activeProps={{ className: activeLinkClasses }}
              >
                {item.label}
              </Link>
            ))}
            {authed && (
              <Link
                to="/settings"
                className={linkClasses}
                activeProps={{ className: activeLinkClasses }}
              >
                Settings
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {authed ? (
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            ) : (
              <Button
                asChild
                variant="primary"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Link to="/login">Sign In</Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen((value) => !value)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <XIcon /> : <MenuIcon />}
            </Button>
          </div>
        </div>
      </Container>

      {mobileOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="animate-fade-up border-t border-border bg-background md:hidden motion-reduce:animate-none"
        >
          <Container className="flex flex-col gap-1 py-4">
            {siteConfig.navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(linkClasses, 'py-2.5')}
                activeOptions={{ exact: item.exact }}
                activeProps={{ className: activeLinkClasses }}
              >
                {item.label}
              </Link>
            ))}
            {authed ? (
              <>
                <Link
                  to="/settings"
                  className={cn(linkClasses, 'py-2.5')}
                  activeProps={{ className: activeLinkClasses }}
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className={cn(linkClasses, 'py-2.5 text-left text-destructive')}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={cn(linkClasses, 'py-2.5 text-primary font-semibold')}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className={cn(linkClasses, 'py-2.5')}
                >
                  Register
                </Link>
              </>
            )}
          </Container>
        </nav>
      )}
    </header>
  )
}