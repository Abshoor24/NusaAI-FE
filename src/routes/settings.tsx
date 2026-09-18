import { createFileRoute } from '@tanstack/react-router'
import Settings from '../pages/Settings'

export const Route = createFileRoute('/settings')({
  component: Settings,
})

function RouteComponent() {
  return <div>Hello "/settings"!</div>
}
