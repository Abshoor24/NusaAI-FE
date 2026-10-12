import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { LogoIcon, MenuIcon, MoonIcon, SunIcon, XIcon } from '@/components/ui/icons'
import { useTheme } from '@/hooks/use-theme'
import { isAuthenticated } from '@/lib/api/auth'

// Urutan dan label mengikuti referensi Figma (screenshot navbar).
// Semua href menunjuk ke section yang benar-benar ada di landing (R-24).
const LANDING_NAV_ITEMS = [
  { label: 'Fitur', href: '#fitur' },
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Contoh Hasil', href: '#contoh' },
  { label: 'FAQ', href: '#faq' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const authed = isAuthenticated()

  useEffect(() => {
    if (!mobileOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [mobileOpen])

  return (
    // Permukaan gelap permanen di kedua tema, sesuai referensi Figma yang
    // hanya menyediakan varian gelap (R-31: navbar gelap = identitas Figma,
    // kontras putih di atas #050505 lolos di mode terang maupun gelap).
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050505] text-white">
      <Container>
        <div className="flex h-16 items-center justify-between gap-stack md:h-20">
          <Link
            to="/"
            className="ctl flex items-center gap-stack-sm text-body font-bold text-white transition-opacity hover:opacity-80"
          >
            <span className="grid size-9 place-items-center rounded-[10px] bg-white text-black">
              <LogoIcon className="size-5" />
            </span>
            <span className="text-[17px] tracking-tight whitespace-nowrap">Pakhir Studio</span>
          </Link>

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-8 md:flex"
          >
            {LANDING_NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="ctl inline-flex min-h-nav-item items-center text-[15px] font-medium text-zinc-400 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
              className="min-h-control-min min-w-control-min rounded-xl text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              {theme === 'dark' ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
            </Button>

            {/* Tombol pil putih sesuai Figma. Link polos (bukan Button)
                supaya `hidden` pada layar kecil tidak tertimpa display
                bawaan Button dan tinggi pil bisa mengikuti referensi. */}
            <Link
              to={authed ? '/projects' : '/login'}
              className="ctl hidden min-h-[3.25rem] items-center rounded-full bg-white px-8 text-[15px] font-semibold text-black transition-colors hover:bg-zinc-200 sm:inline-flex"
            >
              Buka Aplikasi
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="min-h-control-min min-w-control-min rounded-xl text-zinc-300 hover:bg-white/10 hover:text-white md:hidden"
              onClick={() => setMobileOpen((value) => !value)}
              aria-expanded={mobileOpen}
              aria-controls="navigasi-seluler"
              aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            >
              {mobileOpen ? <XIcon className="size-4" /> : <MenuIcon className="size-4" />}
            </Button>
          </div>
        </div>
      </Container>

      {mobileOpen && (
        <nav
          id="navigasi-seluler"
          aria-label="Navigasi seluler"
          className="border-t border-white/10 bg-[#050505] md:hidden"
        >
          <Container className="flex flex-col gap-stack-sm py-stack">
            {LANDING_NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="ctl flex min-h-nav-item items-center rounded-lg px-control text-control font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <div className="border-t border-white/10 pt-stack">
              <Link
                to={authed ? '/projects' : '/login'}
                onClick={() => setMobileOpen(false)}
                className="ctl flex min-h-nav-item w-full items-center justify-center rounded-full bg-white px-4 text-control font-semibold text-black"
              >
                Buka Aplikasi
              </Link>
            </div>
          </Container>
        </nav>
      )}
    </header>
  )
}
