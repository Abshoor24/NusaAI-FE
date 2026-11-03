import { createFileRoute } from '@tanstack/react-router'
import LandingPage from '@/Landing'
import { useDocumentTitle } from '@/hooks/use-document-title'

export const Route = createFileRoute('/')({
  component: LandingPageRoute,
})

function LandingPageRoute() {
  useDocumentTitle('Pakhir Studio | AI Website Builder')
  return <LandingPage />
}
