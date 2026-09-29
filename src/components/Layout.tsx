import type { ReactNode } from 'react'
import { Outlet } from '@tanstack/react-router'
import { Navbar } from './Navbar'
import { Footer } from './layout/footer'

interface LayoutProps {
  children?: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navbar />
      <main id="main-content" className="flex-1 flex flex-col w-full">
        {children ?? <Outlet />}
      </main>
      <Footer />
    </div>
  )
}
