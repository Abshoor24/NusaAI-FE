import { createFileRoute } from '@tanstack/react-router'
import WelcomeOnboarding from '../pages/WelcomeOnboarding'

export const Route = createFileRoute('/')({
  component: WelcomeOnboarding,
})