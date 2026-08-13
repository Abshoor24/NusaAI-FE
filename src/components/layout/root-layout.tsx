import { Outlet } from '@tanstack/react-router'
import { Footer } from './footer'
import { Navbar } from '@/components/navigation/navbar'

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}