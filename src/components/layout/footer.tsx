import { Link } from '@tanstack/react-router'
import { LogoIcon } from '@/components/ui/icons'
import { siteConfig } from '@/config/site'

/**
 * Footer gelap sesuai referensi Figma: tiga kolom (brand, Navigasi,
 * Kontak) dan bar bawah dengan hak cipta + tagline.
 * Gelap permanen di kedua tema, sama seperti navbar dan hero (R-31:
 * mengikuti identitas Figma; kontras lolos di mode terang maupun gelap).
 */
export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[#050505] text-white">
      <div className="mx-auto w-full max-w-6xl px-page-x pt-section-sm">
        <div className="grid gap-10 pb-16 md:grid-cols-[1.4fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-stack-sm text-control font-bold">
              <span className="grid size-9 place-items-center rounded-[10px] bg-white text-black">
                <LogoIcon className="size-5" />
              </span>
              <span className="text-[17px] tracking-tight whitespace-nowrap">{siteConfig.name}</span>
            </div>
            <p className="mt-6 max-w-prose text-body leading-relaxed text-zinc-400">
              {siteConfig.description}
            </p>
          </div>

          <nav aria-label="Navigasi footer">
            <h3 className="text-control font-semibold text-white">Navigasi</h3>
            <ul className="mt-8 space-y-6">
              {siteConfig.navItems.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="ctl inline-flex min-h-nav-item items-center text-control text-zinc-400 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-control font-semibold text-white">Kontak</h3>
            <ul className="mt-8 space-y-6 text-control text-zinc-400">
              <li>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="ctl inline-flex min-h-nav-item items-center transition-colors hover:text-white"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
              <li className="flex min-h-nav-item items-center">{siteConfig.contact.address}</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-8 text-hint text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {siteConfig.name}. Semua hak dilindungi.
          </p>
          <p>Dibuat untuk ide-ide yang layak diwujudkan.</p>
        </div>
      </div>
    </footer>
  )
}
