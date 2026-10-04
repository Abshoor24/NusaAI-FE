import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/projects')({
  component: ProjectsLayoutRoute,
})

/**
 * Layout induk /projects: hanya meneruskan ke route anak
 * (daftar di projects.index, form di projects.new, workspace di
 * projects.$projectId). WAJIB ada <Outlet/> — tanpanya halaman anak
 * tidak pernah tampil.
 */
function ProjectsLayoutRoute() {
  return <Outlet />
}
