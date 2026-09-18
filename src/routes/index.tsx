import { createFileRoute } from '@tanstack/react-router'
import WelcomeOnboarding from '../pages/WelcomeOnboarding'
import Dashboard from '@/pages/Dashboard'

export const Route = createFileRoute('/')({
  component: WelcomeOnboarding,
})