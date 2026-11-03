import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/new-project')({
  beforeLoad: () => {
    throw redirect({ to: '/projects/new' })
  },
})
