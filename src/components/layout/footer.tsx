import { Link } from '@tanstack/react-router'
import { Container } from '@/components/ui/container'
import { LogoIcon } from '@/components/ui/icons'
import { Separator } from '@/components/ui/separator'
import { siteConfig } from '@/config/site'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-muted/50">
      <Container className="py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <LogoIcon className="size-4" />
              <span>{siteConfig.name}</span>
            </div>
            <p className="text-sm text-muted-foreground">{siteConfig.description}</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Navigation</h3>
            <ul className="space-y-2">
              {siteConfig.navItems.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="transition-colors hover:text-foreground"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
              <li>{siteConfig.contact.address}</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Follow</h3>
            {siteConfig.socials.length > 0 ? (
              <ul className="space-y-2">
                {siteConfig.socials.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Add your social links here.</p>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        <p className="text-sm text-muted-foreground">
          &copy; {year} {siteConfig.name}. All rights reserved.
        </p>
      </Container>
    </footer>
  )
}