import { createFileRoute } from '@tanstack/react-router'
import LandingPage from '@/Landing'
import { useDocumentTitle } from '@/hooks/use-document-title'

export const Route = createFileRoute('/')({
  component: LandingPageRoute,
})

function LandingPageRoute() {
  useDocumentTitle('Nusa AI | AI Website Builder')
  return <LandingPage />
}
