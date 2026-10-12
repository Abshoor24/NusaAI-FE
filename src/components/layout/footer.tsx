import { Link } from '@tanstack/react-router'
import { Container } from '@/components/ui/container'
import { LogoIcon } from '@/components/ui/icons'
import { Separator } from '@/components/ui/separator'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils/cn'

export function Footer() {
  const year = new Date().getFullYear()
  const hasSocials = siteConfig.socials.length > 0

  return (
    <footer className="border-t border-border bg-muted/50">
      <Container className="py-section-sm">
        {/* Kolom sosial hanya ada bila ada tautan asli, jadi jumlah kolom
            menyesuaikan agar tidak ada slot kosong di kanan bawah. */}
        <div
          className={cn(
            'grid gap-stack-md sm:grid-cols-2',
            hasSocials ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
          )}
        >
          <div className="space-y-stack">
            <div className="flex items-center gap-stack-sm text-control font-semibold">
              <LogoIcon className="size-4" />
              <span>{siteConfig.name}</span>
            </div>
            <p className="max-w-prose text-control text-muted-foreground">{siteConfig.description}</p>
          </div>

          <div className="space-y-stack">
            <h3 className="text-control font-semibold">Navigasi</h3>
            <ul className="space-y-stack">
              {siteConfig.navItems.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="inline-flex min-h-nav-item items-center px-stack-sm text-control text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="space-y-stack border-t border-border pt-stack">
              {[
                { label: 'Cara Kerja', href: '#cara-kerja' },
                { label: 'Fitur', href: '#fitur' },
                { label: 'Contoh', href: '#contoh' },
                { label: 'FAQ', href: '#faq' },
              ].map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex min-h-nav-item items-center px-stack-sm text-control text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-stack">
            <h3 className="text-control font-semibold">Kontak</h3>
            <ul className="space-y-stack-sm text-control text-muted-foreground">
              <li>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="inline-flex min-h-nav-item items-center px-stack-sm transition-colors hover:text-foreground"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
              <li className="flex min-h-nav-item items-center">{siteConfig.contact.address}</li>
            </ul>
          </div>

          {/* Kolom sosial hanya dirender bila ada tautan asli. Tidak ada
              kalimat placeholder: lebih baik kolom tidak ada daripada
              menampilkan teks yang bukan isi produk (R-38). */}
          {hasSocials && (
            <div className="space-y-stack">
              <h3 className="text-control font-semibold">Ikuti</h3>
              <ul className="space-y-stack-sm">
                {siteConfig.socials.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-nav-item items-center px-stack-sm text-control text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Separator className="my-section-sm" />

        <p className="text-control text-muted-foreground">
          &copy; {year} {siteConfig.name}. Semua hak dilindungi.
        </p>
      </Container>
    </footer>
  )
}