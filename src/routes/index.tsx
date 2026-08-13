import { createFileRoute } from '@tanstack/react-router'
import { HealthStatus } from '@/components/dev/health-status'
import { CTA } from '@/components/sections/cta'
import { CardGrid } from '@/components/sections/card-grid'
import { FeatureGrid } from '@/components/sections/feature-grid'
import { Hero } from '@/components/sections/hero'
import { Section } from '@/components/sections/section'
import { SectionHeader } from '@/components/sections/section-header'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'

export const Route = createFileRoute('/')({
  component: HomePage,
})

const features = [
  {
    title: 'Feature One',
    description: 'Placeholder description for the first feature. Replace with real content.',
  },
  {
    title: 'Feature Two',
    description: 'Placeholder description for the second feature. Replace with real content.',
  },
  {
    title: 'Feature Three',
    description: 'Placeholder description for the third feature. Replace with real content.',
  },
]

const cards = [
  {
    title: 'Card One',
    description: 'Placeholder description for the first card.',
    badge: 'Placeholder',
  },
  {
    title: 'Card Two',
    description: 'Placeholder description for the second card.',
    badge: 'Placeholder',
  },
  {
    title: 'Card Three',
    description: 'Placeholder description for the third card.',
    badge: 'Placeholder',
  },
]

function HomePage() {
  return (
    <>
      <Container>
        <Hero
          eyebrow="Placeholder"
          title="Your Heading"
          description="Your Description. Replace this placeholder copy once your client requirements are defined."
          primaryAction={<Button size="lg">Primary Action</Button>}
          secondaryAction={
            <Button size="lg" variant="outline">
              Secondary Action
            </Button>
          }
        />
      </Container>

      <Section className="animate-fade-up motion-reduce:animate-none">
        <Container className="flex flex-col gap-10">
          <SectionHeader
            eyebrow="Features"
            title="Your Feature Section"
            description="Placeholder copy for a generic feature section."
          />
          <FeatureGrid items={features} />
        </Container>
      </Section>

      <Section className="animate-fade-up motion-reduce:animate-none">
        <Container className="flex flex-col gap-10">
          <SectionHeader
            eyebrow="Cards"
            title="Your Card Section"
            description="Placeholder copy for a generic card grid."
          />
          <CardGrid items={cards} />
        </Container>
      </Section>

      <Section className="animate-fade-up motion-reduce:animate-none">
        <Container className="flex flex-col gap-10">
          <SectionHeader
            eyebrow="Development"
            title="Backend Connectivity"
            description="This card only verifies that the API layer can reach the backend."
          />
          <div className="mx-auto w-full max-w-xl">
            <HealthStatus />
          </div>
        </Container>
      </Section>

      <Section className="animate-fade-up motion-reduce:animate-none">
        <Container>
          <CTA
            title="Your Call to Action"
            description="Placeholder copy for a call to action. Replace with real content."
            primaryAction={<Button size="lg">Primary Action</Button>}
            secondaryAction={
              <Button size="lg" variant="outline">
                Secondary Action
              </Button>
            }
          />
        </Container>
      </Section>
    </>
  )
}