import { Outlet } from '@tanstack/react-router'
import { Footer } from './Footer'
import { Navbar } from './Navbar'

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}