import { createFileRoute, Link } from '@tanstack/react-router'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/layout/footer'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/sections/section'
import { SectionHeader } from '@/components/sections/section-header'
import { isAuthenticated } from '@/lib/api/auth'
import { Cpu, Code2, Globe, FileText, Network, ArrowRight, Mail, MapPin, CheckCircle2 } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const authed = isAuthenticated()

  const features = [
    {
      icon: <Network className="w-5 h-5 text-primary" />,
      title: 'AI Chat Assistant',
      description: 'Engage in intelligent multi-turn conversations powered by cutting-edge LLMs with SSE streaming.',
    },
    {
      icon: <FileText className="w-5 h-5 text-primary" />,
      title: 'RAG Knowledge Base',
      description: 'Ingest PDF, DOCX, or TXT documents to provide contextual data and precise factual answers.',
    },
    {
      icon: <Code2 className="w-5 h-5 text-primary" />,
      title: 'Integrated Code Sandbox',
      description: 'Automatically run Python, JavaScript, and Go code blocks in an isolated container directly within chat.',
    },
    {
      icon: <Globe className="w-5 h-5 text-primary" />,
      title: 'Multimodal Capabilities',
      description: 'Attach images to your chat prompts for visual analysis and multi-modal AI reasoning.',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <Section className="py-20 md:py-28 bg-gradient-to-b from-primary/5 via-background to-background border-b border-border/40">
          <Container className="flex flex-col items-center text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6">
              <Cpu className="w-3.5 h-3.5" />
              <span>Next-Gen AI Platform</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15] mb-6">
              Empower Your Workflow with <span className="text-primary">nusaAI Platform</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10">
              An intelligent conversational assistant featuring RAG document knowledge retrieval and live code execution sandbox.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Link
                to={authed ? '/chat' : '/login'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg text-sm group"
              >
                <span>{authed ? 'Open App Workspace' : 'Get Started Now'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Container>
        </Section>

        {/* Features Section */}
        <Section id="features" className="py-20 border-b border-border/40">
          <Container>
            <SectionHeader
              eyebrow="Capabilities"
              title="Everything you need in one AI workspace"
              description="Designed for developers and teams requiring speed, accuracy, and built-in code execution."
              align="center"
              className="mb-16"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-card p-6 rounded-2xl border border-border flex flex-col items-start transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="bg-primary/10 p-3 rounded-xl mb-4 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </Section>

        {/* About Section */}
        <Section id="about" className="py-20 bg-muted/30 border-b border-border/40">
          <Container className="max-w-4xl">
            <SectionHeader
              eyebrow="About Us"
              title="Built for modern developer productivity"
              description="nusaAI Platform unifies multi-model AI, internal knowledge sources, and instant code execution into a single, seamless user interface."
              align="center"
              className="mb-12"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-card p-8 rounded-3xl border border-border shadow-xs">
              <div className="space-y-4">
                <h3 className="text-xl font-bold tracking-tight">Why nusaAI Platform?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Traditional chat apps force developers to switch back and forth between AI tools, document viewers, and terminal environments. nusaAI Platform integrates everything into an interactive workspace.
                </p>
                <ul className="space-y-2.5 text-sm text-foreground pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>Real-time token streaming with server-sent events (SSE)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>Direct code execution in Python, JS, and Go</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>Private RAG document indexing and retrieval</span>
                  </li>
                </ul>
              </div>

              <div className="bg-muted/60 p-6 rounded-2xl border border-border space-y-4">
                <div className="flex items-center gap-3">
                  <Cpu className="w-8 h-8 text-primary" />
                  <div>
                    <div className="text-sm font-bold">nusaAI Engine</div>
                    <div className="text-xs text-muted-foreground">Version 2.0 Ready</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Powered by high-performance backend infrastructure with robust security sandboxing for executing code safely.
                </p>
              </div>
            </div>
          </Container>
        </Section>

        {/* Contact Section */}
        <Section id="contact" className="py-20">
          <Container className="max-w-4xl">
            <SectionHeader
              eyebrow="Get in Touch"
              title="Contact & Support"
              description="Have questions or feedback about nusaAI Platform? We would love to hear from you."
              align="center"
              className="mb-12"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card p-6 rounded-2xl border border-border flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-semibold mb-1">Email Us</h4>
                  <p className="text-xs text-muted-foreground mb-3">Send us your inquiries or support requests.</p>
                  <a href="mailto:support@nusaai.com" className="text-sm font-medium text-primary hover:underline">
                    support@nusaai.com
                  </a>
                </div>
              </div>

              <div className="bg-card p-6 rounded-2xl border border-border flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-semibold mb-1">Office Location</h4>
                  <p className="text-xs text-muted-foreground mb-3">nusaAI Platform Engineering Team</p>
                  <p className="text-xs font-medium text-foreground">
                    Jakarta, Indonesia
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  )
}
