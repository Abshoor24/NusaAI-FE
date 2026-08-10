import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">About</h1>
      <p className="mt-2 text-gray-600">Placeholder page.</p>
    </section>
  )
}