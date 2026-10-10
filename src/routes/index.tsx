import { createFileRoute, Link } from '@tanstack/react-router'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/layout/footer'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/sections/section'
import { SectionHeader } from '@/components/sections/section-header'
import { isAuthenticated } from '@/lib/api/auth'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { Globe, PenLine, Eye, Download, ArrowRight, CheckCircle2 } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  useDocumentTitle('Pakhir Studio | Buat Website dengan AI')
  const authed = isAuthenticated()

  const steps = [
    {
      icon: <PenLine className="w-5 h-5 text-primary" />,
      title: 'Isi brief',
      description: 'Ceritakan usahamu, lalu pilih jenis website, gaya, warna, dan bagian yang kamu mau.',
    },
    {
      icon: <Globe className="w-5 h-5 text-primary" />,
      title: 'AI menulis websitenya',
      description: 'AI menyusun satu file HTML, dan kamu bisa melihat prosesnya langsung.',
    },
    {
      icon: <Eye className="w-5 h-5 text-primary" />,
      title: 'Lihat dan revisi',
      description:
        'Cek hasilnya di tampilan HP, tablet, dan komputer. Tulis revisi dengan kalimat biasa, tiap revisi tersimpan sebagai versi baru.',
    },
    {
      icon: <Download className="w-5 h-5 text-primary" />,
      title: 'Unduh file HTML',
      description: 'Satu file HTML yang bisa langsung dibuka di browser.',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      <main className="flex-1">
        <Section className="bg-gradient-to-b from-primary/5 via-background to-background border-b border-border/40">
          <Container className="flex flex-col items-center text-center max-w-4xl">
            <h1 className="text-display font-extrabold tracking-tight text-foreground mb-section-sm">
              Website seperti apa yang <span className="text-primary">ingin kamu buat?</span>
            </h1>

            <p className="text-body text-muted-foreground max-w-prose mb-section">
              Ceritakan website yang kamu inginkan. AI membuat satu file HTML, kamu revisi dengan
              kalimat biasa, lalu unduh hasilnya.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-stack w-full sm:w-auto">
              <Link
                to={authed ? '/projects' : '/login'}
                className="ctl flex min-h-control-min w-full sm:w-auto inline-flex items-center justify-center gap-stack-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-control-y px-8 rounded-xl transition-all shadow-md hover:shadow-lg text-control group"
              >
                <span>{authed ? 'Buka Project Saya' : 'Mulai buat website'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Container>
        </Section>

        <Section id="cara-kerja" className="border-b border-border/40">
          <Container>
            <SectionHeader
              eyebrow="Cara Kerja"
              title="Dari ide sampai file HTML"
              description="Isi brief, lihat pratinjaunya, revisi, lalu unduh."
              align="center"
              className="mb-section"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-md">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-card p-panel rounded-2xl border border-border flex flex-col items-start transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="bg-primary/10 p-stack rounded-xl mb-stack text-primary">
                    {step.icon}
                  </div>
                  <h3 className="text-body font-semibold text-foreground mb-stack-sm tracking-tight">
                    {idx + 1}. {step.title}
                  </h3>
                  <p className="text-muted-foreground text-control">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        <Section id="tentang" className="bg-muted/30 border-b border-border/40">
          <Container className="max-w-4xl">
            <SectionHeader
              eyebrow="Tentang"
              title="Hasilnya satu file HTML, revisi tidak menghapus versi lama"
              description="Setiap website tersimpan sebagai riwayat versi. Revisi tidak pernah menghapus versi lama."
              align="center"
              className="mb-section-sm"
            />

            <div className="bg-card p-panel-lg rounded-3xl border border-border shadow-xs">
              <ul className="space-y-stack text-control text-foreground pt-stack-sm">
                <li className="flex items-center gap-stack-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Cocok untuk landing page, portofolio, company profile, toko online sederhana, dan blog</span>
                </li>
                <li className="flex items-center gap-stack-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Gambar referensi (logo, contoh desain) bisa dilampirkan saat generate</span>
                </li>
                <li className="flex items-center gap-stack-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Pratinjau aman di mobile, tablet, dan desktop</span>
                </li>
              </ul>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  )
}
