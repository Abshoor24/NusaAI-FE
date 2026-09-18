import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <>
      {/* Outlet adalah tempat halaman dirender, tanpa navbar & footer */}
      <Outlet />
    </>
  ),
})