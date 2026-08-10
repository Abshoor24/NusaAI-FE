import { createFileRoute } from '@tanstack/react-router'
import { HealthStatus } from '@/features/health/HealthStatus'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Home</h1>
      <p className="text-gray-600">Placeholder page.</p>
      <HealthStatus />
    </section>
  )
}