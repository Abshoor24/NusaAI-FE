import { createFileRoute, Link } from '@tanstack/react-router'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/layout/footer'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/sections/section'
import { SectionHeader } from '@/components/sections/section-header'
import { isAuthenticated } from '@/lib/api/auth'
import { Globe, PenLine, Eye, Download, ArrowRight, CheckCircle2 } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const authed = isAuthenticated()

  const steps = [
    {
      icon: <PenLine className="w-5 h-5 text-primary" />,
      title: 'Jelaskan Keinginanmu',
      description: 'Isi brief: deskripsi, jenis website, gaya, warna, bahasa, dan bagian yang diinginkan.',
    },
    {
      icon: <Globe className="w-5 h-5 text-primary" />,
      title: 'AI Membuatkan Website',
      description: 'AI menulis satu file HTML mandiri. Progresnya terlihat langsung secara real-time.',
    },
    {
      icon: <Eye className="w-5 h-5 text-primary" />,
      title: 'Pratinjau & Revisi',
      description: 'Lihat pratinjau mobile, tablet, dan desktop. Revisi lewat instruksi teks, tiap revisi jadi versi baru.',
    },
    {
      icon: <Download className="w-5 h-5 text-primary" />,
      title: 'Unduh .html',
      description: 'Puas dengan hasilnya? Unduh sebagai satu file HTML siap pakai.',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      <main className="flex-1">
        <Section className="py-20 md:py-28 bg-gradient-to-b from-primary/5 via-background to-background border-b border-border/40">
          <Container className="flex flex-col items-center text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6">
              <Globe className="w-3.5 h-3.5" />
              <span>AI Website Generator</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15] mb-6">
              Website seperti apa yang <span className="text-primary">ingin kamu buat?</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10">
              Jelaskan idemu dalam Bahasa Indonesia, AI akan membuatkan websitenya.
              Revisi dengan kalimat biasa, lalu unduh hasilnya.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Link
                to={authed ? '/projects' : '/login'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg text-sm group"
              >
                <span>{authed ? 'Buka Project Saya' : 'Mulai Sekarang'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Container>
        </Section>

        <Section id="cara-kerja" className="py-20 border-b border-border/40">
          <Container>
            <SectionHeader
              eyebrow="Cara Kerja"
              title="Dari ide menjadi website dalam hitungan menit"
              description="Alur sederhana: brief, generate, pratinjau, revisi, unduh."
              align="center"
              className="mb-16"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-card p-6 rounded-2xl border border-border flex flex-col items-start transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="bg-primary/10 p-3 rounded-xl mb-4 text-primary">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight">
                    {idx + 1}. {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        <Section id="tentang" className="py-20 bg-muted/30 border-b border-border/40">
          <Container className="max-w-4xl">
            <SectionHeader
              eyebrow="Tentang"
              title="Satu file HTML, bebas revisi"
              description="Setiap website tersimpan sebagai riwayat versi. Revisi tidak pernah menghapus versi lama."
              align="center"
              className="mb-12"
            />

            <div className="bg-card p-8 rounded-3xl border border-border shadow-xs">
              <ul className="space-y-2.5 text-sm text-foreground pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Cocok untuk landing page, portofolio, company profile, toko online sederhana, dan blog</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Gambar referensi (logo, contoh desain) bisa dilampirkan saat generate</span>
                </li>
                <li className="flex items-center gap-2">
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
