import { createFileRoute } from '@tanstack/react-router'
import { Section } from '@/components/sections/section'
import { SectionHeader } from '@/components/sections/section-header'
import { Container } from '@/components/ui/container'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <Section>
      <Container>
        <SectionHeader
          eyebrow="Placeholder"
          title="About"
          description="This is a placeholder page. Replace it with real content once your client requirements are defined."
          align="left"
        />
      </Container>
    </Section>
  )
}