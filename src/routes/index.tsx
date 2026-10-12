import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/layout/footer'
import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Features } from '@/components/landing/Features'
import { Showcase } from '@/components/landing/Showcase'
import { RevisionBand } from '@/components/landing/RevisionBand'
import { Faq } from '@/components/landing/Faq'
import { FinalCta } from '@/components/landing/FinalCta'
import { useLandingReveal } from '@/components/landing/use-landing-reveal'
import type { LandingCta } from '@/components/landing/landing-data'
import { isAuthenticated } from '@/lib/api/auth'
import { useDocumentTitle } from '@/hooks/use-document-title'
import '@/components/landing/landing.css'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  useDocumentTitle('Pakhir Studio | Buat Website dengan AI')
  useLandingReveal()
  const authed = isAuthenticated()
  const cta: LandingCta = authed
    ? { to: '/projects', label: 'Buka Project Saya' }
    : { to: '/login', label: 'Mulai buat website' }

  return (
    <div className="landing flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero cta={cta} />
        <HowItWorks />
        <Features />
        <Showcase />
        <RevisionBand cta={cta} />
        <Faq />
        <FinalCta cta={cta} />
      </main>
      <Footer />
    </div>
  )
}
