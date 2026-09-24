import { createRootRoute, Outlet, redirect } from '@tanstack/react-router'
import { getToken } from '@/lib/api/token'

const PUBLIC_ROUTES = ['/', '/login', '/register', '/about', '/contact']

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route === '/') {
      return pathname === '/'
    }
    return pathname === route || pathname.startsWith(`${route}/`)
  })
}

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const isPublic = isPublicRoute(location.pathname)
    const token = getToken()

    if (!isPublic && !token) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: () => (
    <>
      <Outlet />
    </>
  ),
})