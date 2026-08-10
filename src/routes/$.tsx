import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$')({
  component: NotFoundPage,
})

function NotFoundPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="mt-2 text-gray-600">Page not found.</p>
      <Link to="/" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
        Back to Home
      </Link>
    </section>
  )
}