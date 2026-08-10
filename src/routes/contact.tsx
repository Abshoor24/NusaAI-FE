import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/contact')({
  component: ContactPage,
})

function ContactPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Contact</h1>
      <p className="mt-2 text-gray-600">Placeholder page.</p>
    </section>
  )
}